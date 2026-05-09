const express = require('express');
const { AlipaySdk } = require('alipay-sdk');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();

let _alipaySdk = null;
function getAlipaySdk() {
  if (!_alipaySdk) {
    const appId = process.env.ALIPAY_APP_ID;
    if (!appId) throw new Error('支付宝未配置，请在 .env 中设置 ALIPAY_APP_ID');
    _alipaySdk = new AlipaySdk({
      appId,
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
      charset: 'utf-8',
      timeout: 30000
    });
  }
  return _alipaySdk;
}

const ALIPAY_NOTIFY_URL = process.env.ALIPAY_NOTIFY_URL || '';
const ALIPAY_RETURN_URL = process.env.ALIPAY_RETURN_URL || '';

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LM${ts}${rand}`;
}

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { productId, payMethod } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: '缺少商品ID' });

    const [products] = await pool.query(
      'SELECT id, name, price, product_type FROM products WHERE id = ? AND is_active = 1',
      [productId]
    );
    if (products.length === 0) return res.status(404).json({ success: false, message: '商品不存在' });

    const product = products[0];

    const [existing] = await pool.query(
      "SELECT id, order_no, status FROM orders WHERE user_id = ? AND product_id = ? AND status IN ('pending', 'paid') ORDER BY created_at DESC LIMIT 1",
      [req.user.id, productId]
    );
    if (existing.length > 0 && existing[0].status === 'paid') {
      return res.json({ success: false, message: '您已购买过该商品', alreadyPurchased: true });
    }

    const orderNo = existing.length > 0 && existing[0].status === 'pending'
      ? existing[0].order_no
      : generateOrderNo();

    if (existing.length === 0 || existing[0].status !== 'pending') {
      await pool.query(
        'INSERT INTO orders (order_no, user_id, product_id, product_name, product_type, amount, status, pay_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderNo, req.user.id, productId, product.name, product.product_type || 'source', product.price, 'pending', payMethod || 'alipay_qr']
      );
    } else {
      await pool.query('UPDATE orders SET pay_method = ?, amount = ? WHERE order_no = ?', [payMethod || 'alipay_qr', product.price, orderNo]);
    }

    const productName = product.name.substring(0, 60);
    const amount = parseFloat(product.price).toFixed(2);

    if (payMethod === 'alipay_h5') {
      const result = await getAlipaySdk().pageExec('alipay.trade.wap.pay', {
        method: 'GET',
        bizContent: {
          out_trade_no: orderNo,
          total_amount: amount,
          subject: productName,
          product_code: 'QUICK_WAP_WAY',
        },
        notify_url: ALIPAY_NOTIFY_URL,
        return_url: ALIPAY_RETURN_URL,
      });
      return res.json({ success: true, payUrl: result, orderNo, amount });
    } else {
      const result = await getAlipaySdk().exec('alipay.trade.precreate', {
        bizContent: {
          out_trade_no: orderNo,
          total_amount: amount,
          subject: productName,
        },
        notify_url: ALIPAY_NOTIFY_URL,
      });
      if (result.qrCode) {
        return res.json({ success: true, qrCode: result.qrCode, orderNo, amount });
      } else {
        return res.status(500).json({ success: false, message: '获取支付二维码失败', detail: result });
      }
    }
  } catch (err) {
    console.error('创建订单失败:', err);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

router.post('/notify', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const params = req.body;
    const signOk = getAlipaySdk().checkNotifySign(params);
    if (!signOk) {
      console.error('支付宝回调验签失败');
      return res.send('fail');
    }

    const tradeStatus = params.trade_status;
    const orderNo = params.out_trade_no;
    const tradeNo = params.trade_no;

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const [orders] = await pool.query('SELECT id, status FROM orders WHERE order_no = ?', [orderNo]);
      if (orders.length > 0 && orders[0].status === 'pending') {
        await pool.query(
          'UPDATE orders SET status = ?, trade_no = ?, pay_method = ?, paid_at = NOW() WHERE order_no = ? AND status = ?',
          ['paid', tradeNo, 'alipay_qr', orderNo, 'pending']
        );
      }
    }

    res.send('success');
  } catch (err) {
    console.error('支付回调处理失败:', err);
    res.send('fail');
  }
});

router.get('/status/:orderNo', authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT order_no, status, amount, product_name, pay_method, trade_no, paid_at, created_at FROM orders WHERE order_no = ? AND user_id = ?',
      [req.params.orderNo, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: '订单不存在' });
    res.json({ success: true, order: orders[0] });
  } catch (err) {
    console.error('查询订单状态失败:', err);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const [orders] = await pool.query(
      `SELECT o.order_no, o.product_name, o.product_type, o.amount, o.status, o.pay_method, o.paid_at, o.created_at,
        p.id AS product_id, p.name AS product_name, p.category, p.images
       FROM orders o LEFT JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    );
    const [total] = await pool.query('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [req.user.id]);

    res.json({
      success: true,
      orders: orders.map(o => ({
        ...o,
        images: o.images ? (typeof o.images === 'string' ? JSON.parse(o.images) : o.images) : []
      })),
      total: total[0].count,
      page,
      pageSize
    });
  } catch (err) {
    console.error('获取我的订单失败:', err);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/check-purchased/:productId', authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT id FROM orders WHERE user_id = ? AND product_id = ? AND status = 'paid' LIMIT 1",
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, purchased: orders.length > 0 });
  } catch (err) {
    console.error('检查购买状态失败:', err);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

module.exports = router;

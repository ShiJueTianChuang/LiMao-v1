const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/', asyncHandler(async (req, res) => {
  const category = req.query.category || '';
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE is_active = 1';
  const params = [];
  if (category && category !== 'all') {
    where += ' AND category = ?';
    params.push(category);
  }

  const [products] = await pool.query(
    `SELECT * FROM products ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [total] = await pool.query(`SELECT COUNT(*) AS count FROM products ${where}`, params);

  res.json({
    success: true,
    products: products.map(p => ({
      ...p,
      images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : []
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: '产品不存在' });
  const p = rows[0];
  res.json({
    success: true,
    product: {
      ...p,
      images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : []
    }
  });
}));

router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: '名称和价格必填' });
  const [result] = await pool.query(
    'INSERT INTO products (name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description || '', category || '', product_type || 'source', price, original_price || null,
     images ? JSON.stringify(images) : null, demo_url || null, download_url || null,
     tags ? JSON.stringify(tags) : null, sort_order || 0]
  );
  res.json({ success: true, id: result.insertId });
}));

router.put('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order, is_active } = req.body;
  await pool.query(
    'UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), category=COALESCE(?,category), product_type=COALESCE(?,product_type), price=COALESCE(?,price), original_price=COALESCE(?,original_price), images=COALESCE(?,images), demo_url=COALESCE(?,demo_url), download_url=COALESCE(?,download_url), tags=COALESCE(?,tags), sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active) WHERE id=?',
    [name, description, category, product_type, price, original_price,
     images ? JSON.stringify(images) : undefined, demo_url, download_url,
     tags ? JSON.stringify(tags) : undefined, sort_order, is_active, req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;

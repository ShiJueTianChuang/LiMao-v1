const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware');

const BROADCAST_CALLBACK_KEY = Symbol.for('notification_broadcast');

let broadcastCallback = null;

router.setBroadcastCallback = function (cb) {
  broadcastCallback = cb;
};

function broadcast(notification) {
  if (broadcastCallback) {
    broadcastCallback(notification);
  }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, title, content, type, category, is_read, created_at
       FROM notifications
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取通知失败:', err);
    res.status(500).json({ success: false, message: '获取通知失败' });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [userId]
    );
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('获取未读数失败:', err);
    res.status(500).json({ success: false, message: '获取未读数失败' });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = parseInt(req.params.id);
    await pool.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
       WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [notifId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('标记已读失败:', err);
    res.status(500).json({ success: false, message: '标记已读失败' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = parseInt(req.params.id);
    await pool.query(
      `DELETE FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [notifId, userId]
    );
    res.json({ success: true, message: '通知已删除' });
  } catch (err) {
    console.error('删除通知失败:', err);
    res.status(500).json({ success: false, message: '删除通知失败' });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('全部已读失败:', err);
    res.status(500).json({ success: false, message: '全部已读失败' });
  }
});

router.delete('/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      `DELETE FROM notifications WHERE (user_id = ? OR user_id IS NULL)`,
      [userId]
    );
    res.json({ success: true, message: '所有通知已删除' });
  } catch (err) {
    console.error('清空通知失败:', err);
    res.status(500).json({ success: false, message: '清空通知失败' });
  }
});

router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.nickname, u.email
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       ORDER BY n.created_at DESC
       LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取通知列表失败:', err);
    res.status(500).json({ success: false, message: '获取通知列表失败' });
  }
});

router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '通知已删除' });
  } catch (err) {
    console.error('删除通知失败:', err);
    res.status(500).json({ success: false, message: '删除通知失败' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { user_id, title, content, type, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, content, type, category) VALUES (?, ?, ?, ?, ?)`,
      [user_id || null, title, content, type || 'info', category || 'system']
    );

    const [[notification]] = await pool.query(
      `SELECT id, user_id, title, content, type, category, is_read, created_at
       FROM notifications WHERE id = ?`,
      [result.insertId]
    );

    broadcast(notification);

    res.json({ success: true, data: notification });
  } catch (err) {
    console.error('创建通知失败:', err);
    res.status(500).json({ success: false, message: '创建通知失败' });
  }
});

async function createNotification({ user_id, title, content, type, category }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, content, type, category) VALUES (?, ?, ?, ?, ?)`,
      [user_id || null, title, content, type || 'info', category || 'system']
    );

    const [[notification]] = await pool.query(
      `SELECT id, user_id, title, content, type, category, is_read, created_at
       FROM notifications WHERE id = ?`,
      [result.insertId]
    );

    broadcast(notification);
    return notification;
  } catch (err) {
    console.error('创建通知失败:', err);
    return null;
  }
}

router.createNotification = createNotification;

module.exports = router;

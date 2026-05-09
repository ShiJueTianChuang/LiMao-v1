const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: '请先登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: '请先登录' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: '需要管理员权限' });
  next();
}

module.exports = { authMiddleware, adminMiddleware };

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { JWT_SECRET } = require('../config')

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' })
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权限' })
    }
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: '登录已过期' })
  }
}

router.get('/agreements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT type, title, content FROM agreements')
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('获取协议失败:', err)
    res.status(500).json({ success: false, message: '获取协议失败' })
  }
})

router.put('/agreements/:type', authAdmin, async (req, res) => {
  try {
    const { type } = req.params
    const { content } = req.body
    if (!['terms', 'privacy'].includes(type)) {
      return res.status(400).json({ success: false, message: '协议类型无效' })
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '协议内容不能为空' })
    }
    await pool.query(
      'UPDATE agreements SET content = ? WHERE type = ?',
      [content.trim(), type]
    )
    res.json({ success: true, message: '协议更新成功' })
  } catch (err) {
    console.error('更新协议失败:', err)
    res.status(500).json({ success: false, message: '更新协议失败' })
  }
})

module.exports = router

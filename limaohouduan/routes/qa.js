const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { JWT_SECRET } = require('../config')
const { createNotification } = require('./notifications')

function authUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ success: false, message: '请先登录' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { return res.status(401).json({ success: false, message: '登录已过期' }) }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: '需要管理员权限' })
  next()
}

router.get('/status', authUser, async (req, res) => {
  try {
    const [[{ status: lastStatus }]] = await pool.query(
      `SELECT status FROM qa_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.user.id]
    )

    const [[{ isApproved }]] = await pool.query(
      `SELECT COUNT(*) > 0 AS isApproved FROM qa_applications WHERE user_id = ? AND status = 'approved'`,
      [req.user.id]
    )

    const [[{ hasPending }]] = await pool.query(
      `SELECT COUNT(*) > 0 AS hasPending FROM qa_applications WHERE user_id = ? AND status = 'pending'`,
      [req.user.id]
    )

    res.json({
      success: true,
      data: {
        status: lastStatus || null,
        isApproved: Boolean(isApproved),
        hasPending: Boolean(hasPending)
      }
    })
  } catch (err) {
    console.error('[QA] 查询状态失败:', err)
    res.status(500).json({ success: false, message: '查询状态失败' })
  }
})

router.post('/apply', authUser, async (req, res) => {
  try {
    const { reason } = req.body

    const [existing] = await pool.query(
      "SELECT id, status FROM qa_applications WHERE user_id = ? AND status IN ('pending', 'approved')",
      [req.user.id]
    )
    if (existing.length > 0) {
      const label = existing[0].status === 'pending' ? '审核中' : '已通过'
      return res.status(400).json({ success: false, message: `你已有${label}的申请` })
    }

    const [revoked] = await pool.query(
      "SELECT id FROM qa_applications WHERE user_id = ? AND status = 'revoked'",
      [req.user.id]
    )
    if (revoked.length > 0) {
      await pool.query(
        "DELETE FROM qa_applications WHERE user_id = ? AND status = 'revoked'",
        [req.user.id]
      )
    }

    const [rejected] = await pool.query(
      "SELECT id FROM qa_applications WHERE user_id = ? AND status = 'rejected'",
      [req.user.id]
    )
    if (rejected.length > 0) {
      await pool.query(
        "DELETE FROM qa_applications WHERE user_id = ? AND status = 'rejected'",
        [req.user.id]
      )
    }

    const [userRows] = await pool.query('SELECT email, nickname FROM users WHERE id = ?', [req.user.id])
    if (userRows.length === 0) return res.status(404).json({ success: false, message: '用户不存在' })

    await pool.query(
      'INSERT INTO qa_applications (user_id, email, nickname, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, userRows[0].email, userRows[0].nickname || '', reason || '']
    )

    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'")
    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        title: '新智能问答申请',
        content: `用户 ${userRows[0].nickname || userRows[0].email} 提交了智能问答使用申请，请前往审核。`,
        type: 'info',
        category: 'application'
      })
    }

    res.json({ success: true, message: '申请已提交，请等待管理员审核' })
  } catch (err) {
    console.error('[QA] 申请失败:', err)
    res.status(500).json({ success: false, message: '申请失败' })
  }
})

router.get('/applications', authUser, adminOnly, async (req, res) => {
  try {
    const status = req.query.status || 'pending'
    let rows
    if (status === 'all') {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname
         FROM qa_applications a
         JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC`
      )
    } else {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname
         FROM qa_applications a
         JOIN users u ON a.user_id = u.id
         WHERE a.status = ?
         ORDER BY a.created_at DESC`,
        [status]
      )
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[QA] 查询申请列表失败:', err)
    res.status(500).json({ success: false, message: '查询失败' })
  }
})

router.post('/approve', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId } = req.body

    const [apps] = await pool.query('SELECT * FROM qa_applications WHERE id = ? AND status = ?', [applicationId, 'pending'])
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]

    await pool.query(
      `UPDATE qa_applications SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '智能问答申请已通过',
      content: `您的智能问答使用申请已通过，现在可以使用自定义模型功能！`,
      type: 'success',
      category: 'application'
    })

    res.json({ success: true, message: '已通过' })
  } catch (err) {
    console.error('[QA] 审批失败:', err)
    res.status(500).json({ success: false, message: '审批失败' })
  }
})

router.post('/cancel', authUser, async (req, res) => {
  try {
    const [apps] = await pool.query(
      "SELECT id FROM qa_applications WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '没有待审核的申请' })

    await pool.query(
      "DELETE FROM qa_applications WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    )

    res.json({ success: true, message: '申请已取消' })
  } catch (err) {
    console.error('[QA] 取消申请失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/reject', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId } = req.body

    const [apps] = await pool.query(
      "SELECT * FROM qa_applications WHERE id = ? AND status = 'pending'",
      [applicationId]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]

    await pool.query(
      "UPDATE qa_applications SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '智能问答申请未通过',
      content: `很抱歉，您的智能问答使用申请未通过审核，您可以重新提交申请。`,
      type: 'warning',
      category: 'application'
    })

    res.json({ success: true, message: '已拒绝' })
  } catch (err) {
    console.error('[QA] 拒绝失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/revoke', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId } = req.body

    const [apps] = await pool.query(
      "SELECT * FROM qa_applications WHERE id = ? AND status = 'approved'",
      [applicationId]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '未找到已通过的申请' })

    const application = apps[0]

    await pool.query(
      "UPDATE qa_applications SET status = 'revoked', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '智能问答权限已撤销',
      content: `您的智能问答使用权限已被管理员撤销。如有疑问请联系管理员，您也可以重新提交申请。`,
      type: 'warning',
      category: 'application'
    })

    res.json({ success: true, message: '已撤销' })
  } catch (err) {
    console.error('[QA] 撤销失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

module.exports = router

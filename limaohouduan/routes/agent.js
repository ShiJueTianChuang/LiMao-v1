const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { JWT_SECRET } = require('../config')
const { createNotification } = require('./notifications')

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 3; i++) {
    const part = crypto.randomBytes(4).toString('hex').slice(0, 4).toUpperCase()
    code += part + (i < 2 ? '-' : '')
  }
  return code
}

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
    const [rows] = await pool.query(
      "SELECT id FROM agent_applications WHERE user_id = ? AND status = 'approved' LIMIT 1",
      [req.user.id]
    )
    const hasAccess = rows.length > 0

    let quota = { monthly: { used: 0, limit: 0 }, total: { used: 0, limit: 0 } }
    if (hasAccess) {
      const [apps] = await pool.query(
        `SELECT a.invite_code_id, ic.quota_monthly, ic.quota_total
         FROM agent_applications a
         LEFT JOIN agent_invite_codes ic ON a.invite_code_id = ic.id
         WHERE a.user_id = ? AND a.status = 'approved'
         LIMIT 1`,
        [req.user.id]
      )
      if (apps.length > 0) {
        const app = apps[0]
        quota.monthly.limit = app.quota_monthly || 0
        quota.total.limit = app.quota_total || 0

        const thisMonth = new Date().toISOString().slice(0, 7) + '-01'
        const [monthlyUsage] = await pool.query(
          'SELECT SUM(used) as total FROM agent_quota_usage WHERE user_id = ? AND quota_type = ? AND period_start = ?',
          [req.user.id, 'monthly', thisMonth]
        )
        quota.monthly.used = monthlyUsage[0]?.total || 0

        const [totalUsage] = await pool.query(
          'SELECT SUM(used) as total FROM agent_quota_usage WHERE user_id = ? AND quota_type = ?',
          [req.user.id, 'total']
        )
        quota.total.used = totalUsage[0]?.total || 0
      }
    }

    const [pending] = await pool.query(
      "SELECT id FROM agent_applications WHERE user_id = ? AND status = 'pending' LIMIT 1",
      [req.user.id]
    )

    const [[{ lastStatus }]] = await pool.query(
      `SELECT status AS lastStatus FROM agent_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.user.id]
    )

    res.json({ success: true, data: { hasAccess, quota, hasPending: pending.length > 0, lastStatus: lastStatus || null } })
  } catch (err) {
    console.error('[Agent] 查询状态失败:', err)
    res.status(500).json({ success: false, message: '查询状态失败' })
  }
})

router.post('/apply', authUser, async (req, res) => {
  try {
    const { reason } = req.body

    const [existing] = await pool.query(
      "SELECT id, status FROM agent_applications WHERE user_id = ? AND status IN ('pending', 'approved')",
      [req.user.id]
    )
    if (existing.length > 0) {
      const label = existing[0].status === 'pending' ? '审核中' : '已通过'
      return res.status(400).json({ success: false, message: `你已有${label}的申请` })
    }

    const [revoked] = await pool.query(
      "SELECT id FROM agent_applications WHERE user_id = ? AND status = 'revoked'",
      [req.user.id]
    )
    if (revoked.length > 0) {
      await pool.query(
        "DELETE FROM agent_applications WHERE user_id = ? AND status = 'revoked'",
        [req.user.id]
      )
    }

    const [rejected] = await pool.query(
      "SELECT id FROM agent_applications WHERE user_id = ? AND status = 'rejected'",
      [req.user.id]
    )
    if (rejected.length > 0) {
      await pool.query(
        "DELETE FROM agent_applications WHERE user_id = ? AND status = 'rejected'",
        [req.user.id]
      )
    }

    const [userRows] = await pool.query('SELECT email, nickname FROM users WHERE id = ?', [req.user.id])
    if (userRows.length === 0) return res.status(404).json({ success: false, message: '用户不存在' })

    await pool.query(
      'INSERT INTO agent_applications (user_id, email, nickname, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, userRows[0].email, userRows[0].nickname || '', reason || '']
    )

    const [[application]] = await pool.query(
      'SELECT id FROM agent_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.user.id]
    )

    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'")
    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        title: '新智能体申请',
        content: `用户 ${userRows[0].nickname || userRows[0].email} 提交了智能体使用申请，请前往审核。`,
        type: 'info',
        category: 'application'
      })
    }

    res.json({ success: true, message: '申请已提交，请等待管理员审核' })
  } catch (err) {
    console.error('[Agent] 申请失败:', err)
    res.status(500).json({ success: false, message: '申请失败' })
  }
})

router.post('/redeem', authUser, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ success: false, message: '请输入邀请码' })

    const cleanCode = code.trim().toUpperCase()
    const [codes] = await pool.query(
      'SELECT * FROM agent_invite_codes WHERE code = ? AND is_active = 1',
      [cleanCode]
    )
    if (codes.length === 0) return res.status(400).json({ success: false, message: '邀请码无效' })

    const invite = codes[0]
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '邀请码已过期' })
    }
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      return res.status(400).json({ success: false, message: '邀请码已被用完' })
    }

    const [alreadyApproved] = await pool.query(
      'SELECT id FROM agent_applications WHERE user_id = ? AND status = ?',
      [req.user.id, 'approved']
    )
    if (alreadyApproved.length > 0) {
      return res.status(400).json({ success: false, message: '你已有智能体权限' })
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [existing] = await conn.query(
        'SELECT id FROM agent_applications WHERE user_id = ? AND status = ?',
        [req.user.id, 'pending']
      )

      const [userRows] = await conn.query('SELECT email, nickname FROM users WHERE id = ?', [req.user.id])

      if (existing.length > 0) {
        await conn.query(
          `UPDATE agent_applications SET status = 'approved', invite_code_id = ?, reviewed_by = ?, reviewed_at = NOW()
           WHERE id = ?`,
          [invite.id, req.user.id, existing[0].id]
        )
      } else {
        await conn.query(
          `INSERT INTO agent_applications (user_id, email, nickname, status, invite_code_id, reviewed_by, reviewed_at)
           VALUES (?, ?, ?, 'approved', ?, ?, NOW())`,
          [req.user.id, userRows[0]?.email || '', userRows[0]?.nickname || '', invite.id, req.user.id]
        )
      }

      await conn.query(
        'DELETE FROM agent_quota_usage WHERE user_id = ?',
        [req.user.id]
      )

      await conn.query(
        'UPDATE agent_invite_codes SET used_count = used_count + 1 WHERE id = ?',
        [invite.id]
      )

      await conn.commit()

      await createNotification({
        user_id: req.user.id,
        title: '邀请码兑换成功',
        content: `您已成功兑换邀请码 ${cleanCode}，智能体功能已可用！`,
        type: 'success',
        category: 'application'
      })

      res.json({
        success: true,
        message: '兑换成功，智能体已可用',
        data: {
          quotaMonthly: invite.quota_monthly,
          quotaTotal: invite.quota_total
        }
      })
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[Agent] 兑换失败:', err)
    res.status(500).json({ success: false, message: '兑换失败' })
  }
})

router.get('/applications', authUser, adminOnly, async (req, res) => {
  try {
    const status = req.query.status || 'pending'
    let rows
    if (status === 'all') {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname,
                ic.code, ic.quota_monthly, ic.quota_total
         FROM agent_applications a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN agent_invite_codes ic ON a.invite_code_id = ic.id
         ORDER BY a.created_at DESC`
      )
    } else {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname,
                ic.code, ic.quota_monthly, ic.quota_total
         FROM agent_applications a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN agent_invite_codes ic ON a.invite_code_id = ic.id
         WHERE a.status = ?
         ORDER BY a.created_at DESC`,
        [status]
      )
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[Agent] 查询申请列表失败:', err)
    res.status(500).json({ success: false, message: '查询失败' })
  }
})

router.post('/approve', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId, quotaMonthly, quotaTotal, maxUses, note } = req.body

    const [apps] = await pool.query('SELECT * FROM agent_applications WHERE id = ? AND status = ?', [applicationId, 'pending'])
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const code = generateCode()
      await conn.query(
        `INSERT INTO agent_invite_codes (code, created_by, max_uses, quota_monthly, quota_total, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, req.user.id, maxUses || 1, quotaMonthly || 0, quotaTotal || 0, note || '']
      )

      const [inviteResult] = await conn.query('SELECT LAST_INSERT_ID() as id')
      const inviteId = inviteResult[0].id

      await conn.query(
        `UPDATE agent_applications SET status = 'approved', invite_code_id = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [inviteId, req.user.id, applicationId]
      )

      await conn.query(
        'DELETE FROM agent_quota_usage WHERE user_id = ?',
        [application.user_id]
      )

      await conn.commit()

      await createNotification({
        user_id: application.user_id,
        title: '智能体申请已通过',
        content: `您的智能体使用申请已通过！您的邀请码是：${code}，每月配额 ${quotaMonthly || 0} 次。`,
        type: 'success',
        category: 'application'
      })

      res.json({ success: true, message: '已通过', data: { code, quotaMonthly, quotaTotal } })
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[Agent] 审批失败:', err)
    res.status(500).json({ success: false, message: '审批失败' })
  }
})

router.post('/cancel', authUser, async (req, res) => {
  try {
    const [apps] = await pool.query(
      "SELECT id FROM agent_applications WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '没有待审核的申请' })

    await pool.query(
      "DELETE FROM agent_applications WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    )

    res.json({ success: true, message: '申请已取消' })
  } catch (err) {
    console.error('[Agent] 取消申请失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/reject', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId } = req.body

    const [apps] = await pool.query(
      "SELECT * FROM agent_applications WHERE id = ? AND status = 'pending'",
      [applicationId]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]

    await pool.query(
      "UPDATE agent_applications SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '智能体申请未通过',
      content: `很抱歉，您的智能体使用申请未通过审核，您可以重新提交申请。`,
      type: 'warning',
      category: 'application'
    })

    res.json({ success: true, message: '已拒绝' })
  } catch (err) {
    console.error('[Agent] 拒绝失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/revoke', authUser, adminOnly, async (req, res) => {
  try {
    const { applicationId } = req.body

    const [apps] = await pool.query(
      "SELECT * FROM agent_applications WHERE id = ? AND status = 'approved'",
      [applicationId]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '未找到已通过的申请' })

    const application = apps[0]

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        "UPDATE agent_applications SET status = 'revoked', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        [req.user.id, applicationId]
      )

      if (application.invite_code_id) {
        await conn.query(
          "UPDATE agent_invite_codes SET is_active = 0 WHERE id = ?",
          [application.invite_code_id]
        )
      }

      await conn.query(
        "DELETE FROM agent_quota_usage WHERE user_id = ?",
        [application.user_id]
      )

      await conn.commit()

      await createNotification({
        user_id: application.user_id,
        title: '智能体权限已撤销',
        content: `您的智能体使用权限已被管理员撤销。如有疑问请联系管理员，您也可以重新提交申请。`,
        type: 'warning',
        category: 'application'
      })

      res.json({ success: true, message: '已撤销' })
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[Agent] 撤销失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.get('/invite-codes', authUser, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ic.*, u.nickname as creator_name
       FROM agent_invite_codes ic
       LEFT JOIN users u ON ic.created_by = u.id
       ORDER BY ic.created_at DESC
       LIMIT 100`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[Agent] 查询邀请码失败:', err)
    res.status(500).json({ success: false, message: '查询失败' })
  }
})

router.post('/invite-codes/create', authUser, adminOnly, async (req, res) => {
  try {
    const { quotaMonthly, quotaTotal, maxUses, expiresAt, note } = req.body
    const code = generateCode()
    await pool.query(
      `INSERT INTO agent_invite_codes (code, created_by, max_uses, quota_monthly, quota_total, expires_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, req.user.id, maxUses || 1, quotaMonthly || 0, quotaTotal || 0, expiresAt || null, note || '']
    )
    res.json({ success: true, data: { code }, message: '邀请码已生成' })
  } catch (err) {
    console.error('[Agent] 生成邀请码失败:', err)
    res.status(500).json({ success: false, message: '生成失败' })
  }
})

router.post('/invite-codes/:id/disable', authUser, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE agent_invite_codes SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '已禁用' })
  } catch (err) {
    console.error('[Agent] 禁用失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/invite-codes/cleanup', authUser, adminOnly, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM agent_invite_codes WHERE is_active = 0 OR (max_uses > 0 AND used_count >= max_uses)`
    )
    res.json({ success: true, message: `已清理 ${result.affectedRows || 0} 条失效邀请码` })
  } catch (err) {
    console.error('[Agent] 清理失败:', err)
    res.status(500).json({ success: false, message: '清理失败' })
  }
})

module.exports = router

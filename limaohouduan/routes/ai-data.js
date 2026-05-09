const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { pool } = require('../db')
const { authMiddleware, adminMiddleware } = require('../middleware')
const { createNotification } = require('./notifications')

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-me'
const IV_LENGTH = 16

function deriveKey(raw) {
  return crypto.createHash('sha256').update(raw + '-limao-encryption').digest()
}

function encrypt(text) {
  const key = deriveKey(ENCRYPTION_KEY_RAW)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text) {
  if (typeof text !== 'string' || !text.includes(':')) {
    throw new Error('Invalid encrypted text format')
  }
  const key = deriveKey(ENCRYPTION_KEY_RAW)
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift(), 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

router.get('/files', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, path, language, created_at, updated_at FROM user_files WHERE user_id = ? ORDER BY path',
      [req.user.id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[AI Files] 查询失败:', err)
    res.status(500).json({ success: false, message: '查询文件失败' })
  }
})

router.get('/files/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM user_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ success: false, message: '文件不存在' })
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('[AI Files] 读取失败:', err)
    res.status(500).json({ success: false, message: '读取文件失败' })
  }
})

router.post('/files/batch', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true, data: [] })
    const placeholders = ids.map(() => '?').join(',')
    const [rows] = await pool.query(
      `SELECT id, name, path, language, content FROM user_files WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, req.user.id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[AI Files] 批量读取失败:', err)
    res.status(500).json({ success: false, message: '批量读取文件失败' })
  }
})

router.put('/files', authMiddleware, async (req, res) => {
  try {
    const { name, path, content, language } = req.body
    if (!name || !path) return res.status(400).json({ success: false, message: '缺少文件名或路径' })
    if (path.includes('..') || path.includes('\\')) return res.status(400).json({ success: false, message: '路径不合法' })
    if (content && content.length > 1024 * 1024) return res.status(400).json({ success: false, message: '文件内容过大' })

    await pool.query(
      `INSERT INTO user_files (user_id, name, path, content, language)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content), language = VALUES(language), name = VALUES(name)`,
      [req.user.id, name, path, content || '', language || 'text']
    )

    const [rows] = await pool.query(
      'SELECT id, name, path, language, created_at, updated_at FROM user_files WHERE user_id = ? AND path = ?',
      [req.user.id, path]
    )
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('[AI Files] 保存失败:', err)
    res.status(500).json({ success: false, message: '保存文件失败' })
  }
})

router.put('/files/batch', authMiddleware, async (req, res) => {
  try {
    const { files } = req.body
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ success: false, message: '缺少文件列表' })
    if (files.length > 100) return res.status(400).json({ success: false, message: '单次最多上传100个文件' })
    for (const f of files) {
      if (f.path && (f.path.includes('..') || f.path.includes('\\'))) return res.status(400).json({ success: false, message: `路径不合法: ${f.path}` })
      if (f.content && f.content.length > 1024 * 1024) return res.status(400).json({ success: false, message: `文件内容过大: ${f.name}` })
    }
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const f of files) {
        await conn.query(
          `INSERT INTO user_files (user_id, name, path, content, language)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE content = VALUES(content), language = VALUES(language), name = VALUES(name)`,
          [req.user.id, f.name, f.path, f.content || '', f.language || 'text']
        )
      }
      await conn.commit()
      res.json({ success: true, message: `已保存 ${files.length} 个文件` })
    } catch (e) { await conn.rollback(); throw e } finally { conn.release() }
  } catch (err) {
    console.error('[AI Files] 批量保存失败:', err)
    res.status(500).json({ success: false, message: '批量保存文件失败' })
  }
})

router.delete('/files/folder', authMiddleware, async (req, res) => {
  try {
    const rawPrefix = req.query.prefix || ''
    if (rawPrefix.includes('..') || rawPrefix.includes('\\')) return res.status(400).json({ success: false, message: '路径不合法' })
    const prefix = `workspace/${rawPrefix}`
    const [result] = await pool.query('DELETE FROM user_files WHERE user_id = ? AND path LIKE ?', [req.user.id, `${prefix}%`])
    res.json({ success: true, message: `已删除 ${result.affectedRows} 个文件` })
  } catch (err) {
    console.error('[AI Files] 删除文件夹失败:', err)
    res.status(500).json({ success: false, message: '删除文件夹文件失败' })
  }
})

router.delete('/files/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM user_files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '文件不存在' })
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    console.error('[AI Files] 删除失败:', err)
    res.status(500).json({ success: false, message: '删除文件失败' })
  }
})

router.get('/keys', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT model_id, api_key, api_base FROM user_api_keys WHERE user_id = ?', [req.user.id])
    const keys = {}
    rows.forEach(r => {
      let decryptedKey = r.api_key
      try { decryptedKey = decrypt(r.api_key) } catch {}
      keys[r.model_id] = { key: decryptedKey, base: r.api_base || '' }
    })
    res.json({ success: true, data: keys })
  } catch (err) {
    console.error('[AI Keys] 查询失败:', err)
    res.status(500).json({ success: false, message: '查询密钥失败' })
  }
})

router.put('/keys', authMiddleware, async (req, res) => {
  try {
    const { model_id, api_key, api_base } = req.body
    if (!model_id || !api_key) return res.status(400).json({ success: false, message: '缺少参数' })

    const [[{ isApproved }]] = await pool.query(
      "SELECT COUNT(*) > 0 AS isApproved FROM custom_ai_applications WHERE user_id = ? AND status = 'approved'",
      [req.user.id]
    )
    if (!isApproved) return res.status(403).json({ success: false, message: '您尚未获得自定义AI使用权限，请先提交申请' })

    const encryptedKey = encrypt(api_key)
    await pool.query(
      `INSERT INTO user_api_keys (user_id, model_id, api_key, api_base)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE api_key = VALUES(api_key), api_base = VALUES(api_base)`,
      [req.user.id, model_id, encryptedKey, api_base || '']
    )
    res.json({ success: true, message: '密钥已保存' })
  } catch (err) {
    console.error('[AI Keys] 保存失败:', err)
    res.status(500).json({ success: false, message: '保存密钥失败' })
  }
})

router.delete('/keys/:modelId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_api_keys WHERE user_id = ? AND model_id = ?', [req.user.id, req.params.modelId])
    res.json({ success: true, message: '密钥已删除' })
  } catch (err) {
    console.error('[AI Keys] 删除失败:', err)
    res.status(500).json({ success: false, message: '删除密钥失败' })
  }
})

router.get('/workspace', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT workspace_data, expanded_data FROM user_workspaces WHERE user_id = ?', [req.user.id])
    if (rows.length === 0) return res.json({ success: true, data: { folders: [], expanded: [] } })
    res.json({ success: true, data: { folders: rows[0].workspace_data || [], expanded: rows[0].expanded_data || [] } })
  } catch (err) {
    console.error('[AI Workspace] 查询失败:', err)
    res.status(500).json({ success: false, message: '查询工作区失败' })
  }
})

router.put('/workspace', authMiddleware, async (req, res) => {
  try {
    const { folders, expanded } = req.body
    await pool.query(
      `INSERT INTO user_workspaces (user_id, workspace_data, expanded_data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE workspace_data = VALUES(workspace_data), expanded_data = VALUES(expanded_data)`,
      [req.user.id, JSON.stringify(folders || []), JSON.stringify(expanded || [])]
    )
    res.json({ success: true, message: '工作区已保存' })
  } catch (err) {
    console.error('[AI Workspace] 保存失败:', err)
    res.status(500).json({ success: false, message: '保存工作区失败' })
  }
})

router.get('/custom-ai/status', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT status FROM custom_ai_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.user.id]
    )
    const [[{ isApproved }]] = await pool.query(
      `SELECT COUNT(*) > 0 AS isApproved FROM custom_ai_applications WHERE user_id = ? AND status = 'approved'`,
      [req.user.id]
    )
    const [[{ hasPending }]] = await pool.query(
      `SELECT COUNT(*) > 0 AS hasPending FROM custom_ai_applications WHERE user_id = ? AND status = 'pending'`,
      [req.user.id]
    )
    res.json({
      success: true,
      data: {
        status: row ? row.status : null,
        isApproved: Boolean(isApproved),
        hasPending: Boolean(hasPending)
      }
    })
  } catch (err) {
    console.error('[CustomAI] 查询状态失败:', err)
    res.status(500).json({ success: false, message: '查询状态失败' })
  }
})

router.post('/custom-ai/apply', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body

    const [existing] = await pool.query(
      "SELECT id, status FROM custom_ai_applications WHERE user_id = ? AND status IN ('pending', 'approved')",
      [req.user.id]
    )
    if (existing.length > 0) {
      const label = existing[0].status === 'pending' ? '审核中' : '已通过'
      return res.status(400).json({ success: false, message: `你已有${label}的申请` })
    }

    const [revoked] = await pool.query(
      "SELECT id FROM custom_ai_applications WHERE user_id = ? AND status = 'revoked'",
      [req.user.id]
    )
    if (revoked.length > 0) {
      await pool.query("DELETE FROM custom_ai_applications WHERE user_id = ? AND status = 'revoked'", [req.user.id])
    }

    const [rejected] = await pool.query(
      "SELECT id FROM custom_ai_applications WHERE user_id = ? AND status = 'rejected'",
      [req.user.id]
    )
    if (rejected.length > 0) {
      await pool.query("DELETE FROM custom_ai_applications WHERE user_id = ? AND status = 'rejected'", [req.user.id])
    }

    const [userRows] = await pool.query('SELECT email, nickname FROM users WHERE id = ?', [req.user.id])
    if (userRows.length === 0) return res.status(404).json({ success: false, message: '用户不存在' })

    await pool.query(
      'INSERT INTO custom_ai_applications (user_id, email, nickname, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, userRows[0].email, userRows[0].nickname || '', reason || '']
    )

    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'")
    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        title: '新自定义AI申请',
        content: `用户 ${userRows[0].nickname || userRows[0].email} 提交了自定义AI使用申请，请前往审核。`,
        type: 'info',
        category: 'application'
      })
    }

    res.json({ success: true, message: '申请已提交，请等待管理员审核' })
  } catch (err) {
    console.error('[CustomAI] 申请失败:', err)
    res.status(500).json({ success: false, message: '申请失败' })
  }
})

router.post('/custom-ai/cancel', authMiddleware, async (req, res) => {
  try {
    const [apps] = await pool.query(
      "SELECT id FROM custom_ai_applications WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    )
    if (apps.length === 0) return res.status(400).json({ success: false, message: '没有待审核的申请' })
    await pool.query("DELETE FROM custom_ai_applications WHERE user_id = ? AND status = 'pending'", [req.user.id])
    res.json({ success: true, message: '申请已取消' })
  } catch (err) {
    console.error('[CustomAI] 取消申请失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.get('/custom-ai/applications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const status = req.query.status || 'pending'
    let rows
    if (status === 'all') {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname
         FROM custom_ai_applications a
         JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC`
      )
    } else {
      [rows] = await pool.query(
        `SELECT a.*, u.email as user_email, u.nickname as user_nickname
         FROM custom_ai_applications a
         JOIN users u ON a.user_id = u.id
         WHERE a.status = ?
         ORDER BY a.created_at DESC`,
        [status]
      )
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('[CustomAI] 查询申请列表失败:', err)
    res.status(500).json({ success: false, message: '查询失败' })
  }
})

router.post('/custom-ai/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.body
    const [apps] = await pool.query("SELECT * FROM custom_ai_applications WHERE id = ? AND status = 'pending'", [applicationId])
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]
    await pool.query(
      "UPDATE custom_ai_applications SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '自定义AI申请已通过',
      content: '您的自定义AI使用申请已通过，现在可以添加自己的API Key使用自定义模型！',
      type: 'success',
      category: 'application'
    })

    res.json({ success: true, message: '已通过' })
  } catch (err) {
    console.error('[CustomAI] 审批失败:', err)
    res.status(500).json({ success: false, message: '审批失败' })
  }
})

router.post('/custom-ai/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.body
    const [apps] = await pool.query("SELECT * FROM custom_ai_applications WHERE id = ? AND status = 'pending'", [applicationId])
    if (apps.length === 0) return res.status(400).json({ success: false, message: '申请不存在或已处理' })

    const application = apps[0]
    await pool.query(
      "UPDATE custom_ai_applications SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await createNotification({
      user_id: application.user_id,
      title: '自定义AI申请未通过',
      content: '很抱歉，您的自定义AI使用申请未通过审核，您可以重新提交申请。',
      type: 'warning',
      category: 'application'
    })

    res.json({ success: true, message: '已拒绝' })
  } catch (err) {
    console.error('[CustomAI] 拒绝失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/custom-ai/revoke', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.body
    const [apps] = await pool.query("SELECT * FROM custom_ai_applications WHERE id = ? AND status = 'approved'", [applicationId])
    if (apps.length === 0) return res.status(400).json({ success: false, message: '未找到已通过的申请' })

    const application = apps[0]
    await pool.query(
      "UPDATE custom_ai_applications SET status = 'revoked', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, applicationId]
    )

    await pool.query('DELETE FROM user_api_keys WHERE user_id = ?', [application.user_id])

    await createNotification({
      user_id: application.user_id,
      title: '自定义AI权限已被撤销',
      content: '您的自定义AI使用权限已被管理员撤销，您的API Key已被清除。如有疑问请联系管理员。',
      type: 'error',
      category: 'application'
    })

    res.json({ success: true, message: '已撤销，该用户的API Key已清除' })
  } catch (err) {
    console.error('[CustomAI] 撤销失败:', err)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

module.exports = router

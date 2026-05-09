const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { pool } = require('../db')
const { sendVerificationCode } = require('../mail')
const { JWT_SECRET } = require('../config')
const { createNotification } = require('./notifications')

function parseDevice(userAgent) {
  if (!userAgent) return '未知设备'
  let browser = '未知浏览器'
  if (userAgent.includes('Edg/')) browser = 'Edge'
  else if (userAgent.includes('Chrome/')) browser = 'Chrome'
  else if (userAgent.includes('Firefox/')) browser = 'Firefox'
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari'
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) browser = 'IE'

  let os = '未知系统'
  if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (userAgent.includes('Windows NT')) os = 'Windows'
  else if (userAgent.includes('Mac OS X')) os = 'macOS'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('Linux')) os = 'Linux'

  return os + ' ' + browser
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString()
}

async function verifyCode(email, code) {
  const [rows] = await pool.query(
    'SELECT id FROM verification_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [email, code]
  )
  return rows
}

async function markCodeUsed(codeId) {
  await pool.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [codeId])
}

router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, message: '请提供邮箱地址' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: '邮箱格式不正确' })

    const [recent] = await pool.query(
      'SELECT id FROM verification_codes WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 SECOND)',
      [email]
    )
    if (recent.length > 0) return res.status(429).json({ success: false, message: '发送过于频繁，请稍后再试' })

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await pool.query('INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)', [email, code, 'register', expiresAt])

    try {
      await sendVerificationCode(email, code)
      console.log(`[验证码] 邮件发送成功，邮箱: ${email}`)
    } catch (mailErr) {
      console.error(`[验证码] ❌ 邮件发送失败:`, mailErr)
      console.error(`[验证码] SMTP配置检查:`)
      console.error(`[验证码] - SMTP_HOST: ${process.env.SMTP_HOST || process.env.MAIL_HOST}`)
      console.error(`[验证码] - SMTP_USER: ${process.env.SMTP_USER || process.env.MAIL_USER}`)
      console.error(`[验证码] - SMTP_PORT: ${process.env.SMTP_PORT || process.env.MAIL_PORT}`)
      return res.status(500).json({ 
        success: false, 
        message: '邮件发送失败，请检查邮箱配置是否正确' 
      })
    }

    res.json({
      success: true,
      message: '验证码已发送至邮箱，请查收'
    })
  } catch (err) {
    console.error('发送验证码失败:', err)
    res.status(500).json({ success: false, message: '发送验证码失败，请稍后重试' })
  }
})

router.post('/register', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { email, password, code, agreed } = req.body
    if (!email || !password || !code) return res.status(400).json({ success: false, message: '请填写完整信息' })
    if (!agreed) return res.status(400).json({ success: false, message: '请先阅读并同意用户协议和隐私政策' })
    if (password.length < 6) return res.status(400).json({ success: false, message: '密码长度不能少于6位' })
    if (password.length > 128) return res.status(400).json({ success: false, message: '密码长度不能超过128位' })
    if (email.length > 255) return res.status(400).json({ success: false, message: '邮箱格式不正确' })
    if (!/^\d{4,6}$/.test(code)) return res.status(400).json({ success: false, message: '验证码格式不正确' })

    const codeRows = await verifyCode(email, code)
    if (codeRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' })

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) return res.status(400).json({ success: false, message: '该邮箱已注册' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const adjectives = ['快乐的', '聪明的', '勇敢的', '可爱的', '温柔的', '阳光的', '淡定的', '酷酷的', '优雅的', '灵动的']
    const nouns = ['小熊', '猫咪', '企鹅', '海豚', '狐狸', '兔子', '松鼠', '鹦鹉', '小鹿', '浣熊', '考拉', '水獭']
    const randomNickname = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)] + Math.floor(Math.random() * 100)
    await conn.beginTransaction()
    const [result] = await conn.query('INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)', [email, hashedPassword, randomNickname])
    const userId = result.insertId
    await conn.query('INSERT INTO user_agreements (user_id) VALUES (?)', [userId])
    await markCodeUsed(codeRows[0].id)
    await conn.commit()

    res.json({ success: true, message: '注册成功' })
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('注册失败:', err)
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' })
  } finally {
    if (conn) conn.release()
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password, code } = req.body
    if (!email) return res.status(400).json({ success: false, message: '请提供邮箱地址或用户名' })

    let [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (users.length === 0) {
      [users] = await pool.query('SELECT * FROM users WHERE nickname = ?', [email])
    }
    if (users.length === 0) return res.status(400).json({ success: false, message: '该账号未注册' })

    const user = users[0]

    if (password) {
      if (!user.password) return res.status(400).json({ success: false, message: '该账号未设置密码，请使用验证码登录' })
      const match = await bcrypt.compare(password, user.password)
      if (!match) return res.status(400).json({ success: false, message: '密码错误' })
    } else if (code) {
      const codeRows = await verifyCode(email, code)
      if (codeRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' })
      await markCodeUsed(codeRows[0].id)
    } else {
      return res.status(400).json({ success: false, message: '请提供密码或验证码' })
    }

    const ua = req.headers['user-agent'] || ''
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    const deviceInfo = parseDevice(ua)

    const isNewDevice = !user.last_login_device || user.last_login_device !== deviceInfo

    await pool.query(
      'UPDATE users SET last_login_device = ?, last_login_ip = ?, last_login_time = NOW() WHERE id = ?',
      [deviceInfo, clientIp.split(',')[0].trim(), user.id]
    )

    if (isNewDevice && user.last_login_device) {
      await createNotification({
        user_id: user.id,
        title: '新设备登录提醒',
        content: `您的账号于 ${new Date().toLocaleString()} 在 ${deviceInfo} 上登录，IP: ${clientIp.split(',')[0].trim()}。如非本人操作，请立即修改密码。`,
        type: 'warning',
        category: 'security'
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email, role: user.role || 'user', nickname: user.nickname, avatar: user.avatar }
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, code } = req.body
    if (!email || !newPassword || !code) return res.status(400).json({ success: false, message: '请填写完整信息' })
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: '密码长度不能少于6位' })
    if (newPassword.length > 128) return res.status(400).json({ success: false, message: '密码长度不能超过128位' })

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (users.length === 0) return res.status(400).json({ success: false, message: '该邮箱未注册' })

    const codeRows = await verifyCode(email, code)
    if (codeRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' })

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email])
    await markCodeUsed(codeRows[0].id)

    const [updatedUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (updatedUsers.length > 0) {
      await createNotification({
        user_id: updatedUsers[0].id,
        title: '密码修改成功',
        content: `您的密码已于 ${new Date().toLocaleString()} 修改成功。如非本人操作，请尽快联系客服。`,
        type: 'info',
        category: 'security'
      })
    }

    res.json({ success: true, message: '密码修改成功' })
  } catch (err) {
    console.error('修改密码失败:', err)
    res.status(500).json({ success: false, message: '修改密码失败，请稍后重试' })
  }
})

module.exports = router

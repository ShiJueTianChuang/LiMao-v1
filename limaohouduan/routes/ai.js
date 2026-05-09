const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { JWT_SECRET } = require('../config')

let _fetch
if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
  _fetch = globalThis.fetch
} else {
  try {
    _fetch = require('node-fetch')
  } catch {
    console.error('❌ 未找到 fetch API，请运行: npm install node-fetch@^2.7.0')
    process.exit(1)
  }
}

const modelConfig = {
  // 自定义 AI
  claude: { defaultBase: 'https://api.anthropic.com/v1', model: 'claude-opus-4-7', isOpenAI: false, maxTokens: 16384, supportsStream: true },
  gpt5pro: { defaultBase: 'https://api.openai.com/v1', model: 'gpt-5.2-pro', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  gpt5: { defaultBase: 'https://api.openai.com/v1', model: 'gpt-5.2', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  gemini: { defaultBase: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.1-pro', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  deepseekv4: { defaultBase: 'https://api.deepseek.com', model: 'deepseek-chat', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  deepseekr1: { defaultBase: 'https://api.deepseek.com', model: 'deepseek-reasoner', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  qwenmax: { defaultBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen3.6-max-preview', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  qwenplus: { defaultBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen3.6-plus', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  glm51: { defaultBase: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-5.1', isOpenAI: true, maxTokens: 16384, supportsStream: true },

  // 免费 NVIDIA 模型
  nvidia_glm5: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'z-ai/glm-5.1', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  nvidia_glm4: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'z-ai/glm4.7', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  nvidia_deepseek_flash: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'deepseek-ai/deepseek-v4-flash', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  nvidia_qwen: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'qwen/qwen3.5-397b-a17b', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_kimi: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'moonshotai/kimi-k2-instruct', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_minimax: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'minimaxai/minimax-m2.7', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_llama: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.3-70b-instruct', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_nemotron: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/llama-3.3-nemotron-super-49b-v1', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_gemma4: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'google/gemma-2-9b-it', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_nemotron3: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3-super-120b-a12b', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_deepseek_v4_pro: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'deepseek-ai/deepseek-v4-pro', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  nvidia_mistral_medium: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'mistralai/mistral-medium-3.5-128b', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_mistral_small: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'mistralai/mistral-small-4-119b-2603', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_qwen_122b: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'qwen/qwen3-next-80b-a3b-instruct', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_gemma4_31b: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'google/gemma-4-31b-it', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_nemotron_nano: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_deepseek_v4_flash: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'deepseek-ai/deepseek-v4-flash', isOpenAI: true, maxTokens: 16384, supportsStream: true },
  nvidia_gpt_oss_120b: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'openai/gpt-oss-120b', isOpenAI: true, maxTokens: 8192, supportsStream: true },
  nvidia_gpt_oss_20b: { defaultBase: 'https://integrate.api.nvidia.com/v1', model: 'openai/gpt-oss-20b', isOpenAI: true, maxTokens: 8192, supportsStream: true }
}

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || ''

router.post('/chat', async (req, res) => {
  const { model, messages, apiKey, apiBase, maxTokens, mode } = req.body
  console.log('[AI Chat] 收到请求:', { model, maxTokens, hasKey: !!apiKey, apiBase, mode })

  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
      userId = decoded.id
    } catch { }
  }

  if (mode === 'agent') {
    if (!userId) return res.status(401).json({ success: false, message: '使用智能体需要登录' })

    const [agentApps] = await pool.query(
      'SELECT a.invite_code_id FROM agent_applications a WHERE a.user_id = ? AND a.status = ? LIMIT 1',
      [userId, 'approved']
    )
    if (agentApps.length === 0) {
      return res.status(403).json({ success: false, message: '智能体功能需要申请权限，请在 AI 页面侧边栏提交申请' })
    }

    const inviteId = agentApps[0].invite_code_id
    if (inviteId) {
      const [inviteRows] = await pool.query(
        'SELECT quota_monthly, quota_total, is_active FROM agent_invite_codes WHERE id = ?',
        [inviteId]
      )
      if (inviteRows.length === 0 || inviteRows[0].is_active === 0) {
        return res.status(403).json({ success: false, message: '您的智能体权限已被撤销' })
      }

      const { quota_monthly, quota_total } = inviteRows[0]

      if (quota_monthly > 0) {
        const thisMonth = new Date().toISOString().slice(0, 7) + '-01'
        const [usage] = await pool.query(
          'SELECT SUM(used) as total FROM agent_quota_usage WHERE user_id = ? AND quota_type = ? AND period_start = ?',
          [userId, 'monthly', thisMonth]
        )
        if ((usage[0]?.total || 0) >= quota_monthly) {
          return res.status(403).json({ success: false, message: '本月智能体配额已用完' })
        }
      }

      if (quota_total > 0) {
        const [totalUsage] = await pool.query(
          'SELECT SUM(used) as total FROM agent_quota_usage WHERE user_id = ? AND quota_type = ?',
          [userId, 'total']
        )
        if ((totalUsage[0]?.total || 0) >= quota_total) {
          return res.status(403).json({ success: false, message: '智能体总配额已用完' })
        }
      }
    }
  }

  const effectiveApiKey = apiKey || (model.startsWith('nvidia_') ? NVIDIA_API_KEY : '')
  if (!model || !messages) {
    return res.status(400).json({ success: false, message: '缺少必要参数' })
  }
  if (!effectiveApiKey) {
    if (model.startsWith('nvidia_')) {
      return res.status(400).json({ success: false, message: '免费模型服务暂不可用，请稍后再试或使用自定义模型' })
    }
    return res.status(400).json({ success: false, message: '请先配置该模型的 API Key' })
  }

  const config = modelConfig[model]
  if (!config) {
    return res.status(400).json({ success: false, message: '不支持的模型' })
  }

  const baseUrl = (apiBase && apiBase.trim()) || config.defaultBase
  const isOpenAI = config.isOpenAI !== false

  try {
    const parsedUrl = new URL(baseUrl)
    const allowedHosts = [
      'open.bigmodel.cn', 'dashscope.aliyuncs.com', 'api.deepseek.com',
      'api.moonshot.cn', 'api.openai.com', 'integrate.api.nvidia.com',
      'api.anthropic.com', 'generativelanguage.googleapis.com'
    ]
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return res.status(400).json({ success: false, message: '不允许的 API 地址' })
    }
  } catch {
    return res.status(400).json({ success: false, message: 'API 地址格式不正确' })
  }

  const url = `${baseUrl.replace(/\/+$/, '')}${isOpenAI ? '/chat/completions' : '/messages'}`

  let clientDisconnected = false
  req.on('close', () => { clientDisconnected = true })

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(isOpenAI
        ? { 'Authorization': `Bearer ${effectiveApiKey}` }
        : { 'x-api-key': effectiveApiKey, 'anthropic-version': '2023-06-01' }
      )
    }

    const effectiveMaxTokens = Math.min(maxTokens || config.maxTokens, config.maxTokens)

    const body = {
      model: config.model
    }
    if (config.supportsStream || maxTokens) body.max_tokens = effectiveMaxTokens
    if (config.supportsStream) body.stream = true

    if (isOpenAI) {
      body.messages = messages
    } else {
      const systemMsg = messages.find(m => m.role === 'system')
      if (systemMsg) body.system = systemMsg.content
      body.messages = messages.filter(m => m.role !== 'system')
    }

    console.log('[AI Chat] 请求参数:', JSON.stringify({ url, model: config.model, bodyKeys: Object.keys(body) }))
    const response = await _fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    console.log('[AI Chat] 上游响应状态:', response.status, '模型:', config.model)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    if (res.socket) res.socket.setNoDelay(true)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Chat] 上游错误响应:', response.status, errorText)
      let errorMessage = `API请求失败 (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {}
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
      res.end()
      return
    }

    const isWebStream = response.body && typeof response.body.getReader === 'function'
    const isNodeStream = !isWebStream && response.body && typeof response.body[Symbol.asyncIterator] === 'function'
    const decoder = new TextDecoder()
    let buffer = ''
    let totalChars = 0

    if (isWebStream) {
      const reader = response.body.getReader()
      while (true) {
        if (clientDisconnected) { try { reader.cancel() } catch {} break }
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            let content = ''
            let reasoning = ''
            if (isOpenAI) {
              content = parsed.choices?.[0]?.delta?.content || ''
              reasoning = parsed.choices?.[0]?.delta?.reasoning_content || ''
            } else if (parsed.type === 'content_block_delta') {
              if (parsed.delta?.type === 'text_delta') content = parsed.delta.text || ''
              else if (parsed.delta?.type === 'thinking_delta') reasoning = parsed.delta.thinking || ''
            }
            if (content || reasoning) {
              res.write(`data: ${JSON.stringify({ content, reasoning_content: reasoning })}\n\n`)
              totalChars += (content + reasoning).length
              if (typeof res.flush === 'function') res.flush()
            }
          } catch {}
        }
      }
    } else if (isNodeStream) {
      for await (const chunk of response.body) {
        if (clientDisconnected) break
        buffer += decoder.decode(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk), { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            let content = ''
            let reasoning = ''
            if (isOpenAI) {
              content = parsed.choices?.[0]?.delta?.content || ''
              reasoning = parsed.choices?.[0]?.delta?.reasoning_content || ''
            } else if (parsed.type === 'content_block_delta') {
              if (parsed.delta?.type === 'text_delta') content = parsed.delta.text || ''
              else if (parsed.delta?.type === 'thinking_delta') reasoning = parsed.delta.thinking || ''
            }
            if (content || reasoning) {
              res.write(`data: ${JSON.stringify({ content, reasoning_content: reasoning })}\n\n`)
              totalChars += (content + reasoning).length
              if (typeof res.flush === 'function') res.flush()
            }
          } catch {}
        }
      }
    } else {
      const text = await response.text()
      try {
        const parsed = JSON.parse(text)
        const content = parsed.choices?.[0]?.message?.content
          || parsed.choices?.[0]?.delta?.content
          || parsed.output?.text
          || parsed.result
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        } else {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
        }
      } catch {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
        try {
          const parsed = JSON.parse(trimmed.slice(6))
          let content = ''
          let reasoning = ''
          if (isOpenAI) {
            content = parsed.choices?.[0]?.delta?.content || ''
            reasoning = parsed.choices?.[0]?.delta?.reasoning_content || ''
          } else if (parsed.type === 'content_block_delta') {
            if (parsed.delta?.type === 'text_delta') content = parsed.delta.text || ''
            else if (parsed.delta?.type === 'thinking_delta') reasoning = parsed.delta.thinking || ''
          }
          if (content || reasoning) res.write(`data: ${JSON.stringify({ content, reasoning_content: reasoning })}\n\n`)
        } catch {}
      }
    }

    const estimatedTokens = Math.max(1, Math.round(totalChars / 4))
    pool.query(
      'INSERT INTO ai_usage_logs (user_id, mode, model, tokens, uses_own_key) VALUES (?, ?, ?, ?, ?)',
      [userId, mode || 'unknown', model, estimatedTokens, apiKey ? 1 : 0]
    ).catch(e => console.error('[AI Chat] 记录使用日志失败:', e.message))

    if (mode === 'agent' && userId) {
      const thisMonth = new Date().toISOString().slice(0, 7) + '-01'
      const [agentApps] = await pool.query(
        'SELECT invite_code_id FROM agent_applications WHERE user_id = ? AND status = ? LIMIT 1',
        [userId, 'approved']
      ).catch(() => [[]])
      const inviteId = agentApps[0]?.invite_code_id || null
      pool.query(
        'INSERT INTO agent_quota_usage (user_id, invite_code_id, quota_type, used, period_start) VALUES (?, ?, ?, ?, ?)',
        [userId, inviteId, 'monthly', 1, thisMonth]
      ).catch(e => console.error('[AI Chat] 月配额记录失败:', e.message))
      pool.query(
        'INSERT INTO agent_quota_usage (user_id, invite_code_id, quota_type, used) VALUES (?, ?, ?, ?)',
        [userId, inviteId, 'total', 1]
      ).catch(e => console.error('[AI Chat] 总配额记录失败:', e.message))
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('AI代理错误:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: '网络请求失败，请检查API地址和密钥是否正确' })
    } else {
      res.write(`data: ${JSON.stringify({ error: '网络请求失败，请检查API地址和密钥是否正确' })}\n\n`)
      res.end()
    }
  }
})

router.get('/usage-stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录' })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权限' })
    }

    const [byUser] = await pool.query(`
      SELECT 
        u.id as user_id,
        COALESCE(u.nickname, u.email) as name,
        u.email,
        COUNT(*) as count,
        SUM(aul.tokens) as total_tokens,
        SUM(aul.image_count) as total_images,
        SUM(CASE WHEN aul.mode = 'video' AND aul.tokens > 0 THEN 1 ELSE 0 END) as total_videos,
        SUM(CASE WHEN aul.uses_own_key = 1 THEN 1 ELSE 0 END) as own_key_count,
        SUM(CASE WHEN aul.uses_own_key = 0 THEN 1 ELSE 0 END) as free_key_count
      FROM ai_usage_logs aul
      LEFT JOIN users u ON aul.user_id = u.id
      GROUP BY u.id, u.nickname, u.email
      ORDER BY count DESC
      LIMIT 50
    `)

    const [byMode] = await pool.query(`
      SELECT mode, COUNT(*) as count, SUM(tokens) as total_tokens, SUM(image_count) as total_images, SUM(CASE WHEN mode = 'video' AND tokens > 0 THEN 1 ELSE 0 END) as total_videos
      FROM ai_usage_logs
      GROUP BY mode
    `)

    const [byModel] = await pool.query(`
      SELECT model, COUNT(*) as count, SUM(tokens) as total_tokens, SUM(image_count) as total_images, SUM(CASE WHEN mode = 'video' AND tokens > 0 THEN 1 ELSE 0 END) as total_videos
      FROM ai_usage_logs
      GROUP BY model
      ORDER BY count DESC
      LIMIT 20
    `)

    const [daily] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(tokens) as total_tokens, SUM(image_count) as total_images, SUM(CASE WHEN mode = 'video' AND tokens > 0 THEN 1 ELSE 0 END) as total_videos
      FROM ai_usage_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    const [totalCount] = await pool.query('SELECT COUNT(*) as total FROM ai_usage_logs')
    const [totalTokens] = await pool.query('SELECT SUM(tokens) as total FROM ai_usage_logs')
    const [totalImages] = await pool.query('SELECT SUM(image_count) as total FROM ai_usage_logs')
    const [imageUsers] = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM ai_usage_logs WHERE mode = \'image\' AND image_count > 0')
    const [totalVideos] = await pool.query('SELECT COUNT(*) as total FROM ai_usage_logs WHERE mode = \'video\' AND tokens > 0')
    const [videoUsers] = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM ai_usage_logs WHERE mode = \'video\' AND tokens > 0')
    const [freeCount] = await pool.query('SELECT COUNT(*) as total FROM ai_usage_logs WHERE uses_own_key = 0')
    const [customCount] = await pool.query('SELECT COUNT(*) as total FROM ai_usage_logs WHERE uses_own_key = 1')

    res.json({
      success: true,
      data: {
        totalCount: totalCount[0].total,
        totalTokens: totalTokens[0].total || 0,
        totalImages: totalImages[0].total || 0,
        imageUsers: imageUsers[0].total || 0,
        totalVideos: totalVideos[0].total || 0,
        videoUsers: videoUsers[0].total || 0,
        freeKeyCount: freeCount[0].total || 0,
        customKeyCount: customCount[0].total || 0,
        byUser,
        byMode,
        byModel,
        daily
      }
    })
  } catch (err) {
    console.error('获取AI使用统计失败:', err)
    res.status(500).json({ success: false, message: '获取统计失败' })
  }
})

const imageModelConfig = {
  nvidia_flux_klein: { apiUrl: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b', type: 'flux_klein' },
  nvidia_flux_schnell: { apiUrl: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell', type: 'flux_schnell' },
  nvidia_flux_dev: { apiUrl: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev', type: 'flux_dev' }
}

router.post('/image', async (req, res) => {
  const { model, prompt, apiKey, apiBase } = req.body
  const effectiveApiKey = apiKey || (model.startsWith('nvidia_') ? NVIDIA_API_KEY : '')
  if (!model || !prompt) return res.status(400).json({ success: false, message: '缺少必要参数' })
  if (!effectiveApiKey) return res.status(400).json({ success: false, message: '免费图片模型服务未配置，请联系管理员' })

  const config = imageModelConfig[model]
  if (!config) return res.status(400).json({ success: false, message: '不支持的图片生成模型' })

  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
      userId = decoded.id
    } catch { }
  }

  const logImageUsage = (success) => {
    if (!userId) return
    pool.query(
      'INSERT INTO ai_usage_logs (user_id, mode, model, tokens, image_count, uses_own_key) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'image', model, 0, success ? 1 : 0, apiKey ? 1 : 0]
    ).catch(e => console.error('[AI Image] 记录使用日志失败:', e.message))
  }

  try {
    let requestBody
    if (config.type === 'flux_schnell') {
      requestBody = { prompt, steps: 1 }
    } else if (config.type === 'flux_dev') {
      requestBody = { prompt, steps: 5 }
    } else if (config.type === 'flux_klein') {
      requestBody = { prompt }
    } else {
      requestBody = { model: config.model, prompt, n: 1, size: '1024x1024' }
    }

    console.log('[AI Image] 请求:', config.apiUrl, '参数:', JSON.stringify(requestBody))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)
    const response = await _fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveApiKey}`, 'Accept': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Image] 错误响应:', response.status, errorText)
      let errorMessage = `图片生成失败 (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        if (Array.isArray(errorJson.detail)) {
          errorMessage = errorJson.detail.map(e => `${(e.loc || []).join('.')}: ${e.msg || e.message || String(e)}`).join('; ')
        } else {
          errorMessage = errorJson.error?.message || errorJson.message || errorJson.detail || errorMessage
        }
      } catch {}
      errorMessage = errorMessage + ' | [Raw] ' + errorText.substring(0, 300)
      return res.status(response.status).json({ success: false, message: errorMessage })
    }

    const result = await response.json()

    if (config.type === 'flux_klein' || config.type === 'flux_schnell' || config.type === 'flux_dev') {
      if (result.artifacts?.[0]) {
        const a = result.artifacts[0]
        if (a.base64) { logImageUsage(true); return res.json({ success: true, image: `data:${a.mime_type || 'image/jpeg'};base64,${a.base64}` }) }
        if (a.url) { logImageUsage(true); return res.json({ success: true, image: a.url }) }
      }
      if (result.data?.[0]) {
        const d = result.data[0]
        if (d.b64_json) { logImageUsage(true); return res.json({ success: true, image: `data:image/png;base64,${d.b64_json}` }) }
        if (d.url) { logImageUsage(true); return res.json({ success: true, image: d.url }) }
      }
      if (result.image) { logImageUsage(true); return res.json({ success: true, image: result.image }) }
      if (result.url) { logImageUsage(true); return res.json({ success: true, image: result.url }) }
      return res.status(500).json({ success: false, message: '图片生成返回数据异常' })
    }

    const imgData = result.data?.[0]
    if (imgData) {
      if (imgData.b64_json) { logImageUsage(true); return res.json({ success: true, image: `data:image/png;base64,${imgData.b64_json}` }) }
      if (imgData.url) { logImageUsage(true); return res.json({ success: true, image: imgData.url }) }
    }

    return res.status(500).json({ success: false, message: '图片生成返回数据异常' })
  } catch (err) {
    console.error('图片生成错误:', err.message)
    if (err.name === 'AbortError') {
      return res.status(504).json({ success: false, message: '图片生成超时(120s)，请稍后重试' })
    }
    return res.status(500).json({ success: false, message: '图片生成请求失败' })
  }
})

router.post('/image/chat', async (req, res) => {
  const { messages, imageModel, apiKey } = req.body
  if (!messages || !messages.length) return res.status(400).json({ success: false, message: '缺少对话内容' })

  const config = imageModelConfig[imageModel || 'nvidia_flux_dev']
  if (!config) return res.status(400).json({ success: false, message: '不支持的图片生成模型' })

  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
      userId = decoded.id
    } catch { }
  }

  if (!userId) return res.status(401).json({ success: false, message: '请先登录' })

  const effectiveKey = apiKey || NVIDIA_API_KEY
  if (!effectiveKey) return res.status(400).json({ success: false, message: '未配置图片生成 Key' })

  const log = (ok) => pool.query(
    'INSERT INTO ai_usage_logs (user_id, mode, model, tokens, image_count, uses_own_key) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'image_chat', imageModel, 0, ok ? 1 : 0, apiKey ? 1 : 0]
  ).catch(() => {})

  try {
    let refinedPrompt = ''
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

    const refineMessages = [
      { role: 'system', content: '你是图片Prompt精炼师，根据用户对话生成详细英文图片prompt。描述主体、场景、风格、光照、色彩、构图。只输出prompt文本。' },
      ...messages
    ]

    console.log('[AI ImageChat] 精炼中...')
    try {
      const refResponse = await _fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-ai/deepseek-v4-pro',
          messages: refineMessages,
          max_tokens: 512,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (refResponse.ok) {
        const refData = await refResponse.json()
        refinedPrompt = refData.choices?.[0]?.message?.content?.trim()
        console.log('[AI ImageChat] 精炼后:', refinedPrompt?.substring(0, 100))
      } else {
        const errText = await refResponse.text()
        console.error('[AI ImageChat] 精炼失败:', refResponse.status, errText.substring(0, 200))
      }
    } catch (refErr) {
      console.error('[AI ImageChat] 精炼异常:', refErr.message)
    }

    if (!refinedPrompt) {
      console.log('[AI ImageChat] 降级: 使用原始消息作为prompt')
      refinedPrompt = lastUserMsg
    }
    if (!refinedPrompt) return res.status(500).json({ success: false, message: '未生成有效的prompt' })

    console.log('[AI ImageChat] 精炼后的prompt:', refinedPrompt)

    let requestBody
    if (config.type === 'flux_schnell') requestBody = { prompt: refinedPrompt, steps: 1 }
    else if (config.type === 'flux_dev') requestBody = { prompt: refinedPrompt, steps: 5 }
    else if (config.type === 'flux_klein') requestBody = { prompt: refinedPrompt }
    else requestBody = { model: config.model, prompt: refinedPrompt, n: 1, size: '1024x1024' }

    console.log('[AI ImageChat] 生图请求:', config.apiUrl)
    const imgResponse = await _fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}`, 'Accept': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    })

    if (!imgResponse.ok) {
      const errText = await imgResponse.text()
      console.error('[AI ImageChat] 生图失败:', imgResponse.status, errText)
      return res.status(500).json({ success: false, message: `图片生成失败 (${imgResponse.status})` })
    }

    const result = await imgResponse.json()

    if (config.type === 'flux_klein' || config.type === 'flux_schnell' || config.type === 'flux_dev') {
      if (result.artifacts?.[0]) {
        const a = result.artifacts[0]
        if (a.base64) { log(true); return res.json({ success: true, image: `data:${a.mime_type || 'image/jpeg'};base64,${a.base64}`, prompt: refinedPrompt }) }
        if (a.url) { log(true); return res.json({ success: true, image: a.url, prompt: refinedPrompt }) }
      }
      if (result.data?.[0]) {
        const d = result.data[0]
        if (d.b64_json) { log(true); return res.json({ success: true, image: `data:image/png;base64,${d.b64_json}`, prompt: refinedPrompt }) }
        if (d.url) { log(true); return res.json({ success: true, image: d.url, prompt: refinedPrompt }) }
      }
      if (result.image) { log(true); return res.json({ success: true, image: result.image, prompt: refinedPrompt }) }
      if (result.url) { log(true); return res.json({ success: true, image: result.url, prompt: refinedPrompt }) }
      return res.status(500).json({ success: false, message: '图片生成返回数据异常' })
    }

    const imgData = result.data?.[0]
    if (imgData) {
      if (imgData.b64_json) { log(true); return res.json({ success: true, image: `data:image/png;base64,${imgData.b64_json}`, prompt: refinedPrompt }) }
      if (imgData.url) { log(true); return res.json({ success: true, image: imgData.url, prompt: refinedPrompt }) }
    }

    return res.status(500).json({ success: false, message: '图片生成返回数据异常' })
  } catch (err) {
    console.error('[AI ImageChat] 错误:', err.message)
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return res.status(504).json({ success: false, message: '生图超时，请稍后重试' })
    }
    return res.status(500).json({ success: false, message: '请求失败' })
  }
})

const videoModelConfig = {
  wavespeed_wan_t2v: { apiUrl: 'https://api.wavespeed.ai/api/v3/wavespeed-ai/wan-2.1/t2v-480p', type: 'wavespeed' },
  wavespeed_wan_t2v_fast: { apiUrl: 'https://api.wavespeed.ai/api/v3/wavespeed-ai/wan-2.1/t2v-480p-ultra-fast', type: 'wavespeed' },
  wavespeed_kling: { apiUrl: 'https://api.wavespeed.ai/api/v3/kuaishou/kling-v2.5-turbo-pro', type: 'wavespeed' }
}

router.post('/video', async (req, res) => {
  const { model, prompt, apiKey, negativePrompt, duration } = req.body
  if (!model || !prompt) return res.status(400).json({ success: false, message: '缺少必要参数' })
  if (!apiKey) return res.status(400).json({ success: false, message: '请先配置 WaveSpeedAI API Key（免费注册：wavespeed.ai）' })

  const config = videoModelConfig[model]
  if (!config) return res.status(400).json({ success: false, message: '不支持的视频生成模型' })

  let userId = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
      userId = decoded.id
    } catch { }
  }

  const logVideoUsage = (success) => {
    if (!userId) return
    pool.query(
      'INSERT INTO ai_usage_logs (user_id, mode, model, tokens, uses_own_key) VALUES (?, ?, ?, ?, ?)',
      [userId, 'video', model, success ? 1 : 0, apiKey ? 1 : 0]
    ).catch(e => console.error('[AI Video] 记录使用日志失败:', e.message))
  }

  try {
    const submitBody = { prompt, size: '832*480', duration: duration || 5, seed: -1 }
    if (negativePrompt) submitBody.negative_prompt = negativePrompt

    const submitRes = await _fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(submitBody)
    })

    if (!submitRes.ok) {
      const errorText = await submitRes.text()
      let errorMessage = `视频生成提交失败 (${submitRes.status})`
      try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.error?.message || errorJson.message || errorMessage } catch {}
      return res.status(submitRes.status).json({ success: false, message: errorMessage })
    }

    const submitData = await submitRes.json()
    const requestId = submitData.data?.id || submitData.id
    if (!requestId) return res.status(500).json({ success: false, message: '视频生成任务提交失败：未获取到任务ID' })

    const maxPolls = 120
    const pollInterval = 5000
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      const resultRes = await _fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (!resultRes.ok) continue
      const resultData = await resultRes.json()
      const status = resultData.data?.status
      if (status === 'succeeded' || status === 'complete') {
        const outputs = resultData.data?.outputs
        let videoUrl = null
        if (outputs) {
          if (Array.isArray(outputs)) videoUrl = outputs[0]?.url || outputs[0]
          else if (outputs.video) videoUrl = outputs.video
          else if (outputs.url) videoUrl = outputs.url
          else if (typeof outputs === 'string') videoUrl = outputs
        }
        if (videoUrl) { logVideoUsage(true); return res.json({ success: true, video: videoUrl }) }
        return res.status(500).json({ success: false, message: '视频生成完成但未获取到视频地址' })
      }
      if (status === 'failed') return res.status(500).json({ success: false, message: resultData.data?.error || '视频生成失败' })
    }
    return res.status(408).json({ success: false, message: '视频生成超时，请稍后重试' })
  } catch (err) {
    console.error('视频生成错误:', err.message)
    return res.status(500).json({ success: false, message: '视频生成请求失败' })
  }
})

module.exports = router

console.log('[AI模块已加载] 支持的模型:', Object.keys(modelConfig))

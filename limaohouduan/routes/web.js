const express = require('express')
const router = express.Router()

let _fetch
if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
  _fetch = globalThis.fetch
} else {
  try { _fetch = require('node-fetch') } catch {
    console.error('❌ 未找到 fetch API')
    process.exit(1)
  }
}

const { JSDOM } = require('jsdom')

router.post('/search', async (req, res) => {
  const { query, count } = req.body
  if (!query) return res.status(400).json({ success: false, message: '缺少搜索关键词' })

  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`
    const response = await _fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LiMaoBot/1.0)' }
    })
    const data = await response.json()

    const results = []
    if (data.Abstract) {
      results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.Abstract })
    }
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, (count || 5) - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text })
        }
      }
    }

    if (results.length === 0) {
      const fallbackUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      const htmlRes = await _fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await htmlRes.text()

      try {
        const dom = new JSDOM(html)
        const doc = dom.window.document
        const items = doc.querySelectorAll('.result')
        const maxResults = count || 5
        for (let i = 0; i < Math.min(items.length, maxResults); i++) {
          const item = items[i]
          const titleEl = item.querySelector('.result__title a, .result__a')
          const snippetEl = item.querySelector('.result__snippet')
          if (titleEl) {
            results.push({
              title: titleEl.textContent.trim().slice(0, 100),
              url: titleEl.href || '',
              snippet: snippetEl ? snippetEl.textContent.trim().slice(0, 200) : ''
            })
          }
        }
      } catch {}
    }

    res.json({ success: true, query, results: results.slice(0, count || 5) })
  } catch (err) {
    console.error('[Web Search] 搜索失败:', err.message)
    res.status(500).json({ success: false, message: '搜索请求失败: ' + err.message })
  }
})

router.post('/fetch', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ success: false, message: '缺少URL参数' })

  try {
    const parsedUrl = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, message: '只支持HTTP/HTTPS协议' })
    }

    const response = await _fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: `请求失败: ${response.status}` })
    }

    const contentType = response.headers.get('content-type') || ''
    let content = ''
    let title = ''

    if (contentType.includes('text/html')) {
      const html = await response.text()
      try {
        const dom = new JSDOM(html)
        const doc = dom.window.document

        const titleEl = doc.querySelector('title')
        title = titleEl ? titleEl.textContent.trim() : ''

        doc.querySelectorAll('script, style, nav, footer, header, iframe, noscript').forEach(el => el.remove())

        const mainEl = doc.querySelector('main, article, .content, .post, .article, #content, #main, .markdown-body, .documentation')
        const textEl = mainEl || doc.body
        content = textEl ? textEl.textContent.replace(/\s+/g, ' ').trim() : ''

        const MAX_CONTENT = 15000
        if (content.length > MAX_CONTENT) {
          content = content.slice(0, MAX_CONTENT) + '...(内容已截断)'
        }
      } catch {
        content = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 15000)
      }
    } else if (contentType.includes('application/json')) {
      const json = await response.text()
      content = json.slice(0, 15000)
      title = parsedUrl.hostname
    } else if (contentType.includes('text/')) {
      content = await response.text()
      if (content.length > 15000) content = content.slice(0, 15000) + '...(内容已截断)'
      title = parsedUrl.hostname
    } else {
      return res.json({ success: true, title: parsedUrl.hostname, url, content: `[二进制内容: ${contentType}]`, contentType })
    }

    res.json({ success: true, title, url, content, contentType })
  } catch (err) {
    console.error('[Web Fetch] 获取失败:', err.message)
    res.status(500).json({ success: false, message: '获取网页失败: ' + err.message })
  }
})

module.exports = router

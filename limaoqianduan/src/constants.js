import DOMPurify from 'dompurify'

export const CATEGORIES = ['全部', '小程序', '安卓', '鸿蒙', '苹果', '网址', 'AI', '文档']

export const CATEGORY_ICONS = {
  '全部': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M768 544H544V768c0 123.52 100.48 224 224 224s224 -100.48 224 -224 -100.48 -224 -224 -224zM32 768c0 123.52 100.48 224 224 224s224 -100.48 224 -224V544H256C132.48 544 32 644.48 32 768zM992 256c0 -123.52 -100.48 -224 -224 -224S544 132.48 544 256v224H768c123.52 0 224 -100.48 224 -224zM256 32C132.48 32 32 132.48 32 256S132.48 480 256 480h224V256C480 132.48 379.52 32 256 32z" fill="#4e5969"/></svg>`,
  '小程序': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M512 1C229.8 1 1 229.8 1 512s228.8 511 511 511 511 -228.8 511 -511S794.8 1 512 1z m298.3 456.3c-23.2 37.4 -60 65.4 -104 78.4 -11.3 3.6 -20.8 4.8 -29.7 4.8 -23.2 0 -41 -17.8 -41 -41s17.8 -41 41 -41c1.2 0 2.4 0 4.2 -0.6h0.6c26.1 -7.1 46.9 -22.6 58.8 -42.2 7.7 -12.5 11.3 -26.1 11.3 -41 0 -48.1 -44.6 -86.8 -99.2 -86.8 -19 0 -37.4 4.8 -54.1 14.3 -28.5 16 -45.2 43.4 -45.2 73.1v276.9c0 59.4 -32.7 112.9 -86.8 143.8 -28.5 16 -61.2 25 -94.5 25C271.4 821 190 744.9 190 651.6c0 -28.5 8.3 -57 23.8 -83.2C237 531 273.8 503 317.2 490c12.5 -3.6 21.4 -4.8 30.3 -4.8 23.2 0 41 17.8 41 41s-17.8 41 -41 41c-1.2 0 -2.4 0 -4.2 0.6 -26.7 8.3 -47.5 23.2 -59.4 42.8 -7.7 12.5 -11.3 26.1 -11.3 41 0 48.1 44.6 86.7 99.8 86.7 19 0 37.4 -4.8 54.1 -14.3 28.5 -16 45.2 -43.4 45.2 -73.1V374.2c0 -59.4 32.7 -112.9 86.8 -143.8 27.3 -16.6 60 -25.6 93.9 -25.6 100.4 0 181.8 76.1 181.8 169.3 -0.2 28 -8.5 57.1 -23.9 83.2z" fill="#2BA245"/></svg>`,
  '安卓': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M64.012 63.946h896.174V960.12H64.012z" fill="#26CC6A"/><path d="M128 750.732h768.617c0 -130.115 -53.034 -246.934 -159.105 -322.986l84.035 -84.103c14.007 -16.009 14.007 -31.021 0 -45.021 -14.007 -14.007 -29.012 -14.007 -45.03 0l-96.075 96.075c-52.052 -28.014 -108.095 -42.021 -168.138 -42.021 -62.045 0 -119.093 14.007 -171.145 42.021l-96.075 -96.075c-14.007 -14.007 -29.014 -14.007 -45.023 0 -16.017 14 -16.017 29.012 0 45.021l84.093 84.103C180.05 501.788 128 618.614 128 750.732z m557.919 -216.425c25.292 0 45.795 20.503 45.795 45.795s-20.503 45.795 -45.795 45.795 -45.795 -20.503 -45.795 -45.795 20.503 -45.795 45.795 -45.795z m-347.714 0c25.292 0 45.795 20.503 45.795 45.795s-20.503 45.795 -45.795 45.795 -45.795 -20.503 -45.795 -45.795 20.503 -45.795 45.795 -45.795z" fill="#FFFFFF"/></svg>`,
  '鸿蒙': `<img src="/hongmeng.png" width="14" height="14" style="object-fit:contain;vertical-align:middle;"/>`,
  '苹果': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M950.7 750.6c-24 53.1 -35.4 76.8 -66.3 123.8 -43.1 65.6 -103.8 147.2 -179 147.9 -66.9 0.6 -84 -43.5 -174.8 -43 -90.7 0.5 -109.6 43.8 -176.5 43.1 -75.2 -0.7 -132.8 -74.4 -175.9 -140C57.7 699.1 45.1 483.9 119.4 369.5c52.8 -81.3 136.1 -128.9 214.4 -128.9 79.8 0 129.9 43.7 195.8 43.7 64 0 102.9 -43.8 195.1 -43.8 69.7 0 143.5 38 196.2 103.5 -172.4 94.6 -144.4 340.7 29.8 406.6zM654.8 167.3c-35.9 46 -97.7 81.7 -157.4 79.8 -10.9 -59.4 17.1 -120.4 51 -161.7 37.4 -45.2 101.4 -80 156.1 -83.8 9.3 62.1 -16.2 122.7 -49.7 165.7z" fill="#1d2129"/></svg>`,
  '网址': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M736 864H288c-17.6 0 -32 14.4 -32 32s14.4 32 32 32h448c17.6 0 32 -14.4 32 -32s-14.4 -32 -32 -32zM832 96H192c-70.4 0 -128 57.6 -128 128v416c0 70.4 57.6 128 128 128h640c70.4 0 128 -57.6 128 -128V224c0 -70.4 -57.6 -128 -128 -128zM576 544c0 17.6 -14.4 32 -32 32H288c-17.6 0 -32 -14.4 -32 -32s14.4 -32 32 -32h256c17.6 0 32 14.4 32 32z m192 -224c0 17.6 -14.4 32 -32 32H288c-17.6 0 -32 -14.4 -32 -32s14.4 -32 32 -32h448c17.6 0 32 14.4 32 32z"/></svg>`,
  'AI': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M512 160c-150 0 -280 100 -320 240 -10 40 -15 80 -12 120 3 50 20 95 50 135 30 40 70 70 120 90 45 18 95 27 147 29h30c52 -2 102 -11 147 -29 50 -20 90 -50 120 -90 30 -40 47 -85 50 -135 3 -40 -2 -80 -12 -120 -40 -140 -170 -240 -320 -240z" fill="#000000"/><path d="M512 200v624M360 300c-25 35 -40 80 -42 130M664 300c25 35 40 80 42 130M340 500c-15 25 -22 55 -20 85M684 500c15 25 22 55 20 85M380 650c20 20 45 32 72 36M644 650c-20 20 -45 32 -72 36" stroke="#FFFFFF" stroke-width="16" fill="none" stroke-linecap="round"/></svg>`,
  '文档': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M832 64H192c-35.2 0 -64 28.8 -64 64v768c0 35.2 28.8 64 64 64h640c35.2 0 64 -28.8 64 -64V128c0 -35.2 -28.8 -64 -64 -64zM608 704H320c-17.6 0 -32 -14.4 -32 -32s14.4 -32 32 -32h288c17.6 0 32 14.4 32 32s-14.4 32 -32 32z m96 -192H320c-17.6 0 -32 -14.4 -32 -32s14.4 -32 32 -32h384c17.6 0 32 14.4 32 32s-14.4 32 -32 32z m0 -192H320c-17.6 0 -32 -14.4 -32 -32s14.4 -32 32 -32h384c17.6 0 32 14.4 32 32s-14.4 32 -32 32z" fill="#F59E0B"/></svg>`,
}

export const CATEGORY_COLORS = {
  '小程序': 'linear-gradient(135deg, #E6FFF0, #FFFFFF)',
  '安卓': 'linear-gradient(135deg, #E8FFF2, #FFFFFF)',
  '鸿蒙': 'linear-gradient(135deg, #FFF0F6, #FFFFFF)',
  '苹果': 'linear-gradient(135deg, #FFF8F0, #FFFFFF)',
  '网址': 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
  'AI': 'linear-gradient(135deg, #F5F0FF, #FFFFFF)',
  '文档': 'linear-gradient(135deg, #FFFBEB, #FFFFFF)'
}

export const CATEGORY_GROUPS = [
  { label: '全部', children: ['全部'] },
  { label: '小程序', children: ['微信小程序', '支付宝小程序', '百度小程序', '抖音小程序'] },
  { label: 'APP', children: ['APP：安卓', 'APP：苹果', 'APP：鸿蒙'] },
  { label: '软件', children: ['软件：Windows', '软件：Linux', '软件：macOS'] },
  { label: '网站', children: ['网站：网页'] }
]

export const PRODUCT_CATEGORIES = ['全部', '小程序', 'APP', '软件', '网站']

export const PRODUCT_CATEGORY_ICONS = {
  '全部': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M768 544H544V768c0 123.52 100.48 224 224 224s224 -100.48 224 -224 -100.48 -224 -224 -224zM32 768c0 123.52 100.48 224 224 224s224 -100.48 224 -224V544H256C132.48 544 32 644.48 32 768zM992 256c0 -123.52 -100.48 -224 -224 -224S544 132.48 544 256v224H768c123.52 0 224 -100.48 224 -224zM256 32C132.48 32 32 132.48 32 256S132.48 480 256 480h224V256C480 132.48 379.52 32 256 32z" fill="#4e5969"/></svg>`,
  '小程序': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M512 1C229.8 1 1 229.8 1 512s228.8 511 511 511 511 -228.8 511 -511S794.8 1 512 1z" fill="#2BA245"/></svg>`,
  'APP': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M64.012 63.946h896.174V960.12H64.012z" fill="#26CC6A"/></svg>`,
  '软件': `<svg viewBox="0 0 1024 1024" width="14" height="14"><rect x="64" y="160" width="400" height="320" fill="#00A4EF"/><rect x="64" y="520" width="400" height="320" fill="#0078D4"/><rect x="560" y="160" width="400" height="320" fill="#2B88D8"/><rect x="560" y="520" width="400" height="320" fill="#00A4EF"/></svg>`,
  '网站': `<svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M832 96H192c-70.4 0 -128 57.6 -128 128v416c0 70.4 57.6 128 128 128h640c70.4 0 128 -57.6 128 -128V224c0 -70.4 -57.6 -128 -128 -128z" fill="#4E5969"/></svg>`,
}

export const PRODUCTS = [
  { id: 'p-ai', name: '狸猫AI', desc: '智能AI对话助手，支持多种模型', category: '网站', icon: '🤖', link: 'ai' },
  { id: 'p-community', name: '狸猫社区', desc: '技术交流与开源分享社区', category: '网站', icon: '💬', link: 'forum' },
]

export const SOURCE_LINKS = [
  { key: 'github', label: 'GitHub 仓库链接', placeholder: 'https://github.com/...' },
  { key: 'gitee', label: 'Gitee 仓库链接', placeholder: 'https://gitee.com/...' },
  { key: 'aliyun', label: '阿里云盘下载链接', placeholder: 'https://www.alipan.com/...' },
  { key: 'baidu', label: '百度网盘下载链接', placeholder: 'https://pan.baidu.com/...' },
  { key: 'tencent', label: '腾讯微云下载链接', placeholder: 'https://share.weiyun.com/...' },
  { key: 'local', label: '本地文件上传', placeholder: '点击上传文件到服务器' }
]

export function getProjectCategoryLabel(key) {
  return key || '其他'
}

export function getImageUrl(url) {
  if (!url) return url
  if (url.startsWith('http')) return url
  return url.startsWith('/') ? url : '/' + url
}

export function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  if (d.getFullYear() !== now.getFullYear()) return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function renderContent(content) {
  if (!content) return ''
  let html = escapeHtml(content)

  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`
  })

  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  html = html.replace(/### (.+)/g, '<h3 class="content-h3">$1</h3>')
  html = html.replace(/## (.+)/g, '<h2 class="content-h2">$1</h2>')
  html = html.replace(/^# (.+)/gm, '<h1 class="content-h1">$1</h1>')

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  html = html.replace(/https?:\/\/[^\s<>&"']+/g, url => {
    if (!/^https?:\/\//i.test(url)) return url
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="content-link">${url}</a>`
  })

  html = html.replace(/---/g, '<hr class="content-divider">')

  html = html.replace(/\n/g, '<br>')

  html = html.replace(/<br><br>/g, '</p><p>')
  html = `<p>${html}</p>`
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[123][^>]*>)/g, '$1')
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre[^>]*>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<p>(<hr[^>]*>)<\/p>/g, '$1')

  return DOMPurify.sanitize(html)
}

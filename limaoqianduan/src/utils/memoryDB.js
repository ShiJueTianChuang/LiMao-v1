const DB_NAME = 'limao_memory'
const DB_VERSION = 1
const STORE = 'memories'

let dbInstance = null

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('topic', 'topic', { unique: false })
      }
    }
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }
    request.onerror = () => reject(request.error)
  })
}

function tokenize(text) {
  const cleaned = text.toLowerCase().replace(/[^a-zA-Z\u4e00-\u9fa5_$0-9]+/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length > 1)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or',
    'if', 'while', 'about', 'up', 'down', 'this', 'that', 'it', 'its',
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
    '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
    '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '什么',
    '吗', '呢', '吧', '啊', '哦', '嗯'
  ])

  const freq = {}
  for (const w of words) {
    if (stopWords.has(w)) continue
    freq[w] = (freq[w] || 0) + 1
  }

  const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1
  const tf = {}
  for (const [w, count] of Object.entries(freq)) {
    tf[w] = count / total
  }

  return tf
}

function extractKeywords(text, topN = 8) {
  const tf = tokenize(text)
  const scored = Object.entries(tf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
  return scored.map(([k]) => k)
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] || 0
    const vb = b[key] || 0
    dot += va * vb
    normA += va * va
    normB += vb * vb
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function saveMemory({ topic, content, keywords, source }) {
  const db = await openDB()
  const kw = keywords || extractKeywords(content || topic || '')
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const record = {
      topic: topic || '',
      content: content || '',
      keywords: kw,
      keywordVector: tokenize(kw.join(' ') + ' ' + (topic || '')),
      source: source || 'user',
      timestamp: Date.now()
    }
    const request = store.add(record)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function searchMemories(query, limit = 10, minScore = 0.05) {
  const db = await openDB()
  const queryVec = tokenize(query)
  if (Object.keys(queryVec).length === 0) return []

  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })

  const scored = all.map(m => ({
    ...m,
    _score: cosineSimilarity(queryVec, m.keywordVector || {})
  }))

  return scored
    .filter(m => m._score >= minScore)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
}

export async function getRecentMemories(limit = 20) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev')
    const results = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor && results.length < limit) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getMemoriesByTopic(topic) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const index = store.index('topic')
    const request = index.getAll(topic)
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMemory(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllMemories() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMemoryCount() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function autoExtractMemoriesFromConversation(messages, topic) {
  console.log('[MemoryDB] autoExtract 开始, messages数量:', messages?.length, 'topic:', topic)
  if (!messages || messages.length === 0) { console.log('[MemoryDB] autoExtract 跳过: 无消息'); return }

  const userMessages = messages.filter(m => m.role === 'user' && m.content)
  console.log('[MemoryDB] 用户消息数:', userMessages.length)
  if (userMessages.length === 0) { console.log('[MemoryDB] autoExtract 跳过: 无用户消息'); return }

  const combined = userMessages.map(m => m.content).join(' ')
  const keywords = extractKeywords(combined, 10)
  console.log('[MemoryDB] 提取关键词:', keywords)

  const decisionPatterns = [
    ...combined.matchAll(/(?:选择|决定|采用|使用|用|换成|改为|选)(?:了)?\s*([^，。,\n]{3,30})/g),
    ...combined.matchAll(/(?:偏好|喜欢|习惯|倾向)(?:是|为)?\s*([^，。,\n]{3,30})/g),
    ...combined.matchAll(/(?:框架|库|技术栈|数据库|部署|架构).*?(?:是|为|用|使用)\s*([^，。,\n]{3,30})/g)
  ]

  const decisions = decisionPatterns.map(m => m[1].trim()).filter((v, i, a) => a.indexOf(v) === i)

  const summaryParts = []
  if (decisions.length > 0) {
    summaryParts.push(`用户决策: ${decisions.join('; ')}`)
  }
  summaryParts.push(`对话主题: ${keywords.slice(0, 6).join(', ')}`)

  console.log('[MemoryDB] decisions:', decisions)
  console.log('[MemoryDB] summaryParts:', summaryParts)
  console.log('[MemoryDB] 准备保存记忆...')

  await saveMemory({
    topic: topic || combined.slice(0, 80),
    content: summaryParts.join(' | '),
    keywords,
    source: 'auto'
  })
  console.log('[MemoryDB] 记忆已保存到 IndexedDB')
}

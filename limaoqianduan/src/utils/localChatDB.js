const DB_NAME = 'limao_chat'
const DB_VERSION = 1
const SESSION_STORE = 'sessions'
const MESSAGE_STORE = 'messages'

let dbInstance = null

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const store = db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        const store = db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' })
        store.createIndex('sessionId', 'sessionId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    request.onsuccess = () => {
      dbInstance = request.result
      dbInstance.onclose = () => { dbInstance = null }
      dbInstance.onerror = () => { dbInstance = null }
      resolve(dbInstance)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function saveSession(session) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    const store = tx.objectStore(SESSION_STORE)
    store.put({
      ...session,
      updatedAt: Date.now()
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSessions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readonly')
    const store = tx.objectStore(SESSION_STORE)
    const index = store.index('updatedAt')
    const request = index.openCursor(null, 'prev')
    const results = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getSession(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readonly')
    const store = tx.objectStore(SESSION_STORE)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteSession(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveMessage(msg) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, 'readwrite')
    tx.objectStore(MESSAGE_STORE).put(msg)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveMessagesBatch(msgs) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGE_STORE)
    for (const m of msgs) store.put(m)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMessagesBySession(sessionId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, 'readonly')
    const store = tx.objectStore(MESSAGE_STORE)
    const index = store.index('sessionId')
    const request = index.getAll(sessionId)
    request.onsuccess = () => {
      const results = (request.result || []).sort((a, b) => a.timestamp - b.timestamp)
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMessagesBySession(sessionId) {
  const db = await openDB()
  const msgs = await getMessagesBySession(sessionId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGE_STORE)
    for (const m of msgs) store.delete(m.id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllSessions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([SESSION_STORE, MESSAGE_STORE], 'readwrite')
    tx.objectStore(SESSION_STORE).clear()
    tx.objectStore(MESSAGE_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getChatStorageSize() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([SESSION_STORE, MESSAGE_STORE], 'readonly')
    let sessionCount = 0
    let messageCount = 0
    const sReq = tx.objectStore(SESSION_STORE).count()
    const mReq = tx.objectStore(MESSAGE_STORE).count()
    sReq.onsuccess = () => { sessionCount = sReq.result }
    mReq.onsuccess = () => { messageCount = mReq.result }
    tx.oncomplete = () => resolve({ sessionCount, messageCount })
    tx.onerror = () => reject(tx.error)
  })
}

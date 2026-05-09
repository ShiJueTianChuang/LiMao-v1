const DB_NAME = 'limao_user_files'
const DB_VERSION = 1
const FILE_STORE = 'userFiles'

let dbInstance = null

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        const store = db.createObjectStore(FILE_STORE, { keyPath: 'id' })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('name', 'name', { unique: false })
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

export async function saveUserFile(file, category = 'other') {
  const db = await openDB()
  const id = generateId()
  const arrayBuffer = await file.arrayBuffer()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    const record = {
      id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      sizeFormatted: formatSize(file.size),
      category,
      data: arrayBuffer,
      timestamp: Date.now()
    }
    store.put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getUserFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getUserFileBlob(id) {
  const record = await getUserFile(id)
  if (!record) return null
  return new Blob([record.data], { type: record.type })
}

export async function getUserFileUrl(id) {
  const blob = await getUserFileBlob(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function getAllUserFiles() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev')
    const results = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const { data, ...meta } = cursor.value
        results.push(meta)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getFilesByCategory(category) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const index = store.index('category')
    const request = index.getAll(category)
    request.onsuccess = () => {
      const results = (request.result || []).map(({ data, ...meta }) => meta)
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteUserFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    tx.objectStore(FILE_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllUserFiles() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    tx.objectStore(FILE_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getUserFilesStorageSize() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const request = store.openCursor()
    let totalSize = 0
    let count = 0
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        totalSize += cursor.value.size || 0
        count++
        cursor.continue()
      } else {
        resolve({ count, totalSize, totalSizeFormatted: formatSize(totalSize) })
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function downloadUserFile(id) {
  const record = await getUserFile(id)
  if (!record) return
  const blob = new Blob([record.data], { type: record.type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = record.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist()
    return granted
  }
  return false
}

export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate()
    return {
      usage: est.usage || 0,
      quota: est.quota || 0,
      usageFormatted: formatSize(est.usage || 0),
      quotaFormatted: formatSize(est.quota || 0)
    }
  }
  return null
}

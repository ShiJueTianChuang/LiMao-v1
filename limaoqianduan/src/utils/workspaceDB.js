const DB_NAME = 'limao_workspace'
const DB_VERSION = 2
const FILE_STORE = 'files'

let dbInstance = null

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        const store = db.createObjectStore(FILE_STORE, { keyPath: 'path' })
        store.createIndex('folderPath', 'folderPath', { unique: false })
      }
      if (e.oldVersion < 2) {
        const store = e.target.transaction.objectStore(FILE_STORE)
        if (!store.indexNames.contains('updatedAt')) {
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
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

export async function saveFile(path, content, meta = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    store.put({
      path,
      content,
      folderPath: meta.folderPath || '',
      name: meta.name || path.split('/').pop(),
      language: meta.language || 'text',
      size: meta.size || (typeof content === 'string' ? content.length : 0),
      updatedAt: Date.now()
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveFilesBatch(files) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    for (const f of files) {
      store.put({
        path: f.path,
        content: f.content,
        folderPath: f.folderPath || '',
        name: f.name || f.path.split('/').pop(),
        language: f.language || 'text',
        size: f.size || (typeof f.content === 'string' ? f.content.length : 0),
        updatedAt: Date.now()
      })
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getFile(path) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const request = store.get(path)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getFilesByFolder(folderPath) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const index = store.index('folderPath')
    const request = index.getAll(folderPath)
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function getAllFiles() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly')
    const store = tx.objectStore(FILE_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteFile(path) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    store.delete(path)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteFilesByFolder(folderPath) {
  const db = await openDB()
  const files = await getFilesByFolder(folderPath)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    for (const f of files) {
      store.delete(f.path)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllFiles() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite')
    const store = tx.objectStore(FILE_STORE)
    store.clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

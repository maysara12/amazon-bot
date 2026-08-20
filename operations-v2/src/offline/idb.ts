const DB_NAME = '007-operations-v2'
const DB_VERSION = 1
const KV_STORE = 'kv'
const OUTBOX_STORE = 'outbox'

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE)
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })

  return databasePromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase()
  return requestResult<T | undefined>(db.transaction(KV_STORE, 'readonly').objectStore(KV_STORE).get(key))
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(KV_STORE, 'readwrite')
  tx.objectStore(KV_STORE).put(value, key)
  await transactionDone(tx)
}

export async function outboxPut<T extends { id: string }>(value: T): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(OUTBOX_STORE, 'readwrite')
  tx.objectStore(OUTBOX_STORE).put(value)
  await transactionDone(tx)
}

export async function outboxDelete(id: string): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(OUTBOX_STORE, 'readwrite')
  tx.objectStore(OUTBOX_STORE).delete(id)
  await transactionDone(tx)
}

export async function outboxAll<T>(): Promise<T[]> {
  const db = await openDatabase()
  return requestResult<T[]>(db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).getAll())
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

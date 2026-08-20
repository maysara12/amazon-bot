import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'
import { kvGet, kvSet } from './idb'

const CACHE_KEY = 'tanstack-cache-v1'
const MAX_CACHE_AGE_MS = 12 * 60 * 60 * 1000

type PersistedCache = {
  savedAt: number
  state: ReturnType<typeof dehydrate>
}

export async function restoreQueryCache(queryClient: QueryClient): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false

  try {
    const cached = await kvGet<PersistedCache>(CACHE_KEY)
    if (!cached || Date.now() - cached.savedAt > MAX_CACHE_AGE_MS) return false
    hydrate(queryClient, cached.state)
    return true
  } catch (error) {
    console.warn('007 V2 query cache restore failed', error)
    return false
  }
}

export function startQueryCachePersistence(queryClient: QueryClient): () => void {
  if (typeof indexedDB === 'undefined') return () => undefined

  let timer: number | undefined
  const persist = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      const state = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) => query.state.status === 'success',
      })
      void kvSet<PersistedCache>(CACHE_KEY, { savedAt: Date.now(), state }).catch((error) => {
        console.warn('007 V2 query cache persist failed', error)
      })
    }, 250)
  }

  const unsubscribeQuery = queryClient.getQueryCache().subscribe(persist)
  const unsubscribeMutation = queryClient.getMutationCache().subscribe(persist)

  return () => {
    window.clearTimeout(timer)
    unsubscribeQuery()
    unsubscribeMutation()
  }
}

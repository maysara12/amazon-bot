import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { queryClient } from './app/query-client'
import { restoreQueryCache, startQueryCachePersistence } from './offline/query-cache'
import './styles.css'
import './realtime/realtime.css'
import './offline/offline.css'

async function boot() {
  const root = document.getElementById('root')
  if (!root) throw new Error('007 Operations V2 root element is missing')

  await restoreQueryCache(queryClient)
  startQueryCachePersistence(queryClient)

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void boot()

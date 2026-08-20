import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) throw new Error('Missing V2 staging public environment variables')

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let timeoutId

try {
  const received = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Realtime event timeout after 30s')), 30_000)

    const channel = client
      .channel(`v2-ci-smoke-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'v2_realtime_smoke' },
        (payload) => resolve({ channel, payload }),
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await sleep(750)
          for (let attempt = 1; attempt <= 2; attempt += 1) {
            const { error } = await client.rpc('v2_realtime_smoke_ping')
            if (error) return reject(new Error(`Realtime smoke RPC failed: ${error.message}`))
            if (attempt < 2) await sleep(1_500)
          }
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Realtime channel status: ${status}`))
        }
      })
  })

  const { channel, payload } = await received
  console.log(`✓ realtime event: ${payload.eventType} ${payload.table}`)
  await client.removeChannel(channel)
  console.log('007 Operations V2 realtime smoke test passed')
} finally {
  clearTimeout(timeoutId)
  await client.removeAllChannels()
}

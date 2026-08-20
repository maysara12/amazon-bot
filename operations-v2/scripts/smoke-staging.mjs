import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing V2 staging public environment variables')
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const checks = [
  ['zones', 1],
  ['housing_units', 1],
  ['housing_stays', 1],
  ['housing_assessments', 1],
]

for (const [table, minimum] of checks) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  if ((count ?? 0) < minimum) throw new Error(`${table}: expected at least ${minimum} staging row(s), got ${count ?? 0}`)
  console.log(`✓ ${table}: ${count}`)
}

console.log('007 Operations V2 staging smoke test passed')

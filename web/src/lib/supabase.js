import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both env vars are present.
export const supabaseReady = Boolean(url && key)

if (!supabaseReady) {
  console.error(
    '[Supabase] Missing env vars. Create web/.env.local with ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `npm run dev`.'
  )
}

// Only build a client when configured, so a missing .env.local
// shows a friendly message instead of crashing to a white page.
export const supabase = supabaseReady ? createClient(url, key) : null

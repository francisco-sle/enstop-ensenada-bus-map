import { createClient } from 'jsr:@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number
  resetTime: number
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (30 req/min per IP)
// NOTE: This is per-isolate; Deno Deploy spins up multiple isolates, so this
// provides a best-effort limit, not a hard global cap. For a hard cap, use
// Deno KV or an external store in a future Phase 2 upgrade.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60_000
const ipRateMap = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)

  if (!entry || now > entry.resetTime) {
    ipRateMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ---------------------------------------------------------------------------
// CORS headers — included on every response (including error paths)
// ---------------------------------------------------------------------------
const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function corsResponse(body: string, init: ResponseInit): Response {
  const headers = new Headers(init.headers)
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
  return new Response(body, { ...init, headers })
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return corsResponse(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ---------------------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------------------
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (!checkRateLimit(clientIp)) {
    return corsResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Parse request body
  // ---------------------------------------------------------------------------
  let token: string | undefined
  try {
    const body = await req.json()
    token = body?.token
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!token) {
    return corsResponse(JSON.stringify({ error: 'Missing Turnstile token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ---------------------------------------------------------------------------
  // Cloudflare Turnstile validation
  // ---------------------------------------------------------------------------
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET')
  if (!turnstileSecret) {
    console.error('TURNSTILE_SECRET env var is not set')
    return corsResponse(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const verifyForm = new FormData()
  verifyForm.append('secret', turnstileSecret)
  verifyForm.append('response', token)
  verifyForm.append('remoteip', clientIp)

  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: verifyForm },
  )
  const verifyData = await verifyRes.json()

  if (!verifyData.success) {
    return corsResponse(JSON.stringify({ error: 'Turnstile validation failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // TODO (Phase 2): Extract Authorization header JWT here to serve personalized
  // data or sponsored locations to authenticated users.
  // const authHeader = req.headers.get('Authorization')
  // const jwt = authHeader?.replace('Bearer ', '')

  // ---------------------------------------------------------------------------
  // Secure query via service_role — bypasses RLS
  // ---------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase env vars')
    return corsResponse(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase.rpc('get_degraded_routes')

  if (error) {
    console.error('RPC error:', error)
    return corsResponse(JSON.stringify({ error: 'Failed to fetch routes' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return corsResponse(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

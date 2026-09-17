import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { recordAuditLogForUser } from '@/app/actions/audit'
import { rateLimit } from '@/lib/rateLimit'

// Plain anon-key client, just to verify the caller's bearer token — this is
// the mobile equivalent of the cookie-based session lib/supabase/server.ts
// reads for the web Server Action version of this call.
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
  }

  const { data: { user }, error } = await anon.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Generous, per-user limit — quiz.submit fires on every quiz completion,
  // a routine action, not a rare one, unlike the two pre-auth login routes.
  const { allowed } = rateLimit(`audit-log:${user.id}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (typeof body?.action !== 'string' || typeof body?.description !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await recordAuditLogForUser(user, {
    action: body.action,
    description: body.description,
    sectionId: body.sectionId ?? null,
    sectionName: body.sectionName ?? null,
  })
  return NextResponse.json({ ok: true })
}

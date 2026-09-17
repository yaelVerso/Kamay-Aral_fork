import { NextResponse } from 'next/server'
import { recordFailedLoginAttempt } from '@/app/actions/audit'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function POST(request: Request) {
  // Shares a bucket key prefix distinct from resolve-login-email's own limit,
  // but same tight profile — both are part of one failed-login sequence.
  const { allowed } = rateLimit(`record-failed-login:${clientIp(request)}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier : ''
  if (identifier.trim()) {
    await recordFailedLoginAttempt(identifier)
  }
  return NextResponse.json({ ok: true })
}

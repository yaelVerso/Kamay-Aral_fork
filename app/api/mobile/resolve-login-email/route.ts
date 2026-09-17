import { NextResponse } from 'next/server'
import { resolveLoginEmail } from '@/app/actions/auth'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const GENERIC_ERROR = { error: 'Incorrect email/ID or password' }

export async function POST(request: Request) {
  const { allowed } = rateLimit(`resolve-login-email:${clientIp(request)}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json(GENERIC_ERROR, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier : ''
  if (!identifier.trim()) {
    return NextResponse.json(GENERIC_ERROR, { status: 400 })
  }

  const result = await resolveLoginEmail(identifier)
  // resolveLoginEmail already returns a generic {error} shape on any failure
  // mode (not found, malformed, etc.) — no enumeration signal to introduce here.
  if ('error' in result) {
    return NextResponse.json(GENERIC_ERROR, { status: 200 })
  }
  return NextResponse.json(result, { status: 200 })
}

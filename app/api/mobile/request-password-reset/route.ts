import { NextResponse } from 'next/server'
import { requestPasswordResetAction } from '@/app/actions/auth'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const GENERIC_RESPONSE = { message: 'If an account exists for that email, we\'ve sent a reset link.' }

export async function POST(request: Request) {
  const { allowed } = rateLimit(`request-password-reset:${clientIp(request)}`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(GENERIC_RESPONSE, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email : ''
  if (!email.trim()) {
    return NextResponse.json(GENERIC_RESPONSE, { status: 400 })
  }

  await requestPasswordResetAction(email)
  return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
}

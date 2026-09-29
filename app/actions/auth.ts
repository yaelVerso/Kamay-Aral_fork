'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/templates'
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_WINDOW_MINUTES } from '@/lib/loginLockout'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export async function requestPasswordResetAction(email: string) {
  const admin = createAdminClient()
  const trimmedEmail = email.trim()

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
      options: { redirectTo: `${SITE_URL}/setup-password` },
    })
    if (!error) {
      await sendPasswordResetEmail(trimmedEmail, 'your account', data.properties.action_link)
    }
  } catch {
    // swallow — always return generic response below
  }

  return { message: 'If an account exists for that email, we\'ve sent a reset link.' }
}

// resolves an ID number to its email for login — admin has no id_number, always uses email.
// Returns a value rather than throwing — the "no match found" case is an expected
// outcome here (any garbage input reaches it), not a bug, and Next.js redacts thrown
// Server Action errors in production builds, which made this unreliable to catch there.
export async function resolveLoginEmail(identifier: string): Promise<{ email: string } | { error: string }> {
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return { email: trimmed }

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('email')
    .eq('id_number', trimmed)
    .maybeSingle()
  if (student?.email) return { email: student.email }

  const { data: teacher } = await admin
    .from('teachers')
    .select('id')
    .eq('id_number', trimmed)
    .maybeSingle()
  if (teacher) {
    const { data: authUser } = await admin.auth.admin.getUserById(teacher.id)
    if (authUser.user?.email) return { email: authUser.user.email }
  }

  return { error: 'Incorrect email/ID or password' }
}

// Sliding window: locked out if the Nth-most-recent failed attempt for this
// identifier is still within the lockout window — so the cooldown counts down
// from the oldest of the last N failures, not a fixed calendar window.
export async function checkLoginLockout(identifier: string): Promise<{ locked: boolean; retryAfterSeconds?: number }> {
  const trimmed = identifier.trim()
  if (!trimmed) return { locked: false }

  const admin = createAdminClient()
  const { data } = await admin
    .from('audit_logs')
    .select('created_at')
    .eq('action', 'auth.login_failed')
    .eq('actor_name', trimmed)
    .order('created_at', { ascending: false })
    .limit(MAX_LOGIN_ATTEMPTS)

  if (!data || data.length < MAX_LOGIN_ATTEMPTS) return { locked: false }

  const windowMs = LOCKOUT_WINDOW_MINUTES * 60_000
  const oldestOfRecent = new Date(data[data.length - 1].created_at).getTime()
  const elapsed = Date.now() - oldestOfRecent
  if (elapsed >= windowMs) return { locked: false }

  return { locked: true, retryAfterSeconds: Math.ceil((windowMs - elapsed) / 1000) }
}

// Called once a user actually completes a password reset/setup — clears any
// login-lockout history tied to their email or ID number, so a legitimate
// password reset isn't still stuck waiting out an old cooldown. Never throws;
// a failed cleanup shouldn't block the password reset that already succeeded.
export async function clearLoginLockoutAction(userId: string) {
  try {
    const admin = createAdminClient()
    const identifiers = new Set<string>()

    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    if (authUser.user?.email) identifiers.add(authUser.user.email)

    const { data: student } = await admin.from('students').select('id_number').eq('id', userId).maybeSingle()
    if (student?.id_number) identifiers.add(student.id_number)

    const { data: teacher } = await admin.from('teachers').select('id_number').eq('id', userId).maybeSingle()
    if (teacher?.id_number) identifiers.add(teacher.id_number)

    if (identifiers.size === 0) return

    await admin
      .from('audit_logs')
      .delete()
      .eq('action', 'auth.login_failed')
      .in('actor_name', [...identifiers])
  } catch {
    // swallow — never block a successful password reset on cleanup failing
  }
}

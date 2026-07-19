'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/templates'

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

// Lets teacher/student sign in with their ID Number instead of email. Admin
// has no id_number (not a teachers/students row) and always uses email.
// Throws the same generic message the login page uses for a bad password,
// so a wrong ID number can't be used to probe which IDs exist.
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return trimmed

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('email')
    .eq('id_number', trimmed)
    .maybeSingle()
  if (student?.email) return student.email

  const { data: teacher } = await admin
    .from('teachers')
    .select('id')
    .eq('id_number', trimmed)
    .maybeSingle()
  if (teacher) {
    const { data: authUser } = await admin.auth.admin.getUserById(teacher.id)
    if (authUser.user?.email) return authUser.user.email
  }

  throw new Error('Incorrect email/ID or password')
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// actor identity is always derived server-side from the session, never passed in
// never throws — a failed log write shouldn't break the feature it's attached to
export async function recordAuditLog(payload: {
  action: string
  description: string
  sectionId?: string | null
  sectionName?: string | null
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const role = (user.user_metadata?.role as string | undefined) ?? 'student'
    let actorName = user.user_metadata?.full_name as string | undefined

    const admin = createAdminClient()

    if (!actorName) {
      // students don't get full_name in metadata at creation, fall back to a table lookup
      const table = role === 'teacher' ? 'teachers' : 'students'
      const { data } = await admin.from(table).select('full_name').eq('id', user.id).single()
      actorName = data?.full_name ?? 'Unknown'
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_name: actorName,
      actor_role: role,
      action: payload.action,
      description: payload.description,
      section_id: payload.sectionId ?? null,
      section_name: payload.sectionName ?? null,
    })
  } catch {
    // swallow — never surface a logging error to the caller
  }
}

// no session exists yet at a failed login, so this can't reuse recordAuditLog
// (which derives the actor from the current session) — goes straight through
// the service-role client instead
export async function recordFailedLoginAttempt(identifier: string) {
  try {
    const trimmed = identifier.trim()
    const admin = createAdminClient()
    let role = 'unknown'

    if (!trimmed.includes('@')) {
      const { data: student } = await admin.from('students').select('id').eq('id_number', trimmed).maybeSingle()
      if (student) {
        role = 'student'
      } else {
        const { data: teacher } = await admin.from('teachers').select('id').eq('id_number', trimmed).maybeSingle()
        if (teacher) role = 'teacher'
      }
    }

    await admin.from('audit_logs').insert({
      actor_id: null,
      actor_name: trimmed,
      actor_role: role,
      action: 'auth.login_failed',
      description: 'failed login attempt',
    })
  } catch {
    // swallow — never surface a logging error to the caller
  }
}

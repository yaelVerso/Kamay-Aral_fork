import type { createClient } from '@/lib/supabase/server'
import { computeMastery, isScorableActivityType, type BktObservation } from '@/lib/bkt'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * BKT mastery estimate for one student's progress on one sub-module, combining
 * practice_answers and quiz_answers into a single chronological stream.
 * quiz_answers has no per-answer timestamp (a quiz is one bounded sitting), so
 * every answer from the same attempt is placed at that attempt's submitted_at
 * (or started_at if abandoned) — order within a single sitting barely affects
 * the result anyway.
 */
export async function getSubmoduleMastery(
  supabase: SupabaseServerClient,
  studentId: string,
  submoduleId: string,
): Promise<number> {
  const [{ data: practice }, { data: attempts }] = await Promise.all([
    supabase
      .from('practice_answers')
      .select('activity_type, is_correct, answered_at')
      .eq('student_id', studentId)
      .eq('submodule_id', submoduleId),
    supabase
      .from('quiz_attempts')
      .select('id, started_at, submitted_at')
      .eq('student_id', studentId)
      .eq('submodule_id', submoduleId),
  ])

  const attemptTimestamp = new Map((attempts ?? []).map((a) => [a.id, a.submitted_at ?? a.started_at]))
  const attemptIds = [...attemptTimestamp.keys()]

  const { data: quizAnswers } = attemptIds.length > 0
    ? await supabase.from('quiz_answers').select('activity_type, is_correct, attempt_id').in('attempt_id', attemptIds)
    : { data: [] as { activity_type: string; is_correct: boolean; attempt_id: string }[] }

  const observations: BktObservation[] = []

  for (const p of practice ?? []) {
    if (isScorableActivityType(p.activity_type)) {
      observations.push({ activityType: p.activity_type, isCorrect: p.is_correct, at: p.answered_at })
    }
  }

  for (const q of quizAnswers ?? []) {
    if (isScorableActivityType(q.activity_type)) {
      const at = attemptTimestamp.get(q.attempt_id) ?? new Date(0).toISOString()
      observations.push({ activityType: q.activity_type, isCorrect: q.is_correct, at })
    }
  }

  return computeMastery(observations)
}

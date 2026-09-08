import type { createClient } from '@/lib/supabase/server'
import { computeMastery, isScorableActivityType, type BktObservation } from '@/lib/bkt'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getStudentProgress(supabase: SupabaseServerClient, studentId: string) {
  const [{ data: learnProgress }, { data: attempts }, { data: practice }] = await Promise.all([
    supabase
      .from('learn_progress')
      .select('module_id, submodule_id, item_id')
      .eq('student_id', studentId),
    // All attempts (not just the active one) so teacher/admin review can
    // step back through a student's history after a reset.
    supabase
      .from('quiz_attempts')
      .select('id, submodule_id, score, total, submitted_at, started_at, is_active')
      .eq('student_id', studentId)
      .order('started_at', { ascending: true }),
    supabase
      .from('practice_answers')
      .select('submodule_id, item_id, activity_type, is_correct, answered_at')
      .eq('student_id', studentId),
  ])

  const attemptIds = attempts?.map((a) => a.id) ?? []
  const { data: answers } = attemptIds.length > 0
    ? await supabase
        .from('quiz_answers')
        .select('attempt_id, item_id, activity_type, answer_given, is_correct')
        .in('attempt_id', attemptIds)
    : { data: [] }

  // BKT mastery per sub-module — combines this student's practice_answers
  // with their quiz_answers (timestamped by the parent attempt, since
  // quiz_answers has no per-answer timestamp of its own).
  const attemptById = new Map((attempts ?? []).map((a) => [a.id, a]))
  const observationsBySubmodule = new Map<string, BktObservation[]>()
  function pushObservation(submoduleId: string, obs: BktObservation) {
    const list = observationsBySubmodule.get(submoduleId)
    if (list) list.push(obs)
    else observationsBySubmodule.set(submoduleId, [obs])
  }

  for (const p of practice ?? []) {
    if (isScorableActivityType(p.activity_type)) {
      pushObservation(p.submodule_id, { activityType: p.activity_type, isCorrect: p.is_correct, at: p.answered_at })
    }
  }
  for (const a of answers ?? []) {
    if (!isScorableActivityType(a.activity_type)) continue
    const attempt = attemptById.get(a.attempt_id)
    if (!attempt) continue
    pushObservation(attempt.submodule_id, {
      activityType: a.activity_type,
      isCorrect: a.is_correct,
      at: attempt.submitted_at ?? attempt.started_at,
    })
  }

  const masteryBySubmodule: Record<string, number> = {}
  for (const [submoduleId, observations] of observationsBySubmodule) {
    masteryBySubmodule[submoduleId] = computeMastery(observations)
  }

  return {
    learnProgress: learnProgress ?? [],
    attempts: attempts ?? [],
    answers: answers ?? [],
    practiceAnswers: practice ?? [],
    masteryBySubmodule,
  }
}

// Bayesian Knowledge Tracing — per-topic (sub-module) mastery estimate from a
// student's chronological stream of practice + quiz answers. See the planning
// discussion for the reasoning behind these specific defaults: fixed literature
// values rather than fitted (no historical data yet to fit against via EM),
// with guess probability varying by activity type since that's a real, known
// difference (multiple choice is guessable, free-text spelling isn't), while
// slip probability is kept shared (slipping despite knowing it isn't really
// type-dependent the same way).

export type BktActivityType = 'sign-to-picture' | 'drag-drop-match' | 'spelling'

export interface BktParams {
  /** Prior probability a student already knows the topic before any attempts. */
  priorL0: number
  /** Probability of moving from not-mastered to mastered after any one attempt. */
  transitionT: number
  /** Probability of answering incorrectly despite having mastered the topic. */
  slipS: number
  /** Probability of answering correctly by chance, despite not having mastered it — varies by activity type. */
  guessByType: Record<BktActivityType, number>
}

export const DEFAULT_BKT_PARAMS: BktParams = {
  priorL0: 0.15,
  transitionT: 0.1,
  slipS: 0.1,
  guessByType: {
    'sign-to-picture': 0.25, // 4-choice multiple choice
    'drag-drop-match': 0.33, // 3-way match, ~1/3 per item by chance
    spelling: 0.05, // free text, near-unguessable
  },
}

const SCORABLE_TYPES: readonly string[] = ['sign-to-picture', 'drag-drop-match', 'spelling']

/** Lesson-card views (and anything else unscored) never produce a BKT observation. */
export function isScorableActivityType(t: string): t is BktActivityType {
  return SCORABLE_TYPES.includes(t)
}

export interface BktObservation {
  activityType: BktActivityType
  isCorrect: boolean
  /** ISO timestamp — observations are processed oldest first. */
  at: string
}

/**
 * Replays the full observation history through the standard BKT update
 * (posterior from the observed correctness, then the learning transition)
 * and returns the resulting mastery probability, in [0, 1].
 *
 * Computed fresh from raw answer history each call rather than persisted —
 * classroom-scale data volumes make this cheap, and it avoids a second
 * source of truth that could drift from the underlying answers.
 */
export function computeMastery(
  observations: BktObservation[],
  params: BktParams = DEFAULT_BKT_PARAMS,
): number {
  const sorted = [...observations].sort((a, b) => a.at.localeCompare(b.at))

  let pMastered = params.priorL0
  for (const obs of sorted) {
    const guess = params.guessByType[obs.activityType]
    const slip = params.slipS

    const posterior = obs.isCorrect
      ? (pMastered * (1 - slip)) / (pMastered * (1 - slip) + (1 - pMastered) * guess)
      : (pMastered * slip) / (pMastered * slip + (1 - pMastered) * (1 - guess))

    pMastered = posterior + (1 - posterior) * params.transitionT
  }

  return pMastered
}

/**
 * Rule-based (not AI) sentence for a computed mastery value — same thresholds
 * as the color coding shown alongside it (≥80% / ≥50% / below).
 */
export function getMasteryFeedback(mastery: number): string {
  if (mastery >= 0.8) return 'Well done — this topic looks solid.'
  if (mastery >= 0.5) return 'Getting there — a bit more practice will help.'
  return 'Needs more practice on this topic.'
}

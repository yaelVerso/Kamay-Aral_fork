'use client'

import { useState } from 'react'
import type { Module, SubModule } from '@/content/types'
import ActivityRunner, { getQuizQuestionCount } from '@/components/activities/ActivityRunner'
import { Button } from '@/components/ui/button'

interface QuizAnswer {
  activity_type: string
  item_id: string
  answer_given: string | null
  is_correct: boolean
}

interface Props {
  module: Module
  submodule: SubModule
  attemptId: string
  backHref?: string
  /** Answers already saved for this attempt — present when resuming a quiz left mid-way. */
  initialAnswers?: QuizAnswer[]
}

export default function QuizGate({ module: mod, submodule, attemptId, backHref, initialAnswers }: Props) {
  const [started, setStarted] = useState(false)
  const resuming = (initialAnswers?.length ?? 0) > 0

  if (started) {
    return (
      <ActivityRunner
        module={mod}
        submodule={submodule}
        mode="quiz"
        attemptId={attemptId}
        backHref={backHref}
        initialAnswers={initialAnswers}
      />
    )
  }

  const questionCount = getQuizQuestionCount(submodule)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="text-5xl">📝</div>
      <div>
        <h1 className="text-2xl font-bold">{submodule.title} Quiz</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">
          {resuming ? (
            <>You have unfinished answers saved — pick up right where you left off.</>
          ) : (
            <>
              This quiz has <strong>{questionCount} questions</strong> and can only be taken <strong>once</strong>.
              Make sure you&apos;re ready before starting.
            </>
          )}
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={() => setStarted(true)}
          className="w-full py-6 text-base font-semibold bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]"
        >
          {resuming ? 'Continue Quiz' : 'Start Quiz'}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => history.back()}>
          Not yet
        </Button>
      </div>
    </div>
  )
}

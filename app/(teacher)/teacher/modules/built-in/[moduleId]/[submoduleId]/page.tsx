import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getModule, getSubModule } from '@/content/registry'
import QuizSectionAssignment from '@/components/teacher/QuizSectionAssignment'

interface Props { params: Promise<{ moduleId: string; submoduleId: string }> }

export default async function BuiltInSubmoduleDetailPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const mod = getModule(moduleId)
  const submodule = getSubModule(moduleId, submoduleId)
  if (!mod || !submodule) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sections }, { data: quizSettings }] = await Promise.all([
    supabase.from('sections').select('id, name').eq('teacher_id', user!.id).order('name'),
    supabase.from('quiz_settings').select('section_id').eq('submodule_id', submoduleId).eq('enabled', true),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/modules/built-in/${moduleId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> {mod.title}
        </Link>
        <h1 className="text-2xl font-bold">{submodule.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{submodule.items.length} sign{submodule.items.length === 1 ? '' : 's'} — built-in content, not editable here.</p>
      </div>

      <QuizSectionAssignment
        submoduleId={submoduleId}
        submoduleTitle={submodule.title}
        sections={sections ?? []}
        enabledSectionIds={(quizSettings ?? []).map((q) => q.section_id)}
      />
    </div>
  )
}

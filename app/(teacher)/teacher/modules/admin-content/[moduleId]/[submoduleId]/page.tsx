import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import QuizSectionAssignment from '@/components/teacher/QuizSectionAssignment'

interface Props { params: Promise<{ moduleId: string; submoduleId: string }> }

export default async function AdminContentSubmoduleDetailPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mod } = await supabase
    .from('admin_modules')
    .select('id, title')
    .eq('id', moduleId)
    .maybeSingle()
  if (!mod) notFound()

  const [{ data: submodule }, { data: signs }] = await Promise.all([
    supabase.from('admin_submodules').select('id, title').eq('id', submoduleId).eq('module_id', moduleId).maybeSingle(),
    supabase.from('admin_signs').select('id').eq('submodule_id', submoduleId),
  ])
  if (!submodule) notFound()

  const [{ data: sections }, { data: quizSettings }] = await Promise.all([
    supabase.from('sections').select('id, name').eq('teacher_id', user!.id).order('name'),
    supabase.from('quiz_settings').select('section_id').eq('submodule_id', submoduleId).eq('enabled', true),
  ])

  const signCount = signs?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/modules/admin-content/${moduleId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> {mod.title}
        </Link>
        <h1 className="text-2xl font-bold">{submodule.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{signCount} sign{signCount === 1 ? '' : 's'} — managed by admin, not editable here.</p>
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

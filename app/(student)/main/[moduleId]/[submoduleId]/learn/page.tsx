import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminModuleTree } from '@/lib/queries/adminContent'
import LearnModeClient from '@/components/student/LearnModeClient'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function MainLearnPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const mod = await getAdminModuleTree(supabase, moduleId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()

  return <LearnModeClient module={mod} submodule={submodule} backHref={`/main/${moduleId}`} />
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminModuleTree } from '@/lib/queries/adminContent'
import ActivityRunner from '@/components/activities/ActivityRunner'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function MainActivityPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const mod = await getAdminModuleTree(supabase, moduleId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()

  return <ActivityRunner module={mod} submodule={submodule} mode="activity" backHref={`/main/${moduleId}`} />
}

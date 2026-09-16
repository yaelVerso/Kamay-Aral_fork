import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, ListChecks } from 'lucide-react'

interface Props { params: Promise<{ moduleId: string }> }

/**
 * Read-only browse view for an admin-authored module — content is managed
 * entirely from /admin/modules, so unlike the custom-module equivalent
 * there's nothing here to create/edit/delete. Its only purpose is linking
 * through to each sub-module's page, where the Quiz Settings control lives.
 * Mirrors teacher/modules/built-in/[moduleId]/page.tsx exactly, since admin
 * content is equally global/visible-to-everyone.
 */
export default async function AdminContentModuleDetailPage({ params }: Props) {
  const { moduleId } = await params
  const supabase = await createClient()

  const { data: mod } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon')
    .eq('id', moduleId)
    .maybeSingle()
  if (!mod) notFound()

  const { data: submodules } = await supabase
    .from('admin_submodules')
    .select('id, title')
    .eq('module_id', moduleId)
    .order('order')

  const submoduleIds = (submodules ?? []).map((s) => s.id)
  const { data: signCounts } = submoduleIds.length > 0
    ? await supabase.from('admin_signs').select('submodule_id').in('submodule_id', submoduleIds)
    : { data: [] }

  function signCount(submoduleId: string) {
    return signCounts?.filter((s) => s.submodule_id === submoduleId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teacher/modules" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> Modules Management
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mod.icon}</span>
          <h1 className="text-2xl font-bold">{mod.title}</h1>
        </div>
        {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Sub-modules</h2>
        <div className="space-y-2">
          {submodules?.map((sm) => (
            <Link
              key={sm.id}
              href={`/teacher/modules/admin-content/${mod.id}/${sm.id}`}
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{sm.title}</p>
                  <p className="text-sm text-muted-foreground">{signCount(sm.id)} sign{signCount(sm.id) === 1 ? '' : 's'}</p>
                </div>
              </div>
              <span className="text-muted-foreground ml-1">›</span>
            </Link>
          ))}
          {(!submodules || submodules.length === 0) && (
            <p className="text-center text-muted-foreground py-6">No sub-modules.</p>
          )}
        </div>
      </div>
    </div>
  )
}

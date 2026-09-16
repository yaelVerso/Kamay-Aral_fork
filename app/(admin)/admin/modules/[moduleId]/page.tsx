import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ListChecks } from 'lucide-react'
import CreateAdminSubmoduleForm from '@/components/admin/CreateAdminSubmoduleForm'
import EditAdminSubmoduleDialog from '@/components/admin/EditAdminSubmoduleDialog'
import DeleteAdminModuleButton from '@/components/admin/DeleteAdminModuleButton'

interface Props { params: Promise<{ moduleId: string }> }

export default async function AdminModuleDetailPage({ params }: Props) {
  const { moduleId } = await params
  const supabase = await createClient()

  const { data: mod } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon')
    .eq('id', moduleId)
    .single()
  if (!mod) notFound()

  const { data: submodules } = await supabase
    .from('admin_submodules')
    .select('id, title, short_title, order')
    .eq('module_id', moduleId)
    .order('order')

  const submoduleIds = submodules?.map((s) => s.id) ?? []
  const { data: signCounts } = submoduleIds.length > 0
    ? await supabase.from('admin_signs').select('submodule_id').in('submodule_id', submoduleIds)
    : { data: [] }

  function signCount(submoduleId: string) {
    return signCounts?.filter((s) => s.submodule_id === submoduleId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/modules" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> Modules Management
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mod.icon}</span>
            <h1 className="text-2xl font-bold">{mod.title}</h1>
          </div>
          <DeleteAdminModuleButton moduleId={mod.id} moduleTitle={mod.title} />
        </div>
        {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Sub-modules</h2>
        <div className="flex flex-wrap items-start gap-2">
          <CreateAdminSubmoduleForm moduleId={mod.id} nextOrder={submodules?.length ?? 0} />
        </div>
        <div className="space-y-2">
          {submodules?.map((sm) => (
            <Link
              key={sm.id}
              href={`/admin/modules/${mod.id}/${sm.id}`}
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
              <div className="flex shrink-0 items-center gap-1">
                <EditAdminSubmoduleDialog submoduleId={sm.id} initialTitle={sm.title} initialShortTitle={sm.short_title} />
                <span className="text-muted-foreground ml-1">›</span>
              </div>
            </Link>
          ))}
          {(!submodules || submodules.length === 0) && (
            <p className="text-center text-muted-foreground py-6">No sub-modules yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  )
}

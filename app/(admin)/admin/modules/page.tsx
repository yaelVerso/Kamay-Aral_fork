import { createClient } from '@/lib/supabase/server'
import CreateAdminModuleForm from '@/components/admin/CreateAdminModuleForm'
import AdminModulesList from '@/components/admin/AdminModulesList'
import AdminModulesCsvImportDialog from '@/components/admin/AdminModulesCsvImportDialog'
import AdminModulesCsvExportButton from '@/components/admin/AdminModulesCsvExportButton'

export default async function AdminModulesPage() {
  const supabase = await createClient()

  const { data: modules } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon, color, is_active, created_at')
    .order('created_at')

  const moduleIds = modules?.map((m) => m.id) ?? []
  const { data: submoduleCounts } = moduleIds.length > 0
    ? await supabase.from('admin_submodules').select('module_id').in('module_id', moduleIds)
    : { data: [] }

  function submoduleCount(moduleId: string) {
    return submoduleCounts?.filter((s) => s.module_id === moduleId).length ?? 0
  }

  const rows = (modules ?? []).map((mod) => ({
    id: mod.id,
    title: mod.title,
    description: mod.description,
    icon: mod.icon,
    color: mod.color,
    isActive: mod.is_active,
    submoduleCount: submoduleCount(mod.id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modules Management</h1>
        <p className="text-sm text-muted-foreground">
          Create modules, sub-modules, and signs visible to every student, school-wide — separate from each teacher&apos;s own custom modules.
        </p>
      </div>

      <AdminModulesList
        modules={rows}
        createButton={
          <div className="flex flex-wrap items-start gap-2">
            <CreateAdminModuleForm />
            <AdminModulesCsvImportDialog />
            <AdminModulesCsvExportButton />
          </div>
        }
      />
    </div>
  )
}

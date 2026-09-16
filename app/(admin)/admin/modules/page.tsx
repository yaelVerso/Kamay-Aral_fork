import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import CreateAdminModuleForm from '@/components/admin/CreateAdminModuleForm'
import EditAdminModuleDialog from '@/components/admin/EditAdminModuleDialog'

export default async function AdminModulesPage() {
  const supabase = await createClient()

  const { data: modules } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon, color, created_at')
    .order('created_at')

  const moduleIds = modules?.map((m) => m.id) ?? []
  const { data: submoduleCounts } = moduleIds.length > 0
    ? await supabase.from('admin_submodules').select('module_id').in('module_id', moduleIds)
    : { data: [] }

  function submoduleCount(moduleId: string) {
    return submoduleCounts?.filter((s) => s.module_id === moduleId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modules Management</h1>
        <p className="text-sm text-muted-foreground">
          Create modules, sub-modules, and signs visible to every student, school-wide — separate from each teacher&apos;s own custom modules.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <CreateAdminModuleForm />
      </div>

      <div className="space-y-2">
        {modules?.map((mod) => (
          <Link
            key={mod.id}
            href={`/admin/modules/${mod.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                {mod.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{mod.title}</p>
                <p className="text-sm text-muted-foreground">
                  {submoduleCount(mod.id)} sub-module{submoduleCount(mod.id) === 1 ? '' : 's'} · visible to everyone
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <EditAdminModuleDialog
                moduleId={mod.id}
                initialTitle={mod.title}
                initialDescription={mod.description}
                initialIcon={mod.icon}
                initialColor={mod.color}
              />
              <span className="text-muted-foreground ml-1">›</span>
            </div>
          </Link>
        ))}
        {(!modules || modules.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            <p>No modules yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}

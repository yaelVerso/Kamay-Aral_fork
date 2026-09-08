import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ListChecks } from 'lucide-react'
import { getModule } from '@/content/registry'

interface Props { params: Promise<{ moduleId: string }> }

/**
 * Read-only browse view for a built-in module — content is static
 * (content/registry.ts), so unlike the custom-module equivalent there's
 * nothing here to create/edit/delete. Its only purpose is linking through
 * to each sub-module's page, where the actual Quiz Settings control lives.
 */
export default async function BuiltInModuleDetailPage({ params }: Props) {
  const { moduleId } = await params
  const mod = getModule(moduleId)
  if (!mod) notFound()

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
          {mod.subModules.map((sm) => (
            <Link
              key={sm.id}
              href={`/teacher/modules/built-in/${mod.id}/${sm.id}`}
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{sm.title}</p>
                  <p className="text-sm text-muted-foreground">{sm.items.length} sign{sm.items.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <span className="text-muted-foreground ml-1">›</span>
            </Link>
          ))}
          {mod.subModules.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No sub-modules.</p>
          )}
        </div>
      </div>
    </div>
  )
}

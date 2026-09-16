'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { MODULE_COLOR_PRESETS } from '@/components/teacher/CreateCustomModuleForm'

export default function CreateAdminModuleForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState<string>(MODULE_COLOR_PRESETS[0].value)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('admin_modules').insert({
        title: trimmedTitle,
        description: description.trim() || null,
        icon: icon.trim() || '📚',
        color,
      })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_module.create', description: `created module "${trimmedTitle}"` })
      toast.success(`Module "${trimmedTitle}" created`)
      setTitle('')
      setDescription('')
      setIcon('📚')
      setColor(MODULE_COLOR_PRESETS[0].value)
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
        <Plus className="h-4 w-4" />
        New Module
      </Button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="w-20 shrink-0 space-y-1">
          <Label htmlFor="admin-module-icon">Icon</Label>
          <Input id="admin-module-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" maxLength={4} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="admin-module-title">Title</Label>
          <Input id="admin-module-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Classroom Objects" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="admin-module-description">Description</Label>
        <Input id="admin-module-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown on the module card" />
      </div>
      <div className="space-y-1">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {MODULE_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setColor(preset.value)}
              className={`h-8 w-8 rounded-full border-2 ${preset.value.split(' ')[0]} ${color === preset.value ? 'border-foreground' : 'border-transparent'}`}
              aria-label={preset.label}
              title={preset.label}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
          {loading ? 'Creating…' : 'Create Module'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}

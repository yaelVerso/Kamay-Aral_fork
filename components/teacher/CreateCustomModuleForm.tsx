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

export const MODULE_COLOR_PRESETS = [
  { label: 'Amber', value: 'bg-[#FFAB41] shadow-[0_4px_0_#F18701] hover:bg-[#FF9F26]' },
  { label: 'Sky', value: 'bg-[#63B6F5] shadow-[0_4px_0_#2087D5] hover:bg-[#43AAF9]' },
  { label: 'Green', value: 'bg-[#BBE587] shadow-[0_4px_0_#82B740] hover:bg-[#A6E05F]' },
  { label: 'Rose', value: 'bg-[#FF7598] shadow-[0_4px_0_#D11141] hover:bg-[#FC557F]' },
  { label: 'Periwinkle', value: 'bg-[#8FA8F0] shadow-[0_4px_0_#3D5FC4] hover:bg-[#6E8BEA]' },
  { label: 'Violet', value: 'bg-[#B76BDC] shadow-[0_4px_0_#8749A6] hover:bg-[#AD56D8]' },
  { label: 'Olive', value: 'bg-[#7A9E49] shadow-[0_4px_0_#48691C] hover:bg-[#668E2D]' },
  { label: 'Red', value: 'bg-[#E14E4E] shadow-[0_4px_0_#9B0505] hover:bg-[#D33939]' },
  { label: 'Navy', value: 'bg-[#4D70BE] shadow-[0_4px_0_#0D348D] hover:bg-[#355DB4]' },
  { label: 'Gold', value: 'bg-[#FCCF52] shadow-[0_4px_0_#C69202] hover:bg-[#F3BD25]' },
  { label: 'Blue', value: 'bg-[#8ECAE6] shadow-[0_4px_0_#4A90B8] hover:bg-[#6BB6D6]' },
  { label: 'Yellow', value: 'bg-[#FFD97D] shadow-[0_4px_0_#D9A441] hover:bg-[#FFCB5C]' },
  { label: 'Pink', value: 'bg-[#F7B2BD] shadow-[0_4px_0_#C97D89] hover:bg-[#F492A0]' },
  { label: 'Purple', value: 'bg-[#C9B6E4] shadow-[0_4px_0_#9A7FC0] hover:bg-[#B69EDA]' },
  { label: 'Orange', value: 'bg-[#FFB584] shadow-[0_4px_0_#D97F42] hover:bg-[#FFA366]' },

] as const

export default function CreateCustomModuleForm() {
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
      const { data: { user } } = await supabase.auth.getUser()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('custom_modules').insert({
        teacher_id: user!.id,
        title: trimmedTitle,
        description: description.trim() || null,
        icon: icon.trim() || '📚',
        color,
      })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_module.create', description: `created module "${trimmedTitle}"` })
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
          <Label htmlFor="module-icon">Icon</Label>
          <Input id="module-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" maxLength={4} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="module-title">Title</Label>
          <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Classroom Objects" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="module-description">Description</Label>
        <Input id="module-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown on the module card" />
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

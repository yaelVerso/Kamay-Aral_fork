'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createSectionForTeacherAction } from '@/app/actions/admin'

export default function CreateSectionForTeacherForm({ teacherId }: { teacherId: string }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await createSectionForTeacherAction({ teacherId, name: name.trim() })
      setName('')
      toast.success(`Section "${name.trim()}" created`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create section')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Section name (e.g. Apple)"
        className="flex-1"
      />
      <Button type="submit" disabled={loading || !name.trim()} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
        <Plus className="h-4 w-4" />
        Create
      </Button>
    </form>
  )
}

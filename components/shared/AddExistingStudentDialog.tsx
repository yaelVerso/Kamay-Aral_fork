'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { UserPlus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addExistingStudentToSectionAction } from '@/app/actions/admin'

interface UnassignedStudent {
  id: string
  full_name: string
  email: string | null
}

export default function AddExistingStudentDialog({ sectionId }: { sectionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<UnassignedStudent[]>([])

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, email')
        .is('section_id', null)
        .order('full_name')
      if (error) throw error
      setStudents(data ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load unassigned students')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(studentId: string) {
    setAddingId(studentId)
    try {
      await addExistingStudentToSectionAction({ studentId, sectionId })
      toast.success('Student added to section')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setAddingId(null)
    }
  }

  const filtered = students.filter((s) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return s.full_name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-1.5" onClick={handleOpen}>
        <UserPlus className="h-4 w-4" />
        Add Existing
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Existing Student</DialogTitle>
          <DialogDescription>Only unassigned students can be added.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unassigned students…"
            className="pl-9"
          />
        </div>

        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {loading && <p className="text-center text-sm text-muted-foreground py-4">Loading…</p>}
          {!loading && filtered.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{student.full_name}</p>
                <p className="text-xs text-muted-foreground">{student.email ?? '—'}</p>
              </div>
              <Button
                size="sm"
                disabled={addingId === student.id}
                onClick={() => handleAdd(student.id)}
                className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]"
              >
                {addingId === student.id ? 'Adding…' : 'Add'}
              </Button>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No unassigned students found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string | null
  sectionName: string | null
}

export default function StudentSearchList({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q),
    )
  }, [students, query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students…"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((student) => (
          <Link
            key={student.id}
            href={`/admin/students/${student.id}`}
            className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {student.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.email ?? '—'} · {student.sectionName ?? 'Unassigned'}
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">›</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No students found.</p>
        )}
      </div>
    </div>
  )
}

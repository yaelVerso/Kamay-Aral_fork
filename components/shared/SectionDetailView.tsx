import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import CreateStudentDialog from '@/components/shared/CreateStudentDialog'
import AddExistingStudentDialog from '@/components/shared/AddExistingStudentDialog'
import RemoveFromSectionButton from '@/components/shared/RemoveFromSectionButton'
import SectionPerformanceList from '@/components/shared/SectionPerformanceList'

interface StudentRow {
  id: string
  full_name: string
  avg: number | null
  trend?: 'up' | 'down' | null
  completedCount?: number
}

interface Attempt {
  student_id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string
}

interface Props {
  sectionId: string
  sectionName: string
  students: StudentRow[]
  attempts: Attempt[]
  enabledSubmoduleIds: string[]
  studentHref: (studentId: string) => string
  allowCreateStudent?: boolean
}

export default function SectionDetailView({ sectionId, sectionName, students, attempts, enabledSubmoduleIds, studentHref, allowCreateStudent = true }: Props) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Students ({students.length})</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowCreateStudent && <CreateStudentDialog sectionId={sectionId} triggerLabel="Create New" />}
          <AddExistingStudentDialog sectionId={sectionId} />
        </div>

        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm"
            >
              <Link href={studentHref(student.id)} className="flex items-center gap-3 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-secondary-soft)] text-sm font-bold text-[var(--brand-secondary)]">
                  {student.full_name[0]?.toUpperCase()}
                </div>
                <p className="font-medium">{student.full_name}</p>
              </Link>
              <div className="flex items-center gap-2">
                {student.avg !== null && (
                  <span className={`text-sm font-bold ${student.avg >= 80 ? 'text-emerald-600' : student.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {student.avg}% avg
                  </span>
                )}
                <RemoveFromSectionButton studentId={student.id} />
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No students yet.</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="font-semibold mb-1">Section Performance</h2>
        <p className="text-sm text-muted-foreground mb-3">Ranked by quiz average — lowest first highlights who may need attention.</p>
        <SectionPerformanceList
          students={students.map((s) => ({ id: s.id, full_name: s.full_name, href: studentHref(s.id) }))}
          attempts={attempts}
          enabledSubmoduleIds={enabledSubmoduleIds}
        />
      </div>
    </>
  )
}

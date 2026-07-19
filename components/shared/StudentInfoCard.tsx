interface Props {
  idNumber: string | null
  email: string | null
  sectionName: string | null
}

export default function StudentInfoCard({ idNumber, email, sectionName }: Props) {
  return (
    <div>
      <h2 className="font-semibold mb-3">Information</h2>
      <div className="rounded-xl border bg-card p-4 shadow-sm grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">ID Number</p>
          <p className="text-sm font-medium">{idNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Section</p>
          <p className="text-sm font-medium">{sectionName ?? 'Unassigned'}</p>
        </div>
      </div>
    </div>
  )
}

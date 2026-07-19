import TeacherNav from '@/components/teacher/TeacherNav'
import { getBranding } from '@/lib/queries/branding'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { systemName, logoUrl } = await getBranding()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <TeacherNav systemName={systemName} logoUrl={logoUrl} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}

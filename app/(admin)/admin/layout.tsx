import AdminSidebar from '@/components/admin/AdminSidebar'
import { getBranding } from '@/lib/queries/branding'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { systemName, logoUrl } = await getBranding()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar systemName={systemName} logoUrl={logoUrl} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}

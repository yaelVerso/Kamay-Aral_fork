import LoginForm from '@/components/auth/LoginForm'
import { getBranding } from '@/lib/queries/branding'

export default async function LoginPage() {
  const { systemName, logoUrl } = await getBranding()
  return <LoginForm systemName={systemName} logoUrl={logoUrl} />
}

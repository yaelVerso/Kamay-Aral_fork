import { createClient } from '@/lib/supabase/server'

export interface Branding {
  systemName: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

const DEFAULT_SYSTEM_NAME = 'Kamay Aral'

// Publicly readable (see "Everyone: read branding" policy) — the login page
// needs the system name/logo/colors before the visitor is authenticated.
export async function getBranding(): Promise<Branding> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('system_name, logo_url, primary_color, secondary_color')
    .eq('id', true)
    .maybeSingle()

  return {
    systemName: data?.system_name?.trim() || DEFAULT_SYSTEM_NAME,
    logoUrl: data?.logo_url ?? null,
    primaryColor: data?.primary_color ?? null,
    secondaryColor: data?.secondary_color ?? null,
  }
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { pathname } = request.nextUrl

  function destinationFor(role: string | undefined) {
    if (role === 'admin') return '/admin/overview'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/dashboard'
  }

  function hasSessionCookie() {
    return request.cookies.getAll().some(({ name }) => name.includes('auth-token') || name.includes('sb-'))
  }

  // /setup-password relies on the temporary session created by an invite/recovery
  // link, so it must stay accessible whether or not `user` is set — never bounce.
  if (pathname === '/setup-password') {
    return supabaseResponse
  }

  const hasAuthCookie = hasSessionCookie()

  // Root path always sends signed-in users to their role's landing page.
  // For unauthenticated users, redirect immediately to avoid an extra auth round-trip.
  if (pathname === '/' && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Routes that don't require auth
  const publicRoutes = ['/login', '/forgot-password']
  if (publicRoutes.includes(pathname) && !hasAuthCookie) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (publicRoutes.includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url))
    }
    return supabaseResponse
  }

  // Unauthenticated → login
  if (!user || !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Only teachers can access /teacher routes
  if (pathname.startsWith('/teacher')) {
    if (user.user_metadata?.role !== 'teacher') {
      return NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url))
    }
  }

  // Only admin can access /admin routes
  if (pathname.startsWith('/admin')) {
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url))
    }
  }

  return supabaseResponse
}

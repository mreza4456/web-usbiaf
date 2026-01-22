import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Update request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Set cookie on response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Update request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Create new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Remove cookie from response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get current user (better than getSession for server-side)
  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 🔐 Protected routes that require login
  const protectedRoutes = ['/order', '/myorder', '/profile', '/voucher']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname) // Save original URL
    return NextResponse.redirect(redirectUrl)
  }

  // 🔐 Admin route protection
  if (pathname.startsWith('/admin')) {
    // Not logged in
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check admin role
    try {
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      // Debug logging (comment out in production)
      console.log('🔍 Admin Check:', {
        path: pathname,
        userId: user.id,
        email: user.email,
        userRole: userData?.role,
        hasError: !!roleError,
        errorMessage: roleError?.message
      })

      // If user data not found or not admin, redirect to 403
      if (roleError || !userData || userData.role !== 'admin') {
        console.log('❌ Access denied:', userData?.role || 'no role found')
        return NextResponse.redirect(new URL('/403', request.url))
      }

      console.log('✅ Admin access granted')
    } catch (err) {
      console.error('❌ Middleware error:', err)
      return NextResponse.redirect(new URL('/403', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
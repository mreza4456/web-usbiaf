import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options?: any) => res.cookies.set({ name, value, ...options }),
        remove: (name: string, options?: any) => res.cookies.set({ name, value: '', ...options }),
      } as any,
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // 🔐 Protect /order
  if (!session && (pathname.startsWith('/order') || pathname.startsWith('/myorder') || pathname.startsWith('/profile')||pathname.startsWith('/voucher'))) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // 🔐 Protect /admin (must be logged in)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // ambil role user
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url))
    }
  }

  return res
}

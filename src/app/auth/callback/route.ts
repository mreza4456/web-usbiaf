// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if user profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('social_media_completed')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (profileError || !profile) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          social_media_completed: false
        })
      }
    }
  }

  // Always redirect to home page
  // Home page will handle showing the social media modal if needed
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
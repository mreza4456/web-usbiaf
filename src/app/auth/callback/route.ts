// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    // No code, redirect to login
    return NextResponse.redirect(new URL('/auth/login', origin))
  }

  try {
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

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code:', exchangeError)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.redirect(new URL('/auth/login?error=user_not_found', origin))
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, social_media_completed')
      .eq('id', user.id)
      .maybeSingle() // ✅ Use maybeSingle instead of single to avoid error when not found

    // If profile doesn't exist, create it
    if (!profile && !profileError) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.email?.split('@')[0] || 
                    'user',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          social_media_completed: false, // ✅ Ensure modal will show
        })

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        // Continue anyway, the AppLayout will handle missing profile
      }
    }

    // Redirect to home - AppLayout will show modal if needed
    return NextResponse.redirect(new URL('/', origin))

  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL('/auth/login?error=unexpected', origin))
  }
}
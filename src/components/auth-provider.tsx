"use client"

import { useEffect } from "react"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const loadUser = useAuthStore((s) => s.loadUser)

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser();
      } else {
        setUser(null);
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser, setUser])

  return <>{children}</>
}
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { User, LogOut, ChevronDown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"

interface SiteHeaderProps {
  title?: string
}

export function SiteHeader({ title = "Dashboard" }: SiteHeaderProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1)

  const finalTitle = capitalize(title)

  const getDisplayName = () => {
    if (!user) return null
    if (user.full_name) return user.full_name
    return user.email?.split("@")[0]
  }

  const displayName = getDisplayName()

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (showUserMenu && target && !target.closest(".user-menu-container")) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setShowUserMenu(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="flex h-(--header-height) bg-white rounded-t-lg shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <h1 className="text-base font-medium">{finalTitle}</h1>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-all"
                disabled={isLoggingOut}
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{displayName}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg">
                  <div className="p-4 border-b border-border">
                    <p className="text-foreground font-semibold">{displayName}</p>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  </div>

                  <div className="p-2">
                   
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
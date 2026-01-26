"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import Navbar from "./navbar"
import LenisScroll from "./lenis"
import { AuthProvider } from "./auth-provider"
import Footer from "./footer"
import UserChat from "./user-chat"

import NoNetwork from "./no-network"

import { supabase } from '@/config/supabase'
import SocialMediaModal from '@/components/social-media-form'

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAdminLayout =
    pathname?.startsWith("/admin") && pathname !== ("/admin/")
  const isAdminChat =
    pathname?.startsWith("/admin/chat-room") && pathname !== ("/admin/chat-room/")

  const authLayout =
    pathname?.startsWith("/auth/") || pathname?.startsWith("/social-media") ||
    /^\/4\d{2}(\/|$)/.test(pathname);

  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only check on non-auth pages
    if (!authLayout && !isAdminLayout && !isAdminChat) {
      checkSocialMediaStatus()
    } else {
      setIsLoading(false)
    }
  }, [authLayout, isAdminLayout, isAdminChat])

  const checkSocialMediaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      console.log('🔍 Checking user:', user?.id) // Debug log

      if (!user) {
        console.log('❌ No user found')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('social_media_completed')
        .eq('id', user.id)
        .single()

      console.log('📊 User data:', data) // Debug log
      console.log('❓ Error:', error) // Debug log

      if (error) {
        console.error('Error checking social media status:', error)
        setIsLoading(false)
        return
      }

      // Show modal if social_media_completed is false or null
      const shouldShow = !data?.social_media_completed
      console.log('🎭 Should show modal:', shouldShow) // Debug log
      
      if (shouldShow) {
        setShowSocialMediaModal(true)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Exception checking social media status:', err)
      setIsLoading(false)
    }
  }

  if (isAdminLayout) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    )
  }
  else if (authLayout) {
    return (
      <>
        <LenisScroll />
        {children}
      </>
    )
  }
  else if (isAdminChat) {
    return (
      <>
        <LenisScroll />
        {children}
      </>
    )
  }

  return (
    <>
      <LenisScroll />
   
      <div className="min-h-screen background relative overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFE66D] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-[#c09afe] rounded-full opacity-20 blur-3xl"></div>

        {/* Star decorations */}
        <div className="absolute top-32 right-40 text-4xl">✦</div>
        <div className="absolute top-60 left-32 text-2xl rotate-12">★</div>
        <div className="absolute bottom-40 right-60 text-3xl">✦</div>

        <Navbar />
        <NoNetwork>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NoNetwork>
        <Footer />
        
        {/* Render modal OUTSIDE AuthProvider to avoid blocking */}
        {!isLoading && (
          <SocialMediaModal 
            open={showSocialMediaModal} 
            onOpenChange={setShowSocialMediaModal}
          />
        )}
      </div>
    </>
  )
}

export default AppLayout

"use client"

import React from "react"
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


function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAdminLayout =
    pathname?.startsWith("/admin") && pathname !== ("/admin/")

  const authLayout = pathname?.startsWith("/auth/")

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

  return (
    <>
      <LenisScroll />
      <div className="min-h-screen background  relative overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFE66D] rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-[#c09afe] rounded-full opacity-20 blur-3xl"></div>
      
      {/* Star decorations */}
      <div className="absolute top-32 right-40 text-4xl">✦</div>
      <div className="absolute top-60 left-32 text-2xl rotate-12">★</div>
      <div className="absolute bottom-40 right-60 text-3xl">✦</div>

        <Navbar />
        
        <AuthProvider>
          {children}
        </AuthProvider>
        <Footer/>
      </div>
    </>
  )
}

export default AppLayout

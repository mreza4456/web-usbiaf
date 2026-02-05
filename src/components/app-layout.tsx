"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Sidebar,
} from "@/components/ui/sidebar"
import Navbar from "./navbar"
import LenisScroll from "./lenis"
import { AuthProvider } from "./auth-provider"
import Footer from "./footer"
import UserChat from "./user-chat"

import NoNetwork from "./no-network"

import { supabase } from '@/config/supabase'
import SocialMediaModal from '@/components/social-media-form'
import { 
  Banknote, 
  ChevronRight, 
  LayoutDashboard, 
  LogOut, 
  Package, 
  Settings,
  User,
  MapPin,
  Heart,
  ShoppingBag,
  FileText,
  Bell,
  Lock,
  MessageCircle,
  Ticket,
  Gift
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAdminLayout =
    pathname?.startsWith("/admin") && pathname !== ("/admin/")

  const isUserLayout =
    pathname?.startsWith("/user") && pathname !== ("/user/")

  const isAdminChat =
    pathname?.startsWith("/admin/chat/") && pathname !== ("/admin/chat")

  const authLayout =
    pathname?.startsWith("/auth/") || pathname?.startsWith("/chat") ||
    /^\/4\d{2}(\/|$)/.test(pathname);

  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState({
    name: "loading...",
    email: "",
    avatar: ""
  })

  useEffect(() => {
    // Only check on non-auth pages
    if (!authLayout && !isAdminLayout && !isAdminChat) {
      checkSocialMediaStatus()
      loadUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [authLayout, isAdminLayout, isAdminChat])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserProfile({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          email: user.email || "",
          avatar: user.user_metadata?.avatar_url || ""
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const checkSocialMediaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('social_media_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking social media status:', error)
        setIsLoading(false)
        return
      }

      const shouldShow = !data || !data.social_media_completed

      if (shouldShow) {
        setShowSocialMediaModal(true)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Exception checking social media status:', err)
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }


  const userMenuItems = [
    {
      url: '/user/profile',
      name: 'Personal Information',
      icon: User,
    },
    {
      url: '/user/user-order',
      name: 'My Orders',
      icon: ShoppingBag,
    },
    {
      url: '/user/voucher',
      name: 'My Vouchers',
      icon: Ticket,
    },
    {
      url: '/user/milestone',
      name: 'Get New Vouchers',
      icon: Gift,
    },
    {
      url: '/chat',
      name: 'Chat Support',
      icon: MessageCircle,
    },
  ]

  if (isAdminLayout) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset >
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
  else if (isUserLayout) {
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
              <div className="container mx-auto px-4 mt-30 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User Sidebar */}
                  <aside className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                      {/* Profile Header */}
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                            <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                            <AvatarFallback className="bg-secondary text-white font-semibold">
                              {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500">Hello,</p>
                            <h3 className="font-semibold text-gray-900 truncate">{userProfile.name}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Menu */}
                      <nav className="p-3">
                        <div className="space-y-1">
                          {userMenuItems.map((item) => {
                            const isActive = pathname === item.url
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.url}
                                href={item.url}
                                className={`
                                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                                  transition-all duration-200 group
                                  ${isActive 
                                    ? 'bg-muted text-primary' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }
                                `}
                              >
                                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-600' : ''}`} />
                                <span className="flex-1">{item.name}</span>
                                {isActive && (
                                  <ChevronRight className="h-4 w-4 text-purple-600" />
                                )}
                              </Link>
                            )
                          })}
                        </div>

                        {/* Logout Button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-all duration-200 group"
                          >
                            <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </nav>

                      {/* Help Section */}
                      <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <MessageCircle className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                          <p className="text-xs text-gray-500">
                            Have questions or concerns regarding your account?
                          </p>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Main Content */}
                  <main className="flex-1 min-w-0">
                    <div className="rounded-2xl ">
                      {children}
                    </div>
                  </main>
                </div>
              </div>
            </AuthProvider>
          </NoNetwork>
          <Footer />
        </div>
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
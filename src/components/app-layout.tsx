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
// import LenisScroll from "./lenis"
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
  Gift,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)


  const isAdminLayout =
    pathname?.startsWith("/admin") && pathname !== ("/admin/")

  const isUserLayout =
    pathname?.startsWith("/user") && pathname !== ("/user/") || pathname.startsWith("/chat")

  const isAdminChat =
    pathname?.startsWith("/admin/chat/") && pathname !== ("/admin/chat")

  const authLayout =
    pathname?.startsWith("/auth/")  ||
    /^\/4\d{2}(\/|$)/.test(pathname);

      const isChatRoute = pathname?.startsWith("/chat")
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
      group: "Dashboard",
      items: [
        {
          url: '/user/profile',
          name: 'Overview',
          icon: '/icon/SVG/dashboardicon.svg',
        },
        {
          url: '/chat',
          name: 'Inbox',
          icon: '/icon/SVG/inboxicon.svg',
        },
        {
          url: '/user/user-order',
          name: 'Orders History',
          icon: '/icon/SVG/ordericon.svg',
        },
        {
          url: '/user/campaign',
          name: 'Campaign',
          icon: '/icon/SVG/crownicon.svg',
        },
        {
          url: '/user/mission',
          name: 'Missions',
          icon: '/icon/SVG/targeticon.svg',
        },
        {
          url: '/user/ticket',
          name: 'Ticket',
          icon: '/icon/SVG/ticketicon.svg',
        },
        {
          url: '/user/brand',
          name: 'Brand Identity',
          icon: '/icon/SVG/starsicon.svg',
        },
      ],
    },

    {
      group: "Account",
      items: [
        {
          url: '/user/setting',
          name: 'Setting',
          icon: '/icon/SVG/settingicon.svg',
        },
        {
          name: 'Logout',
          icon: '/icon/SVG/logouticon.svg',
          onClick: handleLogout,
        },
      ],
    },
  ];

  if (isAdminLayout) {
    return (
      <NoNetwork>
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
      </NoNetwork>
    )
  }
  else if (authLayout) {
    return (
      <>
        {/* <LenisScroll /> */}
        <NoNetwork>
          {children}
        </NoNetwork>
      </>
    )
  }
  else if (isUserLayout) {
    return (


      <>
        {/* <LenisScroll /> */}
      <div className="h-screen background relative overflow-hidden">
          <NoNetwork>
            <Navbar />
            <AuthProvider>
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              <aside
                className={`
            fixed top-0 left-0 h-screen w-72 lg:w-60 xl:w-70 z-50
            bg-white border-primary border-r-1
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
            overflow-y-auto
          `}
              >
                <div className="lg:hidden flex justify-end p-3">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Tutup menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              

                {/* Navigation Menu dengan grouping */}
                <nav className="p-3 pt-25">
                  {userMenuItems.map((group) => (
                    <div key={group.group} className="mb-4">
                      {/* Label group */}
                      <p className="px-4 pt-2 pb-5 text-lg font-bold tracking-wider text-primary">
                        {group.group}
                      </p>

                      <div className="space-y-2 pl-10">
                        {group.items.map((item) => {
                          const isActive = item.url ? pathname === item.url : false;

                          if (item.onClick) {
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={item.onClick}
                                className="
          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
          transition-all duration-200 group
          w-full text-left text-dark arial
          hover:bg-gray-50 hover:text-gray-900
        "
                              >
                                <Image
                                  src={item.icon}
                                  alt={item.name}
                                  width={16}
                                  height={16}
                                  className="transition-transform group-hover:scale-110 "
                                />

                                    <p className="flex-1 text-primary text-[17px]">{item.name}</p>

                              </button>
                            );
                          }

                          return (
                            <Link
                              key={item.url}
                              href={item.url!}
                              onClick={() => setSidebarOpen(false)}
                              className={`
        flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium
        transition-all duration-200 group
        ${isActive
                                  ? "bg-muted "
                                  : "text-dark  hover:bg-gray-50 hover:text-gray-900"
                                }
      `}
                            >
                              <Image
                                src={item.icon}
                                alt={item.name}
                                width={16}
                                height={16}
                                className={`
          transition-transform group-hover:scale-110
          ${isActive ? "opacity-100" : ""}
        `}
                              />

                              <p className="flex-1 text-primary text-[17px]">{item.name}</p>

                              {isActive && (
                                <ChevronRight className="h-4 w-4 text-primary" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

            
                </nav>

              </aside>

              <main
                className={`
                  h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]
                  pl-0 lg:pl-60 xl:pl-70 mt-20
                  ${isChatRoute ? "overflow-hidden" : "overflow-y-auto"}
                `}
              >
                <div className={`h-full ${isChatRoute ? "" : "container mx-auto"}`}>
                  <div className="h-full">
                    {children}
                  </div>
                </div>
              </main>

            </AuthProvider>
          </NoNetwork>
          <div className="lg:hidden fixed bottom-10 left-2 bg-muted text-white rounded-full text-primary flex justify-center w-10 h-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2"
              aria-label="Buka menu"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </>
    )
  }


  return (
    <>
      {/* <LenisScroll /> */}

      <div className="min-h-screen bg-board relative overflow-hidden">


        <NoNetwork>
          <Navbar />
          <AuthProvider>
            {children}
          </AuthProvider>

          <Footer />
        </NoNetwork>
      </div>

      {/* Render modal OUTSIDE AuthProvider to avoid blocking */}
      {!isLoading && (
        <SocialMediaModal
          open={showSocialMediaModal}
          onOpenChange={setShowSocialMediaModal}
        />
      )}

    </>
  )
}

export default AppLayout
"use client";

import * as React from "react"
import Link from "next/link"
import {
  Sparkles, User, LogOut, ChevronDown,
  Loader2, ArrowRight, Menu, X
} from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"

export default function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const isMobile = useIsMobile()
  const router = useRouter()

  /** 🔥 Zustand Auth (INSTAN) */
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setShowUserMenu(false)
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getDisplayName = () => {
    if (!user) return null
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
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

  const handleClick = () => {
    router.push("/order")
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Project" },
    { href: "/service", label: "Service" },
    { href: "/teams", label: "Teams" },
    { href: "/faqs", label: "FAQs" },
    { href: "/contact", label: "Contact" },
  ]

  return (
 
    <div>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'border-b-3 border-secondary shadow-lg bg-background ' : 'bg-transparent'}`}>
      <div className={`container mx-auto px-4 sm:px-6 py-4 `}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-bold text-primary ">
                Nemuneko <span className="text-secondary">Studio</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center  space-x-6 xl:space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-[#D78FEE] text-primary transition-colors text-sm xl:text-base"
                >
                  {link.label}
                </a>
              ))}
              
              {/* Auth Section Desktop */}
              {user ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all"
                    disabled={isLoggingOut}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-secondary text-sm font-medium max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-background border border-primary/20 rounded-lg shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#9B5DE0]/20">
                        <p className="text-sm font-medium text-primary">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link href="/myorder">
                          <button className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-white/5 transition-colors">
                            My Order
                          </button>
                        </Link>
                     
                      </div>
                      <div className="border-t border-[#9B5DE0]/20 py-2">
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-primary rounded-full text-sm">
                    Login
                  </Button>
                </Link>
              )}
              
              <Button 
                onClick={handleClick} 
                className="bg-background border border-primary border-3 rounded-full text-primary hover:text-white text-sm xl:text-base px-4 xl:px-5 cursor-pointer"
              >
                Order Now <ArrowRight className="ml-2 w-4 h-4 xl:w-5 xl:h-5" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-[#D78FEE] transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-[#9B5DE0]/20">
              <div className="flex flex-col space-y-4 mt-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="hover:text-[#D78FEE] text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}

                {/* Auth Section Mobile */}
                {user ? (
                  <div className="space-y-3 pt-4 border-t border-[#9B5DE0]/20">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <Link href="/dashboard">
                      <button 
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </button>
                    </Link>
                    <Link href="/profile">
                      <button 
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Profile
                      </button>
                    </Link>
                    <Link href="/settings">
                      <button 
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Settings
                      </button>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </div>
                ) : (
                  <Link href="/auth/login">
                    <Button 
                      className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] text-white hover:from-[#8B4DD0] hover:to-[#C77FDE]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Button>
                  </Link>
                )}

                <Button 
                  onClick={handleClick} 
                  className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white cursor-pointer"
                >
                  Order Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

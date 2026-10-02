"use client";
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Menu, X, ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"
import UserChat from "./user-chat";
import { NotificationBellButton } from "./notification-bell";
import {
  FaInstagram,
  FaDiscord,
  FaYoutube,
  FaTwitter,
  FaTiktok,
} from "react-icons/fa6"

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: "/", label: "Home" },
  // { href: "/projects", label: "Works" },
  { href: "/service", label: "Commisions" },
  { href: "/blog", label: "Blog" },
  { href: "/teams", label: "Teams" },
  { href: "/contact", label: "Contact" },
] as const

const USER_MENU_LINKS = [
  { href: "/user/user-order", label: "My requests", icon: "handicon.svg" },
  { href: "/user/user-order", label: "My order", icon: "boxicon.svg" },
  { href: "/chat", label: "Inbox messages", icon: "mailicon.svg" },
  { href: "/user/tickets", label: "My tickets", icon: "ticketicon.svg" },
] as const

const LOGIN_MENU_LINKS = [
  { href: "/blog", label: "Blog", icon: "bookicon.svg" },
  { href: "/blog", label: "F.A.Q", icon: "fawicon.svg" },
  { href: "/contact", label: "Contact Us", icon: "contacticon.svg" },

] as const

const USER_SUPPORT_LINKS = [
  { href: "/user/user-order", label: "Contact support", icon: "phoneicon.svg" },
  { href: "/user/user-order", label: "Settings", icon: "settingicon.svg" },
] as const

const FOOTER_LINKS = [
  { href: "#", label: "About Us" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Pricing" },
  { href: "#", label: "Refunds & Disputes" },
  { href: "#", label: "Trust & Safety" },
  { href: "#", label: "Privacy & Policy" },
] as const

const SOCIAL_LINKS = [
  { Icon: FaYoutube, label: "YouTube" },
  { Icon: FaDiscord, label: "Discord" },
  { Icon: FaInstagram, label: "Instagram" },
  { Icon: FaTwitter, label: "Twitter" },
  { Icon: FaTiktok, label: "TikTok" },
] as const

/* ------------------------------------------------------------------ */
/*  Small presentational components                                    */
/* ------------------------------------------------------------------ */

function IconLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className="block flex gap-3 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <Image alt="" src={`/icon/SVG/${icon}`} width={20} height={20} />
      {label}
    </Link>
  )
}

function FooterLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-1 items-center py-3">
      {FOOTER_LINKS.map((link) => (
        <Link key={link.label} href={link.href} className="text-[10px] text-fredoka text-secondary text-center">
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function SocialLinks() {
  return (
    <div className="flex justify-center gap-1 items-center px-15 pb-3">
      {SOCIAL_LINKS.map(({ Icon, label }) => (
        <Link key={label} href="#" aria-label={label} className="text-[10px] text-fredoka text-primary text-center mx-auto">
          <Icon className="h-4 w-4" />
        </Link>
      ))}
    </div>
  )
}

function PanelFooter() {
  return (
    <>
      <div className="border-t border-secondary w-[90%] mx-auto" />
      <FooterLinks />
      <SocialLinks />
      <p className="text-[10px] text-secondary text-center mb-2">© 2026 NemunekoStudio</p>
    </>
  )
}

function UserMenuPanel({
  displayName,
  avatarUrl,
  isLoggingOut,
  onNavigate,
  onLogout,
}: {
  displayName: string | null
  avatarUrl?: string | null
  isLoggingOut: boolean
  onNavigate: () => void
  onLogout: () => void
}) {
  return (
    <>
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        <div className="relative w-9 h-9 rounded-full overflow-hidden">
          <img
            src={avatarUrl || "/icon/SVG/usericon.svg"}
            className="w-full h-full object-cover"
            alt="avatar"
            onError={(e) => { (e.target as HTMLImageElement).src = "/icon/SVG/usericon.svg"; }}
          />
        </div>
        <p className="mt-3 text-primary uppercase text-lilita text-xl font-semibold">{displayName}</p>
        <Link
          href="/user/profile"
          onClick={onNavigate}
          className="mt-2 w-full flex items-center justify-center gap-2 border-2 bg-muted text-fredoka border-primary text-primary rounded-full py-1 text-md font-semibold hover:bg-[#D78FEE]/10 transition-colors"
        >
          Profile Dashboard
        </Link>
      </div>

      <div className="border-t border-secondary w-[90%] mx-auto" />
      <div className="py-2 text-lilita">
        {USER_MENU_LINKS.map((item) => (
          <IconLink key={item.label} {...item} onClick={onNavigate} />
        ))}
      </div>

      <div className="border-t border-secondary w-[90%] mx-auto" />
      <div className="py-2 text-lilita">
        {USER_SUPPORT_LINKS.map((item) => (
          <IconLink key={item.label} {...item} onClick={onNavigate} />
        ))}
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex gap-3 items-center px-5 py-2 text-left text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
        >
          <Image alt="" src="/icon/SVG/logouticon.svg" width={20} height={20} />
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>

      <PanelFooter />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Navbar(): React.ReactElement {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)

  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.loading)
  const pathname = usePathname();

  const closeAllMenus = React.useCallback(() => {
    setShowUserMenu(false)
    setIsMenuOpen(false)
    setIsLoginOpen(false)
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      closeAllMenus()
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const displayName = React.useMemo(() => {
    if (!user) return null;
    if (user.full_name) return user.full_name;
    return user.email?.split("@")[0] ?? null;
  }, [user])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const isMobileView = typeof window !== "undefined" && window.innerWidth < 640
      if (showUserMenu && !isMobileView && target && !target.closest(".user-menu-container")) setShowUserMenu(false)
      if (isLoginOpen && !isMobileView && target && !target.closest(".login-menu-container")) setIsLoginOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, isLoginOpen])

  const avatarUrl = user?.avatar_url;

  const openUserMenu = () => { setShowUserMenu(!showUserMenu); setIsMenuOpen(false) }
  const openLoginMenu = () => { setIsLoginOpen(!isLoginOpen); setIsMenuOpen(false); setShowUserMenu(false) }
  const openMobileMenu = () => { setIsMenuOpen(true); setShowUserMenu(false) }
  const closeMobileMenu = () => { setIsMenuOpen(false); setIsLoginOpen(false); setShowUserMenu(false) }

  return (
    <nav className="fixed top-0 w-full border-b border-primary z-50 transition-all duration-300 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="relative w-10 h-10 flex items-center justify-center -ml-2 lg:hidden">
              <button
                onClick={closeMobileMenu}
                className={`absolute p-2 text-primary hover:text-[#D78FEE] transition-all duration-300 ease-in-out
                  ${isMenuOpen || isLoginOpen || showUserMenu
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-50 pointer-events-none"
                  }`}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={openMobileMenu}
                className={`absolute p-2 text-primary hover:text-[#D78FEE] transition-all duration-300 ease-in-out
                  ${!isMenuOpen && !showUserMenu
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 rotate-90 scale-50 pointer-events-none"
                  }`}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div>
              <Link href="/" className="flex items-center space-x-2 group">
                <Image alt="logo" src="/images/logonav.webp" width={150} height={42} />
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-7">
              {NAV_LINKS.map((link) => (
                <div key={link.href}>
                  <Link href={link.href} className="text-lilita relative group text-lg flex items-center gap-1 text-primary">
                    {link.label}
                    <span
                      className={`absolute bottom-0.5 right-0 h-[4px] bg-[#B081FE] -rotate-2 clip-nav transition-all duration-300 ${pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                        }`}
                    />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <UserChat />

                <Link href="/cart" className="mx-1 transition-transform duration-200 hover:scale-110" onClick={() => setIsMenuOpen(false)}>
                  <Image src="/icon/SVG/carticon.svg" width={20} height={20} className="w-6 h-6 hover:scale-110 cursor-pointer transition-transform" alt="" />
                </Link>

                <NotificationBellButton />

                {/* User avatar menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={openUserMenu}
                    className="relative flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <img
                        src={avatarUrl || "/icon/SVG/usericon.svg"}
                        className="w-full h-full object-cover rounded-full"
                        alt="avatar"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/icon/SVG/usericon.svg"; }}
                      />
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="hidden sm:block absolute right-0 mt-2 w-72 bg-white card-campaign border-2 border-primary rounded-4xl shadow-lg overflow-hidden">
                      <UserMenuPanel
                        displayName={displayName}
                        avatarUrl={avatarUrl}
                        isLoggingOut={isLoggingOut}
                        onNavigate={() => setShowUserMenu(false)}
                        onLogout={handleLogout}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative login-menu-container">
                <div className="transition-transform duration-150 hover:scale-105 active:scale-95">
                  <div
                    onClick={openLoginMenu}
                    className="text-primary cursor-pointer hover:bg-transparent text-lilita text-primary "
                  >
                    Log In
                    {isLoginOpen ? (
                      <ChevronDown className="w-4 h-4 ml-1 inline-block rotate-180" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1 inline-block" />
                    )}
                  </div>
                </div>

                {/* Desktop login dialog */}
                {isLoginOpen && (
                  <div className="hidden sm:block absolute right-0 mt-2 w-80 bg-white card-campaign border-2 border-primary rounded-4xl shadow-lg overflow-hidden z-100">
                    <div className="flex flex-col  pt-6 pb-6 px-6">

                      <Link
                        href="/auth/login"
                        onClick={() => setIsLoginOpen(false)}
                        className=" w-full flex items-center justify-center gap-2 mb-3 bg-white hover:bg-muted text-fredoka border-3 border-primary text-primary rounded-full py-1 text-md font-semibold hover:opacity-90 transition-colors"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setIsLoginOpen(false)}
                        className=" w-full flex items-center justify-center gap-2 bg-white hover:bg-muted text-fredoka border-3 border-primary text-primary rounded-full py-1 text-md font-semibold hover:opacity-90 transition-colors"
                      >
                        Sign Up
                      </Link>
                      <div className="border-t border-secondary w-full my-3 mt-8"></div>
                      {LOGIN_MENU_LINKS.map((item) => (
                        <Link
                          href={item.href} key={item.label}
                          onClick={() => setIsLoginOpen(false)}
                          className="block flex gap-5 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"

                        >
                          <Image alt="" src={`/icon/SVG/${item.icon}`} width={20} height={20} />
                          {item.label}
                        </Link>
                      ))}
                      <div className="mt-5"></div>
                      <PanelFooter />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile full-screen user menu */}
      {showUserMenu && user && (
        <div className="sm:hidden fixed inset-0 border-t-2 border-primary top-20 z-[70] bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 pt-8">
            <UserMenuPanel
              displayName={displayName}
              avatarUrl={avatarUrl}
              isLoggingOut={isLoggingOut}
              onNavigate={() => setShowUserMenu(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Mobile nav-link menu */}
      {isMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-20 border-t border-primary text-lilita z-[60] bg-white">
          <div className="px-6 sm:px-10 py-8 space-y-6">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className="block text-xl font-bold text-lilita text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {!user && (
            <div className="px-6 sm:px-10 pt-4 border-t border-gray-100">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-[#D78FEE] text-[#D78FEE]">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
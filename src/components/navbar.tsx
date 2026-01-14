"use client";
import * as React from "react"
import Link from "next/link"
import { Sparkles, User, LogOut, ChevronDown, Loader2, ArrowRight, Menu, X, Ticket, Gift, Box } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"

interface Voucher {
  id: string;
  code: string;
  value: string;
  expired_at: string;
  is_used: boolean;
  milestone_order: number;
  created_at: string;
}

export default function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showVoucherMenu, setShowVoucherMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [vouchers, setVouchers] = React.useState<Voucher[]>([])
  const [isLoadingVouchers, setIsLoadingVouchers] = React.useState(false)

  const router = useRouter()

  /** 🔥 Zustand Auth (INSTAN) */
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch vouchers when user is logged in
  React.useEffect(() => {
    if (user?.id) {
      fetchVouchers()
    }
  }, [user?.id])

  const fetchVouchers = async () => {
    if (!user?.id) return

    setIsLoadingVouchers(true)
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching vouchers:", error)
      } else {
        setVouchers(data || [])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setIsLoadingVouchers(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setShowUserMenu(false)
      setShowVoucherMenu(false)
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
      if (showVoucherMenu && target && !target.closest(".voucher-menu-container")) {
        setShowVoucherMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, showVoucherMenu])

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
    { href: "/cart", label: "Order" },
  ]

  const availableVouchers = vouchers.filter(v => !v.is_used && new Date(v.expired_at) > new Date())
  const usedVouchers = vouchers.filter(v => v.is_used)
  const expiredVouchers = vouchers.filter(v => !v.is_used && new Date(v.expired_at) <= new Date())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Kode voucher berhasil disalin!')
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-background`}>
      <div className="max-w-8xl  sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary group-hover:text-[#D78FEE] transition-colors">
              Nemuneko Studio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-primary hover:text-[#D78FEE] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            {/* Auth Section Desktop */}
            {user ? (
              <div className="flex items-center space-x-3 ">
                {/* Voucher Button */}
                <div className="relative voucher-menu-container">
                  <button
                    onClick={() => {
                      setShowVoucherMenu(!showVoucherMenu)
                      setShowUserMenu(false)
                    }}
                    className="relative flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Ticket className="w-6 h-6 text-primary" />
                    {availableVouchers.length > 0 && (
                      <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {availableVouchers.length}
                      </span>
                    )}
                  </button>

                  {/* Voucher Dropdown */}
                  {showVoucherMenu && (
                    <div className="absolute right-0 mt-2 w-96 bg-background border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
                      <div className="p-4 bg-background">
                        <h3 className="text-primary font-bold flex items-center gap-2">
                          <Ticket className="w-5 h-5" />
                          My Vouchers
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingVouchers ? (
                          <div className="p-8 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
                          </div>
                        ) : vouchers.length === 0 ? (
                          <div className="p-8 text-center">
                            <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">
                              Belum ada voucher
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Selesaikan pesanan untuk mendapatkan voucher
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Available Vouchers */}
                            {availableVouchers.length > 0 && (
                              <div className="p-3">
                                <p className="text-xs text-gray-400 mb-2 font-semibold">TERSEDIA</p>
                                {availableVouchers.map((voucher) => (
                                  <div
                                    key={voucher.id}
                                    className="mb-2 p-3 bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/50 rounded-lg hover:border-green-600 transition-all cursor-pointer"
                                    onClick={() => copyToClipboard(voucher.code)}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-primary font-bold text-lg">{voucher.value} OFF</p>
                                        <p className="text-gray-400 text-xs">from {voucher.milestone_order}th orders</p>
                                      </div>
                                      <span className="bg-green-500 text-primary text-xs px-2 py-1 rounded">
                                        Aktif
                                      </span>
                                    </div>
                                    <div className="bg-gray-800/50  rounded border border-dashed border-gray-600 mb-2">
                                      <p className="text-primary font-mono text-sm text-center">{voucher.code}</p>
                                    </div>
                                    <p className="text-gray-400 text-xs">
                                      Berlaku hingga: {formatDate(voucher.expired_at)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Used Vouchers */}
                            {usedVouchers.length > 0 && (
                              <div className="p-3 border-t border-gray-800">
                                <p className="text-xs text-gray-400 mb-2 font-semibold">TELAH DIGUNAKAN</p>
                                {usedVouchers.map((voucher) => (
                                  <div
                                    key={voucher.id}
                                    className="mb-2 p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg opacity-60"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-gray-300 font-bold">{voucher.value} OFF</p>
                                        <p className="text-gray-500 text-xs">Milestone: {voucher.milestone_order} pesanan</p>
                                      </div>
                                      <span className="bg-gray-600 text-primary text-xs px-2 py-1 rounded">
                                        Terpakai
                                      </span>
                                    </div>
                                    <p className="text-gray-500 text-xs font-mono">{voucher.code}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Expired Vouchers */}
                            {expiredVouchers.length > 0 && (
                              <div className="p-3 border-t border-gray-800">
                                <p className="text-xs text-gray-400 mb-2 font-semibold">KADALUARSA</p>
                                {expiredVouchers.map((voucher) => (
                                  <div
                                    key={voucher.id}
                                    className="mb-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg opacity-60"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-gray-300 font-bold">{voucher.value} OFF</p>
                                        <p className="text-gray-500 text-xs">Milestone: {voucher.milestone_order} pesanan</p>
                                      </div>
                                      <span className="bg-red-600 text-primary text-xs px-2 py-1 rounded">
                                        Expired
                                      </span>
                                    </div>
                                    <p className="text-gray-500 text-xs">
                                      Expired: {formatDate(voucher.expired_at)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                     
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu)
                      setShowVoucherMenu(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                    disabled={isLoggingOut}
                  >
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-background border border-muted rounded-lg ">
                      <div className="p-4 border-b border-gray-800">
                        <p className="text-primary font-semibold">{displayName}</p>
                        <p className="text-secondary text-sm">{user.email}</p>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-3 py-2 text-primary  rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/myorder"
                          className="flex items-center space-x-2 px-3 py-2 text-primary  rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Box className="w-4 h-4" />
                          <span>My Order</span>
                        </Link>
                        <Link
                          href="/voucher"
                          className="flex items-center space-x-2 px-3 py-2 text-primary  rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Vouchers</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

               
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-primary hover:text-[#D78FEE]">
                    Login
                  </Button>
                </Link>
            
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-primary hover:text-[#D78FEE] transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-gray-800">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-primary hover:text-[#D78FEE] transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section Mobile */}
            {user ? (
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center space-x-3 pb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-primary font-semibold">{displayName}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/voucher"
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-[#D78FEE]/10 to-[#8B5CF6]/10 border border-[#D78FEE]/30 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span className="text-primary">My Voucher</span>
                  </div>
                  {availableVouchers.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {availableVouchers.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className="block text-primary hover:text-[#D78FEE] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/myorder"
                  className="block text-primary hover:text-[#D78FEE] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/voucher"
                  className="block text-primary hover:text-[#D78FEE] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Vouchers
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors py-2"
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
              <>
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-[#D78FEE] text-[#D78FEE]">
                    Login
                  </Button>
                </Link>
               
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
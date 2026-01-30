"use client";
import * as React from "react"
import Link from "next/link"
import { Sparkles, User, LogOut, ChevronDown, Loader2, Menu, X, Ticket, Gift, CheckCircle, Calendar, Tag, Bell } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"
import UserChat from "./user-chat";
import { getActiveVoucherEvents } from "@/action/voucher-events";
import { checkVoucherEventClaimed, claimVoucherEvent } from "@/action/vouchers";
import { IVoucherEvents } from "@/interface";
import { Card } from "./ui/card";

export default function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showVoucherMenu, setShowVoucherMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [voucherEvents, setVoucherEvents] = React.useState<IVoucherEvents[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = React.useState(true);
  const [claimedVouchers, setClaimedVouchers] = React.useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const router = useRouter()

  /** 🔥 Zustand Auth (INSTAN) */
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.loading)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (user?.id) {
      fetchVoucherEvents();
    }
  }, [user?.id]);

  const fetchVoucherEvents = async () => {
    setIsLoadingVouchers(true);
    try {
      const result = await getActiveVoucherEvents({ search: '' });
      if (result.success && result.data) {
        setVoucherEvents(result.data);

        // Check which vouchers user has already claimed
        if (user?.id) {
          const claimed = new Set<string>();
          for (const event of result.data) {
            const check = await checkVoucherEventClaimed(user.id, event.id);
            if (check.claimed) {
              claimed.add(event.id);
            }
          }
          setClaimedVouchers(claimed);
        }
      }
    } catch (error) {
      console.error('Error fetching voucher events:', error);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleClaimVoucher = async (voucherEventId: string) => {
    if (!user?.id) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setClaimingId(voucherEventId);
    try {
      const result = await claimVoucherEvent(user.id, voucherEventId);

      if (result.success) {
        alert(result.message);
        setClaimedVouchers(prev => new Set([...prev, voucherEventId]));
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengklaim voucher');
    } finally {
      setClaimingId(null);
    }
  };

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
    if (!user) return null;
    if (user.full_name) return user.full_name;
    return user.email?.split("@")[0];
  };
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
    { href: "/blog", label: "Blog" },
    { href: "/teams", label: "Teams" },
    { href: "/faqs", label: "FAQs" },
    { href: "/contact", label: "Contact" },
    { href: "/cart", label: "Order" },
  ]

  // Hitung voucher yang belum diklaim dan belum expired
  const availableVoucherEvents = voucherEvents.filter(
    event => !claimedVouchers.has(event.id) && new Date(event.expired_at) > new Date()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-background`}>
      <div className="max-w-8xl sm:px-6 lg:px-8">
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
              <div className="flex items-center space-x-3">
                <UserChat />

                {/* Voucher Notification Button */}
                <div className="relative voucher-menu-container">
                  <button
                    onClick={() => {
                      setShowVoucherMenu(!showVoucherMenu)
                      setShowUserMenu(false)
                    }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all"
                  >
                    <Bell className="w-6 h-6 text-primary" />
                    {availableVoucherEvents.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {availableVoucherEvents.length}
                      </span>
                    )}
                  </button>

                  {/* Voucher Notification Dropdown */}
                  {showVoucherMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow overflow-hidden">
                      <div className="p-3 bg-muted/50">
                        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notification
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto ">
                        {isLoadingVouchers ? (
                          <div className="p-6 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#D78FEE] animate-spin" />
                          </div>
                        ) : voucherEvents.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400 text-xs">
                              No Notification yet
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Stay tuned for special vouchers
                            </p>
                          </div>
                        ) : (
                          
                          <div className="">
                            <p className="text-center mt-3 text-gray-400 ">Congratulation You Get New Vouchers</p>
                            <div className="line h-[0.5px] bg-gray-300 w-[90%] mx-auto  mt-3"></div>
                            {voucherEvents.map((event) => {
                              const isClaimed = claimedVouchers.has(event.id);
                              const isClaiming = claimingId === event.id;
                              const isExpired = new Date(event.expired_at) < new Date();

                              return (
                                <Card
                                  key={event.id}
                                  className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors m-3 shadow border-0"
                                >
                                  {/* Header with discount */}
                                  <div className="grid grid-cols-4 items-center">
                                    <div className="flex items-start justify-between mb-2 col-span-3">
                                      <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-primary mb-1">
                                          {event.name}
                                        </h4>
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-xl font-bold text-[#D78FEE]">{event.value}</span>
                                          <span className="text-xs text-gray-400">OFF</span>
                                          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>s/d {formatDate(event.expired_at)}</span>
                                          </div>
                                        </div>
                                      </div>

                                    </div>
                                    <button
                                      onClick={() => handleClaimVoucher(event.id)}
                                      disabled={isClaimed || isClaiming || isExpired || !user}
                                      className={`w-full py-2 rounded-full text-xs font-semibold transition-all ${isClaimed
                                        ? 'bg-gray-200  cursor-not-allowed opacity-50'
                                        : isExpired
                                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                                          : 'bg-primary text-white hover:opacity-90 cursor-pointer'
                                        }`}
                                    >

                                      {isClaiming ? (
                                        <span className="flex items-center justify-center ">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          Mengklaim...
                                        </span>
                                      ) : isClaimed ? (
                                        'Claimed'
                                      ) : isExpired ? (
                                        'Over'
                                      ) : !user ? (
                                        'Login'
                                      ) : (
                                        'Claim'
                                      )}
                                    </button>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer - Link to voucher page */}
                      {voucherEvents.length > 0 && (
                        <Link
                          href="/voucher"
                          onClick={() => setShowVoucherMenu(false)}
                          className="block p-3 text-center text-xs text-[#D78FEE] hover:bg-white/5  transition-colors"
                        >
                          View All Vouchers
                        </Link>
                      )}
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
                    <div className="absolute right-0 mt-2 w-64 bg-background border border-muted rounded-lg">
                      <div className="p-4 border-b border-gray-800">
                        <p className="text-primary font-semibold">{displayName}</p>
                        <p className="text-secondary text-sm">{user.email}</p>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-3 py-2 text-primary rounded-lg transition-colors hover:bg-white/10"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/myorder"
                          className="flex items-center space-x-2 px-3 py-2 text-primary rounded-lg transition-colors hover:bg-white/10"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Ticket className="w-4 h-4" />
                          <span>My Order</span>
                        </Link>
                        <Link
                          href="/voucher"
                          className="flex items-center space-x-2 px-3 py-2 text-primary rounded-lg transition-colors hover:bg-white/10"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Gift className="w-4 h-4" />
                          <span>My Vouchers</span>
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
                    <Bell className="w-5 h-5 text-primary" />
                    <span className="text-primary">Notifikasi Voucher</span>
                  </div>
                  {availableVoucherEvents.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {availableVoucherEvents.length}
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
                  My Vouchers
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
"use client";
import * as React from "react"
import Link from "next/link"
import { Sparkles, User, LogOut, ChevronDown, Loader2, Menu, X, Ticket, Gift, CheckCircle, Calendar, Tag, Bell, ShoppingBag, FileText } from "lucide-react"
import { Button } from "./ui/button"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/config/supabase"
import { useAuthStore } from "@/store/auth"
import UserChat from "./user-chat";
import { getActiveVoucherEvents } from "@/action/voucher-events";
import { checkVoucherEventClaimed, claimVoucherEvent } from "@/action/vouchers";
import { IVoucherEvents } from "@/interface";
import { Card } from "./ui/card";
import Image from "next/image";
import {
  FaInstagram,
  FaDiscord,
  FaYoutube,
  FaTwitter,
  FaTiktok,
} from "react-icons/fa6"

export default function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showVoucherMenu, setShowVoucherMenu] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [voucherEvents, setVoucherEvents] = React.useState<IVoucherEvents[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = React.useState(true);
  const [claimedVouchers, setClaimedVouchers] = React.useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const router = useRouter()

  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.loading)
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (user?.id) fetchVoucherEvents();
  }, [user?.id]);

  const fetchVoucherEvents = async () => {
    setIsLoadingVouchers(true);
    try {
      const result = await getActiveVoucherEvents({ search: '' });
      if (result.success && result.data) {
        setVoucherEvents(result.data);
        if (user?.id) {
          const claimed = new Set<string>();
          for (const event of result.data) {
            const check = await checkVoucherEventClaimed(user.id, event.id);
            if (check.claimed) claimed.add(event.id);
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
    if (!user?.id) { alert('Silakan login terlebih dahulu'); return; }
    setClaimingId(voucherEventId);
    try {
      const result = await claimVoucherEvent(user.id, voucherEventId);
      if (result.success) {
        alert(result.message);
        setClaimedVouchers(prev => new Set([...prev, voucherEventId]));
      } else {
        alert(result.message);
      }
    } catch {
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
      setIsMenuOpen(false)
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
      const isMobileView = typeof window !== "undefined" && window.innerWidth < 640
      if (showUserMenu && !isMobileView && target && !target.closest(".user-menu-container")) setShowUserMenu(false)
      if (showVoucherMenu && target && !target.closest(".voucher-menu-container")) setShowVoucherMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, showVoucherMenu])

  const navLinks = [
    { href: "/", label: "Home" },
    // { href: "/projects", label: "Works" },
    { href: "/service", label: "Commisions" },
    { href: "/blog", label: "Blog" },
    { href: "/teams", label: "Teams" },
    { href: "/contact", label: "Contact" },
  ]

  const availableVoucherEvents = voucherEvents.filter(
    event => !claimedVouchers.has(event.id) && new Date(event.expired_at) > new Date()
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const avatarUrl = user?.avatar_url;
  return (
    <nav
      className={`fixed top-0 w-full  border-b  border-primary  z-55 transition-all duration-300 bg-white`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4  lg:space-x-8">
            <div className="relative w-10 h-10 flex items-center justify-center -ml-2 lg:hidden">
              {/* Tombol Close (X) */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowUserMenu(false);
                }}
                className={`absolute p-2 text-primary hover:text-[#D78FEE] transition-all duration-300 ease-in-out
      ${isMenuOpen || showUserMenu
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-50 pointer-events-none"
                  }`}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Tombol Open (Menu) */}
              <button
                onClick={() => {
                  setIsMenuOpen(true);
                  setShowUserMenu(false);
                }}
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
              <Link href="/" className="flex items-center  space-x-2 group">
                <Image alt="logo" src="/images/logonav.webp" width={150} height={42} />
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-7 ">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-lilita relative group text-lg flex items-center gap-1 text-primary`}
                  >
                    {link.label}

                    <span
                      className={`absolute -bottom-0.5 left-0 h-[5px] bg-[#B081FE] clip-nav transition-all duration-300 ${pathname === link.href ? "w-full " : "w-0 group-hover:w-full"
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

                <Link href={"/cart"} className="mx-1 transition-transform duration-200 hover:scale-110 " onClick={() => setIsMenuOpen(false)}>

                  <Image src="/icon/SVG/carticon.svg" width={20} height={20} className="w-6 h-6 hover:scale-110 cursor-pointer transition-transform" alt="" />
                </Link>

                <div className="relative voucher-menu-container">
                  <button
                    onClick={() => { setShowVoucherMenu(!showVoucherMenu); setShowUserMenu(false); }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all"
                  >

                    <Image src="/icon/SVG/bellicon.svg" width={20} height={20} className="w-6 h-6 hover:scale-110 cursor-pointer transition-transform" alt="" />
                    {availableVoucherEvents.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse"
                      >
                        {availableVoucherEvents.length}
                      </span>
                    )}
                  </button>

                  {showVoucherMenu && (
                    <div
                      className="absolute right-0 mt-2 w-80 z-100 bg-white card-campaign border-2 border-primary rounded-4xl shadow overflow-hidden"
                    >
                      <div className="p-3 bg-muted/50">
                        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notification
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingVouchers ? (
                          <div className="p-6 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#D78FEE] animate-spin" />
                          </div>
                        ) : voucherEvents.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400 text-xs">No Notification yet</p>
                            <p className="text-gray-500 text-xs mt-1">Stay tuned for special vouchers</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-center mt-3 text-gray-400">Congratulation You Get New Vouchers</p>
                            <div className="line h-[0.5px] bg-gray-300 w-[90%] mx-auto mt-3" />
                            {voucherEvents.map((event) => {
                              const isClaimed = claimedVouchers.has(event.id);
                              const isClaiming = claimingId === event.id;
                              const isExpired = new Date(event.expired_at) < new Date();
                              return (
                                <div key={event.id}>
                                  <Card className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors m-3 shadow border-0">
                                    <div className="grid grid-cols-4 items-center">
                                      <div className="flex items-start justify-between mb-2 col-span-3">
                                        <div className="flex-1">
                                          <h4 className="text-sm font-semibold text-primary mb-1">{event.name}</h4>
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
                                        className={`w-full py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${!isClaimed && !isExpired ? "hover:scale-105" : ""} ${isClaimed
                                          ? 'bg-gray-200 cursor-not-allowed opacity-50'
                                          : isExpired
                                            ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                                            : 'bg-primary text-white hover:opacity-90 cursor-pointer'
                                          }`}
                                      >
                                        {isClaiming ? (
                                          <span className="flex items-center justify-center">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Mengklaim...
                                          </span>
                                        ) : isClaimed ? 'Claimed' : isExpired ? 'Over' : !user ? 'Login' : 'Claim'}
                                      </button>
                                    </div>
                                  </Card>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {voucherEvents.length > 0 && (
                        <Link
                          href="/user/voucher"
                          onClick={() => setShowVoucherMenu(false)}
                          className="block p-3 text-center text-xs text-[#D78FEE] hover:bg-white/5 transition-colors"
                        >
                          View All Vouchers
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative user-menu-container">
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowVoucherMenu(false); setIsMenuOpen(false) }}
                    className="relative flex items-center justify-center w-7 h-7 rounded-full  border border-gray-200 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <img
                        src={avatarUrl || "/icon/SVG/usericon.svg"}
                        className="w-full h-full object-cover rounded-full "
                        alt="avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icon/SVG/usericon.svg";
                        }}
                      />
                    )}
                  </button>

                  {showUserMenu && (
                    <div
                      className="hidden sm:block absolute right-0 mt-2 w-72 bg-white card-campaign border-2 border-primary rounded-4xl shadow-lg overflow-hidden"
                    >
                      <div className="flex flex-col items-center pt-6 pb-4 px-4">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden">
                          <img
                            src={avatarUrl || "/icon/SVG/usericon.svg"}
                            className="w-full h-full object-cover"
                            alt="avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/icon/SVG/usericon.svg";
                            }}
                          />
                        </div>
                        <p className="mt-3 text-primary uppercase text-lilita text-xl font-semibold">{displayName}</p>
                        <Link
                          href="/user/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="mt-2 w-full flex items-center justify-center gap-2 border-2 bg-muted text-fredoka border-primary text-primary rounded-full py-1 text-md font-semibold hover:bg-[#D78FEE]/10 transition-colors"
                        >

                          Profile Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-secondary w-[90%] mx-auto " />
                      <div className="py-2 text-lilita">
                        {[
                          { href: "/user/user-order", label: "My requests", icon: "handicon.svg" },
                          { href: "/user/user-order", label: "My order", icon: "boxicon.svg" },
                          { href: "/chat", label: "Inbox messages", icon: "mailicon.svg" },
                          { href: "/user/tickets", label: "My tickets", icon: "ticketicon.svg" },
                          // { href: "/user/profile", label: "Profile" },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block flex gap-3 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Image alt="" src={`/icon/SVG/${item.icon}`} className='' width={20} height={20} />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-secondary w-[90%] mx-auto " />
                      <div className="py-2 text-lilita">
                        {[
                          { href: "/user/user-order", label: "Contact support", icon: "phoneicon.svg" },
                          { href: "/user/user-order", label: "Settings", icon: "settingicon.svg" },

                          // { href: "/user/profile", label: "Profile" },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block flex gap-3 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Image alt="" src={`/icon/SVG/${item.icon}`} className='' width={20} height={20} />
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex gap-3 items-center  px-5 py-2 text-left text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                        >
                          <Image alt="" src={`/icon/SVG/logouticon.svg`} className='' width={20} height={20} /> {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </button>
                      </div>
                      <div className="border-t border-secondary w-[90%] mx-auto " />
                      <div className="flex flex-wrap justify-center gap-1 items-center py-3">
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          About Us
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          Terms of Service
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          Pricing
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          Refunds & Disputes
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          Trust & Safety
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                          Privacy & Policy
                        </Link>
                      </div>
                      <div className="flex justify-center gap-1 items-center px-15 pb-3">
                        <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                          <FaYoutube className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                          <FaDiscord className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                          <FaInstagram className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                          <FaTwitter className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                          <FaTiktok className="h-4 w-4" />
                        </Link>
                      </div>
                      <p className="text-[10px] text-secondary text-center mb-2">
                        © 2026 NemunekoStudio
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/auth/login">
                <div className="transition-transform duration-150 hover:scale-105 active:scale-95">
                  <Button variant="ghost" className="text-primary cursor-pointer hover:bg-transparent  arial font-medium  hover:text-[#D78FEE]">
                    Login
                  </Button>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {showUserMenu && user && (
        <div
          className="sm:hidden fixed inset-0 border-t-2 border-primary   top-20 z-[70] bg-white flex flex-col"
        >


          <div className="flex-1 overflow-y-auto px-6 pt-8">
            <div
              className=""
            >
              <div className="flex flex-col items-center pt-6 pb-4 px-4">
                <div className="relative w-9 h-9 rounded-full overflow-hidden">
                  <img
                    src={avatarUrl || "/icon/SVG/usericon.svg"}
                    className="w-full h-full object-cover"
                    alt="avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon/SVG/usericon.svg";
                    }}
                  />
                </div>
                <p className="mt-3 text-primary uppercase text-lilita text-xl font-semibold">{displayName}</p>
                <Link
                  href="/user/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="mt-2 w-full flex items-center justify-center gap-2 border-2 bg-muted text-fredoka border-primary text-primary rounded-full py-1 text-md font-semibold hover:bg-[#D78FEE]/10 transition-colors"
                >

                  Profile Dashboard
                </Link>
              </div>
              <div className="border-t border-secondary w-[90%] mx-auto " />
              <div className="py-2 text-lilita">
                {[
                  { href: "/user/user-order", label: "My requests", icon: "handicon.svg" },
                  { href: "/user/user-order", label: "My order", icon: "boxicon.svg" },
                  { href: "/chat", label: "Inbox messages", icon: "mailicon.svg" },
                  { href: "/user/tickets", label: "My tickets", icon: "ticketicon.svg" },
                  // { href: "/user/profile", label: "Profile" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block flex gap-3 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Image alt="" src={`/icon/SVG/${item.icon}`} className='' width={20} height={20} />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-secondary w-[90%] mx-auto " />
              <div className="py-2 text-lilita">
                {[
                  { href: "/user/user-order", label: "Contact support", icon: "phoneicon.svg" },
                  { href: "/user/user-order", label: "Settings", icon: "settingicon.svg" },

                  // { href: "/user/profile", label: "Profile" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block flex gap-3 px-5 py-2 text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Image alt="" src={`/icon/SVG/${item.icon}`} className='' width={20} height={20} />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex gap-3 items-center  px-5 py-2 text-left text-primary text-fredoka font-medium hover:bg-gray-50 transition-colors"
                >
                  <Image alt="" src={`/icon/SVG/logouticon.svg`} className='' width={20} height={20} /> {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </button>
              </div>
              <div className="border-t border-secondary w-[90%] mx-auto " />
              <div className="flex flex-wrap justify-center gap-1 items-center py-3">
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  About Us
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  Terms of Service
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  Pricing
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  Refunds & Disputes
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  Trust & Safety
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-secondary text-center ">
                  Privacy & Policy
                </Link>
              </div>
              <div className="flex justify-center gap-1 items-center px-15 pb-3">
                <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                  <FaYoutube className="h-4 w-4" />
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                  <FaDiscord className="h-4 w-4" />
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                  <FaInstagram className="h-4 w-4" />
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                  <FaTwitter className="h-4 w-4" />
                </Link>
                <Link href="#" className="text-[10px] text-fredoka text-primary text-center mx-auto ">
                  <FaTiktok className="h-4 w-4" />
                </Link>
              </div>
              <p className="text-[10px] text-secondary text-center mb-2">
                © 2026 NemunekoStudio
              </p>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div
          className={`xl:hidden fixed inset-0  top-20 border-t border-primary text-lilita z-[60] bg-white`}
        >


          <div className="px-6 sm:px-10  py-8 space-y-6">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className={`block text-xl font-bold text-lilita ${pathname === link.href ? "text-primary" : "text-primary"}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </div>
            ))}


          </div>

          {!user && (
            <div className="px-6 sm:px-10 pt-4 border-t border-gray-100">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
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
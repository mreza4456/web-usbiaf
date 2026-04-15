"use client";
import * as React from "react"
import Link from "next/link"
import { Sparkles, User, LogOut, ChevronDown, Loader2, Menu, X, Ticket, Gift, CheckCircle, Calendar, Tag, Bell, ShoppingBag } from "lucide-react"
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
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Animation Variants ────────────────────────────────────────────────────────

const navbarVariants: Variants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const logoVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.2 },
  },
};

const navLinkContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const navLinkVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const authVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.5 },
  },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const mobileNavLinkVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut", delay: i * 0.05 },
  }),
};

const badgePulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

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

  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.loading)
  const pathname = usePathname();

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
      if (showUserMenu && target && !target.closest(".user-menu-container")) setShowUserMenu(false)
      if (showVoucherMenu && target && !target.closest(".voucher-menu-container")) setShowVoucherMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, showVoucherMenu])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Works" },
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

  return (
    <motion.nav
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white`}
    >
      <div className="max-w-8xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <motion.div variants={logoVariants} initial="hidden" animate="visible">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image alt="logo" src="/images/logonav.png" width={180} height={50} />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            className="hidden lg:flex items-center space-x-8"
            variants={navLinkContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {navLinks.map((link) => (
              <motion.div key={link.href} variants={navLinkVariants}>
                <Link
                  href={link.href}
                  className={`arial-nav font-medium relative group ${
                    pathname === link.href ? "text-[#F6CEFF]" : "text-white"
                  }`}
                >
                  {link.label}
                  {/* Animated underline on hover */}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#F6CEFF] rounded-full transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
            <motion.div variants={navLinkVariants}>
              <Link
                className="button-yellow px-4 py-1 transition-transform duration-200 hover:scale-105 active:scale-95"
                href={"/service"}
              >
                Order Now
              </Link>
            </motion.div>
          </motion.div>

          {/* Auth Section Desktop */}
          <motion.div variants={authVariants} initial="hidden" animate="visible">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <UserChat />

                {/* Cart */}
                <Link href={"/cart"} className="mx-2 transition-transform duration-200 hover:scale-110">
                  <img className="w-6 h-6" src="icon/carticon.svg" alt="" />
                </Link>

                {/* Voucher Bell */}
                <div className="relative voucher-menu-container">
                  <button
                    onClick={() => { setShowVoucherMenu(!showVoucherMenu); setShowUserMenu(false); }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all"
                  >
                    <img src="icon/bellicon.svg" className="w-6 h-6 hover:scale-110 transition-transform" alt="" />
                    <AnimatePresence>
                      {availableVoucherEvents.length > 0 && (
                        <motion.span
                          key="badge"
                          variants={badgePulse}
                          initial="initial"
                          animate="animate"
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                        >
                          {availableVoucherEvents.length}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Voucher Dropdown */}
                  <AnimatePresence>
                    {showVoucherMenu && (
                      <motion.div
                        key="voucher-dropdown"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow overflow-hidden"
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
                              {voucherEvents.map((event, i) => {
                                const isClaimed = claimedVouchers.has(event.id);
                                const isClaiming = claimingId === event.id;
                                const isExpired = new Date(event.expired_at) < new Date();
                                return (
                                  <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                  >
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
                                        <motion.button
                                          whileTap={{ scale: 0.92 }}
                                          whileHover={!isClaimed && !isExpired ? { scale: 1.05 } : {}}
                                          onClick={() => handleClaimVoucher(event.id)}
                                          disabled={isClaimed || isClaiming || isExpired || !user}
                                          className={`w-full py-2 rounded-full text-xs font-semibold transition-all ${
                                            isClaimed
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
                                        </motion.button>
                                      </div>
                                    </Card>
                                  </motion.div>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative user-menu-container hidden sm:block">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowVoucherMenu(false); }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                    disabled={isLoggingOut}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <img src="icon/usericon.svg" className="w-5 h-5" alt="" />
                      )}
                    </div>
                    <img src="icon/3stripesicon.svg" className="w-10 h-10" alt="" />
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        key="user-dropdown"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-64 bg-background border border-muted rounded-lg"
                      >
                        <div className="p-4 border-b border-gray-800">
                          <p className="text-primary font-semibold">{displayName}</p>
                          <p className="text-secondary text-sm">{user.email}</p>
                        </div>
                        <div className="p-2">
                          {[
                            { href: "/user/profile", icon: <User className="w-4 h-4" />, label: "Profile" },
                            { href: "/user/user-order", icon: <ShoppingBag className="w-4 h-4" />, label: "My Order" },
                          ].map((item, i) => (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 + 0.05 }}
                            >
                              <Link
                                href={item.href}
                                className="flex items-center space-x-2 px-3 py-2 text-primary rounded-lg transition-colors hover:bg-white/10"
                                onClick={() => setShowUserMenu(false)}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </Link>
                            </motion.div>
                          ))}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.17 }}
                          >
                            <button
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="text-primary hover:text-[#D78FEE]">
                    Login
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-primary hover:text-[#D78FEE] transition-colors"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden border-t border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link, i) => (
                <motion.div key={link.href} custom={i} variants={mobileNavLinkVariants} initial="hidden" animate="visible">
                  <Link
                    href={link.href}
                    className="block text-primary arial font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {user ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="pt-4 border-t border-gray-800 space-y-3"
                >
                  <div className="flex items-center space-x-3 pb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-primary text-font-arial font-semibold">{displayName}</p>
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
                      <span className="text-font-arial text-primary">Voucher</span>
                    </div>
                    {availableVoucherEvents.length > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold"
                      >
                        {availableVoucherEvents.length}
                      </motion.span>
                    )}
                  </Link>

                  {["Profile", "My Orders", "Cart"].map((label, i) => {
                    const hrefs: Record<string, string> = { Profile: "/user/profile", "My Orders": "/user/user-order", Cart: "/cart" };
                    return (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.06 }}
                      >
                        <Link
                          href={hrefs[label]}
                          className="block arial hover:text-[#D78FEE] transition-colors py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      </motion.div>
                    );
                  })}

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.58 }}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors py-2"
                  >
                    {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-[#D78FEE] text-[#D78FEE]">
                      Login
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
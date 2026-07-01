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
import { motion, AnimatePresence, Variants } from "framer-motion";

const navbarVariants: Variants = {
  hidden: { y: -80, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const logoVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } },
};

const navLinkContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const navLinkVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const authVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.5 } },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: "easeIn" } },
};

const overlayMenuVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const overlayLinkVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut", delay: i * 0.05 } }),
};

const badgePulse: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.2, 1], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 } },
};

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

  const avatarUrl = user?.avatar_url;
  return (
    <motion.nav
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white`}
    >
      <div className="max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(true)}
              className="xl:hidden p-2 -ml-2 text-primary hover:text-[#D78FEE] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </motion.button>

            <motion.div variants={logoVariants} initial="hidden" animate="visible">
              <Link href="/" className="flex items-center space-x-2 group">
                <Image alt="logo" src="/images/logonav.png" width={150} height={42} />
              </Link>
            </motion.div>

            <motion.div
              className="hidden xl:flex items-center space-x-7"
              variants={navLinkContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={navLinkVariants}>
                  <Link
                    href={link.href}
                    className={`arial font-medium relative group flex items-center gap-1 ${pathname === link.href ? "text-[#D78FEE]" : "text-primary"}`}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#F6CEFF] rounded-full transition-all duration-300 group-hover:w-full" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={authVariants} initial="hidden" animate="visible" className="flex items-center">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/service"
                  className="hidden xl:flex items-center gap-2 button-yellow px-5 transition-colors"
                >
                  Order Now
                </Link>

                <UserChat />

                <Link href={"/cart"} className="mx-1 transition-transform duration-200 hover:scale-110">
                  <img className="w-6 h-6" src="/icon/carticon.svg" alt="" />
                </Link>

                <div className="relative voucher-menu-container">
                  <button
                    onClick={() => { setShowVoucherMenu(!showVoucherMenu); setShowUserMenu(false); }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all"
                  >
                    <img src="/icon/bellicon.svg" className="w-6 h-6 hover:scale-110 transition-transform" alt="" />
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
                                          className={`w-full py-2 rounded-full text-xs font-semibold transition-all ${isClaimed
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

                <div className="relative user-menu-container">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowVoucherMenu(false); }}
                    className="relative flex items-center justify-center w-9 h-9 rounded-full  border border-gray-200"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <img
                        src={avatarUrl || "/icon/usericon.svg"}
                        className="w-full h-full object-cover rounded-full "
                        alt="avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icon/usericon.svg";
                        }}
                      />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        key="user-dropdown-compact"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="hidden sm:block absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                      >
                        <div className="flex flex-col items-center pt-6 pb-4 px-4">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                            <img
                              src={avatarUrl || "/icon/usericon.svg"}
                              className="w-full h-full object-cover"
                              alt="avatar"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/icon/usericon.svg";
                              }}
                            />
                          </div>
                          <p className="mt-3 text-primary font-semibold">{displayName}</p>
                          <Link
                            href="/service"
                            onClick={() => setShowUserMenu(false)}
                            className="mt-4 w-full flex items-center justify-center gap-2 border border-[#D78FEE] text-[#D78FEE] rounded-full py-2 text-sm font-medium hover:bg-[#D78FEE]/10 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Order Now
                          </Link>
                        </div>
                        <div className="border-t border-gray-100" />
                        <div className="py-2">
                          {[
                            { href: "/user/user-order", label: "My Order" },
                            { href: "/user/profile", label: "Profile" },
                          ].map((item, i) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="block px-5 py-2.5 text-primary hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-100" />
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex items-center px-5 py-3 text-left text-primary hover:bg-gray-50 transition-colors"
                        >
                          {isLoggingOut ? 'Logging out...' : 'Sign Out'}
                        </button>
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
        </div>
      </div>

      <AnimatePresence>
        {showUserMenu && user && (
          <motion.div
            key="user-dropdown-mobile"
            variants={overlayMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="sm:hidden fixed inset-0 z-[70] bg-white flex flex-col"
          >
            <div className="flex items-center justify-between h-20 px-4 border-b border-gray-100">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-primary"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Image alt="logo" src="/images/logonav.png" width={130} height={36} />
              <div className="flex items-center space-x-3">
                <UserChat />
                <img src="/icon/bellicon.svg" className="w-5 h-5" alt="" />
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#D78FEE]"
                  aria-label="Close profile menu"
                >
                  <img
                    src={avatarUrl || "/icon/usericon.svg"}
                    className="w-full h-full object-cover"
                    alt="avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon/usericon.svg";
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-8">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-200">
                  <img
                    src={avatarUrl || "/icon/usericon.svg"}
                    className="w-full h-full object-cover"
                    alt="avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon/usericon.svg";
                    }}
                  />
                </div>
                <p className="mt-4 text-lg text-primary font-semibold">{displayName}</p>

                <Link
                  href="/service"
                  onClick={() => setShowUserMenu(false)}
                  className="mt-5 flex items-center gap-2 border border-gray-300 rounded-full px-5 py-2.5 text-sm font-medium text-primary hover:border-[#D78FEE] hover:text-[#D78FEE] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Order Now
                </Link>
              </div>

              <div className="mt-10 space-y-1">
                <Link
                  href="/user/user-order"
                  className="block py-3 text-primary text-base"
                  onClick={() => setShowUserMenu(false)}
                >
                  My Order
                </Link>
                <Link
                  href="/user/profile"
                  className="block py-3 text-primary text-base"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>
              </div>

              <div className="border-t border-gray-200 mt-2" />

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left py-4 text-primary text-base flex items-center gap-2"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoggingOut ? 'Logging out...' : 'Sign Out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="overlay-menu"
            variants={overlayMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="xl:hidden fixed inset-0 z-[60] bg-white"
          >
            <div className="flex items-center justify-between h-20 px-4 border-b border-gray-100">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -ml-2 text-primary hover:text-[#D78FEE] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </motion.button>

              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <Image alt="logo" src="/images/logonav.png" width={130} height={36} />
              </Link>

              <div className="flex items-center space-x-3">
                {user && <UserChat />}
                <img src="/icon/bellicon.svg" className="w-5 h-5" alt="" />
                {user ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={avatarUrl || "/icon/usericon.svg"}
                      className="w-full h-full object-cover"
                      alt="avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/icon/usericon.svg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8" />
                )}
              </div>
            </div>

            <div className="px-6 sm:px-10 py-8 space-y-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  custom={i}
                  variants={overlayLinkVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link
                    href={link.href}
                    className={`block text-lg font-bold arial ${pathname === link.href ? "text-[#D78FEE]" : "text-primary"}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                custom={navLinks.length}
                variants={overlayLinkVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href="/service"
                  className=" text-lg font-bold button-yellow px-5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Order Now
                </Link>
              </motion.div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
"use client";

import * as React from "react";
import Link from "next/link";

import {
  Bell,
  Megaphone,
  Target,
  CheckCircle2,
  Package,
  Sparkles,
  Gift,
  Trophy,
  Ticket,
  Loader2,
  Inbox,
} from "lucide-react";
import {
  getNotifications,
  type INotification,
  type NotifType,
} from "@/action/notifications"; // ganti path sesuai lokasi server action-mu

// ─── Konfigurasi ────────────────────────────────────────────────────────────

/** Polling interval (ms). Ganti ke Supabase realtime kalau mau instant. */
const POLL_INTERVAL = 60_000;

/** localStorage key untuk simpan waktu terakhir dropdown dibuka user */
const LAST_SEEN_KEY = "nemuneko_notif_last_seen";

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  CAMPAIGN: Megaphone,
  MISSION_PROGRESS: Target,
  MISSION_COMPLETED: CheckCircle2,
  ORDER_STATUS: Package,
  NEW_SERVICE: Sparkles,
  REWARD_MISSION: Gift,
  REWARD_MILESTONE: Trophy,
  VOUCHER_EVENT: Ticket,
};

const TYPE_COLOR: Record<NotifType, string> = {
  CAMPAIGN: "bg-[#F3E8FF] text-[#9333EA]",
  MISSION_PROGRESS: "bg-[#E0F2FE] text-[#0284C7]",
  MISSION_COMPLETED: "bg-[#DCFCE7] text-[#16A34A]",
  ORDER_STATUS: "bg-[#FEF3C7] text-[#D97706]",
  NEW_SERVICE: "bg-[#FCE7F3] text-[#DB2777]",
  REWARD_MISSION: "bg-[#FFEDD5] text-[#EA580C]",
  REWARD_MILESTONE: "bg-[#FEF9C3] text-[#CA8A04]",
  VOUCHER_EVENT: "bg-[#E0E7FF] text-[#4F46E5]",
};

// ─── Helper waktu relatif (Bahasa Indonesia) ────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} hari lalu`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week} minggu lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// ─── Komponen utama ─────────────────────────────────────────────────────────

export function NotificationBellButton(): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.total_unread);
      }
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch awal + polling berkala
  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);

    // Refresh juga saat tab kembali fokus
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchNotifications]);

  // Klik di luar dropdown untuk menutup
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      // Tandai sudah dilihat secara lokal (badge count tetap ikut server,
      // tapi ini bisa dipakai kalau nanti mau highlight item baru per-user)
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative flex items-center justify-center transition-transform duration-200 hover:scale-110 cursor-pointer"
      >
        <img src="/icon/SVG/bellicon.svg" alt="Notifikasi" className="w-6 h-6 mx-2 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#FF5C7A] text-white text-[10px] font-bold border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div>
        {isOpen && (
          <div
     
            className="hidden sm:flex flex-col absolute right-0 mt-3 w-96 max-h-[32rem] bg-white card-campaign border-2 border-primary rounded-4xl shadow-lg overflow-hidden z-50"
          >
            <NotificationPanel
              isLoading={isLoading}
              notifications={notifications}
              onItemClick={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Versi mobile: full screen, konsisten dengan menu user di navbar */}
      {isOpen && (
        <div className="sm:hidden fixed inset-0 top-20 border-t-2 border-primary z-[70] bg-white flex flex-col">
          <div className="px-6 py-4 border-b border-secondary">
            <p className="text-primary text-lilita text-xl">Notifikasi</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NotificationPanel
              isLoading={isLoading}
              notifications={notifications}
              onItemClick={() => setIsOpen(false)}
              hideHeader
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel isi (dipakai untuk desktop dropdown & mobile fullscreen) ────────

function NotificationPanel({
  isLoading,
  notifications,
  onItemClick,
  hideHeader,
}: {
  isLoading: boolean;
  notifications: INotification[];
  onItemClick: () => void;
  hideHeader?: boolean;
}) {
  return (
    <>
      {!hideHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-secondary shrink-0">
          <p className="text-primary text-lilita text-xl">Notifikasi</p>
          {notifications.length > 0 && (
            <span className="text-fredoka text-xs text-secondary">
              {notifications.length} update
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <Inbox className="w-8 h-8 text-secondary mb-2" strokeWidth={1.5} />
            <p className="text-fredoka text-sm text-secondary">
              Belum ada notifikasi buat kamu.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notif={n} onClick={onItemClick} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NotificationItem({
  notif,
  onClick,
}: {
  notif: INotification;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[notif.type] ?? Bell;
  const colorClass = TYPE_COLOR[notif.type] ?? "bg-gray-100 text-gray-600";

  const content = (
    <div className="flex gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-fredoka text-sm font-semibold text-primary truncate">
            {notif.title}
          </p>
          {notif.isNew && (
            <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-[#FF5C7A]" />
          )}
        </div>
        <p className="text-fredoka text-xs text-secondary line-clamp-2 mt-0.5">
          {notif.body}
        </p>
        <p className="text-fredoka text-[10px] text-secondary/70 mt-1">
          {timeAgo(notif.timestamp)}
        </p>
      </div>
    </div>
  );

  if (!notif.href || notif.href === "#") {
    return <div className="cursor-default">{content}</div>;
  }

  return (
    <Link href={notif.href} onClick={onClick}>
      {content}
    </Link>
  );
}
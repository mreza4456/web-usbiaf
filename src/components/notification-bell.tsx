"use client";

import * as React from "react";
import Link from "next/link";

import {
    Bell,
    Megaphone,
    Target,
    CheckCircle2,
    XCircle,
    Timer,
    Clock,
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
import Image from "next/image";

// ─── Konfigurasi ────────────────────────────────────────────────────────────

/** Polling interval (ms). Ganti ke Supabase realtime kalau mau instant. */
const POLL_INTERVAL = 60_000;

type TabKey = "today" | "yesterday" | "week";

const TABS: { key: TabKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This Week" },
];

/** Icon default per tipe notifikasi (dipakai kalau bukan ORDER_STATUS) */
const TYPE_ICON: Record<NotifType, React.ElementType> = {
    CAMPAIGN: Megaphone,
    MISSION_PROGRESS: Target,
    MISSION_COMPLETED: CheckCircle2,
    ORDER_STATUS: Timer,
    NEW_SERVICE: Sparkles,
    REWARD_MISSION: Gift,
    REWARD_MILESTONE: Trophy,
    VOUCHER_EVENT: Ticket,
};

/** Untuk ORDER_STATUS, iconnya lebih spesifik berdasarkan meta.status */
const ORDER_STATUS_ICON: Record<string, React.ElementType> = {
    pending: Clock,
    processing: Timer,
    completed: CheckCircle2,
    cancelled: XCircle,
};

function getNotifIcon(notif: INotification): React.ElementType {
    if (notif.type === "ORDER_STATUS") {
        const status = notif.meta?.status as string | undefined;
        return (status && ORDER_STATUS_ICON[status]) ?? Timer as any;
    }
    return TYPE_ICON[notif.type] ?? Bell;
}

// ─── Helper tanggal ─────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function getBucket(iso: string): TabKey {
    const date = startOfDay(new Date(iso));
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(Date.now() - 86_400_000));

    if (date.getTime() === today.getTime()) return "today";
    if (date.getTime() === yesterday.getTime()) return "yesterday";
    return "week";
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "recently";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minutes ago`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} hours ago`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} days ago`;
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ─── Komponen utama ─────────────────────────────────────────────────────────

export function NotificationBellButton(): React.ReactElement {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [notifications, setNotifications] = React.useState<INotification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<TabKey>("today");
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

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, POLL_INTERVAL);
        const onVisible = () => {
            if (document.visibilityState === "visible") fetchNotifications();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [fetchNotifications]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const grouped = React.useMemo(() => {
        const buckets: Record<TabKey, INotification[]> = { today: [], yesterday: [], week: [] };
        for (const n of notifications) buckets[getBucket(n.timestamp)].push(n);
        return buckets;
    }, [notifications]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Notifikasi"
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all"
            >
                <Image src="/icon/SVG/bellicon.svg" alt="Bell" width={24} height={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>


            {isOpen && (
                <div

                    className="hidden sm:block absolute right-0 mt-3 w-[380px] z-100 bg-white card-campaign border-2 border-primary rounded-[2rem] shadow-lg overflow-hidden"
                >
                    <NotificationPanel
                        isLoading={isLoading}
                        grouped={grouped}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onItemClick={() => setIsOpen(false)}
                    />
                </div>
            )}


            {/* Versi mobile: full screen */}
            {isOpen && (
                <div className="sm:hidden fixed inset-0 top-20 border-t-2 border-primary z-[70] bg-white flex flex-col">
                    <NotificationPanel
                        isLoading={isLoading}
                        grouped={grouped}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onItemClick={() => setIsOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Panel isi ──────────────────────────────────────────────────────────────

function NotificationPanel({
    isLoading,
    grouped,
    activeTab,
    setActiveTab,
    onItemClick,
}: {
    isLoading: boolean;
    grouped: Record<TabKey, INotification[]>;
    activeTab: TabKey;
    setActiveTab: (t: TabKey) => void;
    onItemClick: () => void;
}) {
    const items = grouped[activeTab];

    return (
        <div className="flex flex-col max-h-[32rem]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 shrink-0">
                <p className="text-primary text-fredoka font-bold text-xl">All Notifications</p>
                <Link
                    href="/user/notifications"
                    onClick={onItemClick}
                    className="border-2 border-primary text-primary text-fredoka text-xs font-semibold rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
                >
                    See All
                </Link>
            </div>

            <div className="border-t-2 border-primary w-full shrink-0" />

            {/* Tabs */}
            <div className="shrink-0 px-4 pt-4">
                <div className="flex overflow-hidden rounded-full border-2 border-primary bg-white">
                    {TABS.map((tab, index) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2 text-xs font-bold text-fredoka transition-colors ${activeTab === tab.key
                                    ? "bg-[#B081FE]/40 text-primary"
                                    : "text-primary/70 hover:text-primary"
                                } ${index !== TABS.length - 1
                                    ? "border-r-2 border-primary"
                                    : ""
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <Inbox className="w-8 h-8 text-secondary mb-2" strokeWidth={1.5} />
                        <p className="text-fredoka text-sm text-secondary">
                            There are no notifications yet
                        </p>
                    </div>
                ) : (
                    items.map((n, i) => (
                        <React.Fragment key={n.id}>
                            <NotificationItem notif={n} onClick={onItemClick} />
                            {i < items.length - 1 && (
                                <div className="h-px bg-muted mx-6 my-3" />
                            )}
                        </React.Fragment>
                    ))
                )}
            </div>
        </div>
    );
}

function NotificationItem({
    notif,
    onClick,
}: {
    notif: INotification;
    onClick: () => void;
}) {
    const Icon = getNotifIcon(notif);

    const content = (
        <div className="flex gap-4 px-4 py-1">
            <div className="shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex w-full justify-between">
                    <p className="text-fredoka text-md font-bold text-primary flex items-center gap-1.5">
                        {notif.isNew && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        )}
                        {notif.title.replace(/^\p{Emoji}\s*/u, "")}
                    </p>
                    <p className="text-fredoka text-[10px] text-gray-300 mt-1">
                        {timeAgo(notif.timestamp)}
                    </p>
                </div>

                <p className="text-fredoka text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                    {notif.body}
                </p>

            </div>
        </div>
    );

    if (!notif.href || notif.href === "#") {
        return <div className="cursor-default hover:bg-gray-50 rounded-2xl transition-colors">{content}</div>;
    }

    return (
        <Link href={notif.href} onClick={onClick} className="block hover:bg-gray-50 rounded-2xl transition-colors">
            {content}
        </Link>
    );
}
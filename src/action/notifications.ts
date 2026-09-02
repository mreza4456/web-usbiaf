"use server";

import { createClient, getAuthenticatedUser } from "@/config/supabase-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifType =
  | "CAMPAIGN"
  | "MISSION_PROGRESS"
  | "MISSION_COMPLETED"
  | "ORDER_STATUS"
  | "NEW_SERVICE"
  | "REWARD_MISSION"
  | "REWARD_MILESTONE"
  | "VOUCHER_EVENT";

export interface INotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  meta?: Record<string, any>;
  href?: string;
  /** ISO timestamp – dipakai untuk sort */
  timestamp: string;
  /** true = belum dilihat / baru */
  isNew: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const cutoff = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

// ─── Main aggregator ──────────────────────────────────────────────────────────

/**
 * Kumpulkan semua notifikasi dari berbagai sumber untuk user yang sedang login.
 * Setiap sumber difetch secara paralel supaya cepat.
 * Dipanggil dari NotificationBell (client component) via server action.
 */
export async function getNotifications(): Promise<{
  success: boolean;
  data: INotification[];
  total_unread: number;
  message?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const [
      campaignRes,
      missionRes,
      orderRes,
      newServiceRes,
      rewardMissionRes,
      rewardMilestoneRes,
      voucherEventRes,
    ] = await Promise.allSettled([
      // 1. Campaign aktif (max 5 terbaru)
      supabase
        .from("campaigns")
        .select("id, title, description, categories, date, expired")
        .gte("expired", new Date().toISOString().split("T")[0])
        .order("date", { ascending: false })
        .limit(5),

      // 2. Mission progress user (completed + in_progress dengan progress > 0)
      supabase
        .from("user_missions")
        .select(
          `id, status, progress, completed_at, updated_at,
           mission:missions(id, title, target, category)`
        )
        .eq("user_id", user.id)
        .or("status.eq.COMPLETED,status.eq.IN_PROGRESS")
        .gt("progress", 0)
        .order("updated_at", { ascending: false })
        .limit(10),

      // 3. Order terbaru user (max 5, 30 hari terakhir)
      supabase
        .from("orders")
        .select("id, code_order, status, total, updated_at, created_at")
        .eq("user_id", user.id)
        .gte("created_at", cutoff(30))
        .order("updated_at", { ascending: false })
        .limit(5),

      // 4. Layanan baru (categories, 14 hari terakhir)
      supabase
        .from("categories")
        .select("id, name, description, created_at")
        .gte("created_at", cutoff(14))
        .order("created_at", { ascending: false })
        .limit(5),

      // 5. Reward dari mission (PENDING_CLAIM)
      supabase
        .from("user_rewards")
        .select(
          `id, status, granted_at,
           reward:rewards(id, type, name, voucher_value),
           mission:missions(id, title)`
        )
        .eq("user_id", user.id)
        .eq("status", "PENDING_CLAIM")
        .order("granted_at", { ascending: false })
        .limit(10),

      // 6. Reward milestone (voucher dari milestones) – source=MILESTONE, is_used=false
      supabase
        .from("vouchers")
        .select("id, code, value, expired_at, created_at, source, milestone_order")
        .eq("user_id", user.id)
        .eq("source", "MILESTONE")
        .eq("is_used", false)
        .gte("expired_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(5),

      // 7. Voucher event yang belum diklaim user
      supabase
        .from("voucher_events")
        .select("id, name, code, value, expired_at, is_active, created_at")
        .eq("is_active", true)
        .gte("expired_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const now = new Date();
    const notifications: INotification[] = [];

    // ── 1. Campaigns ──────────────────────────────────────────────────────────
    if (campaignRes.status === "fulfilled" && campaignRes.value.data) {
      for (const c of campaignRes.value.data) {
        const isNew = c.date
          ? new Date(c.date) >= new Date(cutoff(7))
          : false;
        notifications.push({
          id: `campaign-${c.id}`,
          type: "CAMPAIGN",
          title: `🎉 ${c.title ?? "New Campaign"}`,
          body: c.description ?? `Special campaign for ${c.categories ?? "all"}`,
          href: "/service",
          timestamp: c.date ?? now.toISOString(),
          isNew,
          meta: { categories: c.categories, expired: c.expired },
        });
      }
    }

    // ── 2. Mission progress ───────────────────────────────────────────────────
    if (missionRes.status === "fulfilled" && missionRes.value.data) {
      for (const um of missionRes.value.data) {
        const m = (um as any).mission;
        if (!m) continue;
        const isCompleted = um.status === "COMPLETED";
        const pct = m.target > 0 ? Math.round((um.progress / m.target) * 100) : 0;
        const isNew = um.updated_at
          ? new Date(um.updated_at) >= new Date(cutoff(3))
          : false;

        notifications.push({
          id: `mission-${um.id}`,
          type: isCompleted ? "MISSION_COMPLETED" : "MISSION_PROGRESS",
          title: isCompleted
            ? `✅ Mission Selesai!`
            : `🎯 Mission Progress`,
          body: isCompleted
            ? `"${m.title}" sudah selesai — klaim reward kamu!`
            : `"${m.title}" — ${um.progress}/${m.target} (${pct}%)`,
          href: "/user/missions",
          timestamp: um.updated_at ?? now.toISOString(),
          isNew,
          meta: {
            mission_id: m.id,
            user_mission_id: um.id,
            progress: um.progress,
            target: m.target,
            pct,
            status: um.status,
          },
        });
      }
    }

    // ── 3. Order status ───────────────────────────────────────────────────────
    if (orderRes.status === "fulfilled" && orderRes.value.data) {
      const statusLabel: Record<string, string> = {
        pending: "⏳ Menunggu konfirmasi",
        processing: "🔧 Sedang diproses",
        completed: "✅ Selesai",
        cancelled: "❌ Dibatalkan",
      };
      for (const o of orderRes.value.data) {
        const isNew = o.updated_at
          ? new Date(o.updated_at) >= new Date(cutoff(2))
          : false;
        notifications.push({
          id: `order-${o.id}`,
          type: "ORDER_STATUS",
          title: `Order ${o.code_order ?? o.id.slice(0, 8)}`,
          body: statusLabel[o.status] ?? `Status: ${o.status}`,
          href: `/user/user-order`,
          timestamp: o.updated_at ?? o.created_at ?? now.toISOString(),
          isNew,
          meta: { order_id: o.id, status: o.status, total: o.total },
        });
      }
    }

    // ── 4. New services ───────────────────────────────────────────────────────
    if (newServiceRes.status === "fulfilled" && newServiceRes.value.data) {
      for (const svc of newServiceRes.value.data) {
        const isNew = svc.created_at
          ? new Date(svc.created_at) >= new Date(cutoff(7))
          : false;
        notifications.push({
          id: `service-${svc.id}`,
          type: "NEW_SERVICE",
          title: `✨ Layanan Baru`,
          body: `"${svc.name}" kini tersedia!`,
          href: "/service",
          timestamp: svc.created_at ?? now.toISOString(),
          isNew,
          meta: { categories_id: svc.id },
        });
      }
    }

    // ── 5. Rewards dari mission ───────────────────────────────────────────────
    if (rewardMissionRes.status === "fulfilled" && rewardMissionRes.value.data) {
      for (const ur of rewardMissionRes.value.data) {
        const r = (ur as any).reward;
        const m = (ur as any).mission;
        const isNew = ur.granted_at
          ? new Date(ur.granted_at) >= new Date(cutoff(7))
          : true;
        notifications.push({
          id: `reward-mission-${ur.id}`,
          type: "REWARD_MISSION",
          title: `🎁 Reward Siap Diklaim!`,
          body: r
            ? `${r.name} (${r.type})${r.voucher_value ? ` — ${r.voucher_value} OFF` : ""} dari mission "${m?.title ?? ""}"`
            : `Kamu punya reward yang belum diklaim`,
          href: "/user/missions",
          timestamp: ur.granted_at ?? now.toISOString(),
          isNew,
          meta: {
            user_reward_id: ur.id,
            reward_type: r?.type,
            reward_name: r?.name,
          },
        });
      }
    }

    // ── 6. Rewards dari milestone ─────────────────────────────────────────────
    if (
      rewardMilestoneRes.status === "fulfilled" &&
      rewardMilestoneRes.value.data
    ) {
      for (const v of rewardMilestoneRes.value.data) {
        const isNew = v.created_at
          ? new Date(v.created_at) >= new Date(cutoff(7))
          : true;
        notifications.push({
          id: `reward-milestone-${v.id}`,
          type: "REWARD_MILESTONE",
          title: `🏆 Voucher Milestone!`,
          body: `Voucher ${v.value} OFF (kode: ${v.code}) — milestone ke-${v.milestone_order}`,
          href: "/user/voucher",
          timestamp: v.created_at ?? now.toISOString(),
          isNew,
          meta: {
            voucher_id: v.id,
            code: v.code,
            value: v.value,
            expired_at: v.expired_at,
            milestone_order: v.milestone_order,
          },
        });
      }
    }

    // ── 7. Voucher events yang belum diklaim ──────────────────────────────────
    if (voucherEventRes.status === "fulfilled" && voucherEventRes.value.data) {
      // Filter: hanya tampilkan yang belum diklaim user ini
      const unclaimed: any[] = [];
      for (const ve of voucherEventRes.value.data) {
        const { data: existing } = await supabase
          .from("vouchers")
          .select("id")
          .eq("user_id", user.id)
          .eq("voucher_event_id", ve.id)
          .maybeSingle();
        if (!existing) unclaimed.push(ve);
      }
      for (const ve of unclaimed) {
        const isNew = ve.created_at
          ? new Date(ve.created_at) >= new Date(cutoff(7))
          : false;
        notifications.push({
          id: `voucher-event-${ve.id}`,
          type: "VOUCHER_EVENT",
          title: `🎫 ${ve.name ?? "Voucher Spesial"}`,
          body: `Diskon ${ve.value} OFF — klaim sebelum kedaluwarsa!`,
          href: "#",
          timestamp: ve.created_at ?? now.toISOString(),
          isNew,
          meta: {
            voucher_event_id: ve.id,
            value: ve.value,
            expired_at: ve.expired_at,
          },
        });
      }
    }

    // ── Sort: terbaru di atas ─────────────────────────────────────────────────
    notifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total_unread = notifications.filter((n) => n.isNew).length;

    return { success: true, data: notifications, total_unread };
  } catch (err: any) {
    console.error("getNotifications error:", err);
    return {
      success: false,
      data: [],
      total_unread: 0,
      message: err.message ?? "Gagal memuat notifikasi",
    };
  }
}

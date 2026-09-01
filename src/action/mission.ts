"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    IMission,
    IMissionFormInput,
    IMissionWithProgress,
    IMissionStats,
    IReward,
    IUserReward,
    MissionEventType,
    MISSION_TYPE_EVENT_MAP,
} from "@/interface";

// ----------------------------------------------------------------------------
// Setup client & auth helper — pola sama dengan action/categories.ts di project ini
// ----------------------------------------------------------------------------
const createClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
}

const getAuthenticatedUser = async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("User tidak terautentikasi. Silakan login terlebih dahulu.");
    }

    return user;
};

const isAdmin = async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error checking admin role:", error);
        return false;
    }

    return data?.role === "admin";
};

// ============================================================================
// EVENT RECORDING — satu-satunya pintu masuk untuk memicu mission engine.
// Panggil fungsi ini dari alur bisnis lain (login handler, checkout handler,
// profile update handler, page tracker, dll), JANGAN dari input user langsung
// yang tidak divalidasi.
// ============================================================================

/**
 * Catat event aktivitas user & jalankan mission engine di database (atomic).
 * `referenceId` WAJIB diisi untuk event yang punya identitas unik seperti
 * ORDER_COMPLETED (isi dengan order id) supaya event tidak diproses dua kali
 * kalau function ini terpanggil ulang (retry, double click, dsb).
 */
export const recordMissionEvent = async (
    eventType: MissionEventType,
    metadata: Record<string, any> = {},
    referenceId?: string | null
) => {
    try {
        await getAuthenticatedUser(); // pastikan ada session; auth.uid() dipakai di dalam RPC
        const supabase = await createClient();

        const { error } = await supabase.rpc("fn_record_mission_event", {
            p_event_type: eventType,
            p_reference_id: referenceId ?? null,
            p_metadata: metadata,
        });

        if (error) {
            console.error("recordMissionEvent RPC error:", error);
            return { success: false, message: error.message };
        }

        return { success: true, message: "Event recorded" };
    } catch (error: any) {
        console.error("recordMissionEvent error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan" };
    }
};

// Helper spesifik per event supaya pemanggilan dari kode lain lebih jelas & type-safe.

export const recordLoginEvent = async () =>
    recordMissionEvent("USER_LOGIN", {});

export const recordOrderCompletedEvent = async (params: {
    orderId: string;
    productId?: string;
    categoryId?: string;
    amount: number;
    quantity?: number;
}) =>
    recordMissionEvent(
        "ORDER_COMPLETED",
        {
            product_id: params.productId,
            category_id: params.categoryId,
            amount: params.amount,
            quantity: params.quantity ?? 1,
        },
        params.orderId
    );

export const recordProfileCompletedEvent = async () =>
    recordMissionEvent("PROFILE_COMPLETED", {});

export const recordPageVisitedEvent = async (page: string) =>
    recordMissionEvent("PAGE_VISITED", { page });

// ============================================================================
// USER-FACING: daftar mission aktif + progress milik user + klaim reward
// ============================================================================

export const getActiveMissionsForUser = async (): Promise<{
    success: boolean;
    message?: string;
    data: IMissionWithProgress[];
}> => {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();

        const { data: missions, error: missionError } = await supabase
            .from("missions")
            .select(`*, reward:rewards(*)`)
            .eq("is_active", true)
            .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
            .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
            .order("created_at", { ascending: false });

        if (missionError) {
            console.error("getActiveMissionsForUser missions error:", missionError);
            return { success: false, message: missionError.message, data: [] };
        }

        const { data: userMissions, error: umError } = await supabase
            .from("user_missions")
            .select("*")
            .eq("user_id", user.id);

        if (umError) {
            console.error("getActiveMissionsForUser user_missions error:", umError);
            return { success: false, message: umError.message, data: [] };
        }

        const progressMap = new Map((userMissions || []).map((um) => [um.mission_id, um]));

        const result: IMissionWithProgress[] = (missions || []).map((m: any) => {
            const um = progressMap.get(m.id);
            return {
                ...m,
                user_mission: um ?? null,
                progress: um?.progress ?? 0,
                status: um?.status ?? "NOT_STARTED",
            };
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error("getActiveMissionsForUser catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
    }
};

export const getMyRewards = async (): Promise<{
    success: boolean;
    message?: string;
    data: IUserReward[];
}> => {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("user_rewards")
            .select(`*, reward:rewards(*), mission:missions(id, title)`)
            .eq("user_id", user.id)
            .order("granted_at", { ascending: false });

        if (error) {
            console.error("getMyRewards error:", error);
            return { success: false, message: error.message, data: [] };
        }

        return { success: true, data: data as IUserReward[] };
    } catch (error: any) {
        console.error("getMyRewards catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
    }
};

/**
 * Klaim reward untuk sebuah user_mission yang statusnya COMPLETED.
 * Logic anti-double-claim & validasi kepemilikan dilakukan di dalam
 * fn_claim_reward (database, SECURITY DEFINER) — bukan di sini.
 */
export const claimMissionReward = async (userMissionId: string) => {
    try {
        await getAuthenticatedUser();
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("fn_claim_reward", {
            p_user_mission_id: userMissionId,
        });

        if (error) {
            console.error("claimMissionReward RPC error:", error);
            return { success: false, message: error.message };
        }

        return { success: true, message: "Reward berhasil diklaim", data };
    } catch (error: any) {
        console.error("claimMissionReward error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan" };
    }
};

// ============================================================================
// ADMIN: CRUD mission
// ============================================================================

export const getAllMissionsAdmin = async (): Promise<{
    success: boolean;
    message?: string;
    data: IMission[];
}> => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin.", data: [] };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("missions")
            .select(`*, reward:rewards(*)`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("getAllMissionsAdmin error:", error);
            return { success: false, message: error.message, data: [] };
        }

        return { success: true, data: data as IMission[] };
    } catch (error: any) {
        console.error("getAllMissionsAdmin catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
    }
};

export const getAllRewards = async (): Promise<{
    success: boolean;
    message?: string;
    data: IReward[];
}> => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("rewards")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return { success: false, message: error.message, data: [] };
        }

        return { success: true, data: data as IReward[] };
    } catch (error: any) {
        return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
    }
};

export const createMission = async (input: IMissionFormInput) => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin yang bisa membuat mission.", data: null };
        }

        const supabase = await createClient();

        const payload = {
            title: input.title,
            description: input.description ?? null,
            mission_type: input.mission_type,
            // event_type di-derive otomatis dari mission_type kalau tidak dikirim eksplisit,
            // supaya admin tidak perlu mikir mapping event secara manual.
            event_type: input.event_type ?? MISSION_TYPE_EVENT_MAP[input.mission_type],
            target: input.target,
            config: input.config ?? {},
            reward_id: input.reward_id ?? null,
            category: input.category,
            start_date: input.start_date ?? null,
            end_date: input.end_date ?? null,
            is_active: input.is_active,
        };

        const { data, error } = await supabase
            .from("missions")
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error("createMission error:", error);
            return { success: false, message: error.message, data: null };
        }

        return { success: true, message: "Mission berhasil dibuat", data: data as IMission };
    } catch (error: any) {
        console.error("createMission catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: null };
    }
};

export const updateMission = async (id: string, input: Partial<IMissionFormInput>) => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate mission.", data: null };
        }

        const supabase = await createClient();

        const payload: Record<string, any> = { ...input };
        if (input.mission_type && !input.event_type) {
            payload.event_type = MISSION_TYPE_EVENT_MAP[input.mission_type];
        }

        const { data, error } = await supabase
            .from("missions")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("updateMission error:", error);
            return { success: false, message: error.message, data: null };
        }

        return { success: true, message: "Mission berhasil diupdate", data: data as IMission };
    } catch (error: any) {
        console.error("updateMission catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: null };
    }
};

export const toggleMissionActive = async (id: string, isActive: boolean) => {
    return updateMission(id, { is_active: isActive });
};

export const deleteMission = async (id: string) => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus mission.", data: null };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("missions")
            .delete()
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("deleteMission error:", error);
            return { success: false, message: error.message, data: null };
        }

        return { success: true, message: "Mission berhasil dihapus", data: data as IMission };
    } catch (error: any) {
        console.error("deleteMission catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: null };
    }
};

// ============================================================================
// ADMIN: dashboard stats
// ============================================================================

export const getMissionStats = async (missionId: string): Promise<{
    success: boolean;
    message?: string;
    data: IMissionStats | null;
}> => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin.", data: null };
        }

        const supabase = await createClient();

        const { count: totalParticipants } = await supabase
            .from("user_missions")
            .select("*", { count: "exact", head: true })
            .eq("mission_id", missionId);

        const { count: totalCompleted } = await supabase
            .from("user_missions")
            .select("*", { count: "exact", head: true })
            .eq("mission_id", missionId)
            .in("status", ["COMPLETED", "CLAIMED"]);

        const { count: totalClaimed } = await supabase
            .from("user_rewards")
            .select("*", { count: "exact", head: true })
            .eq("mission_id", missionId)
            .eq("status", "CLAIMED");

        return {
            success: true,
            data: {
                mission_id: missionId,
                total_participants: totalParticipants ?? 0,
                total_completed: totalCompleted ?? 0,
                total_claimed: totalClaimed ?? 0,
            },
        };
    } catch (error: any) {
        console.error("getMissionStats catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: null };
    }
};

/** Ringkasan untuk kartu-kartu di dashboard admin (jumlah mission aktif/selesai, dll). */
export const getMissionDashboardSummary = async () => {
    try {
        const user = await getAuthenticatedUser();
        if (!(await isAdmin(user.id))) {
            return { success: false, message: "Akses ditolak. Hanya admin.", data: null };
        }

        const supabase = await createClient();

        const [{ count: totalMissions }, { count: activeMissions }, { count: totalCompletions }, { count: totalRewardsClaimed }] =
            await Promise.all([
                supabase.from("missions").select("*", { count: "exact", head: true }),
                supabase.from("missions").select("*", { count: "exact", head: true }).eq("is_active", true),
                supabase.from("user_missions").select("*", { count: "exact", head: true }).in("status", ["COMPLETED", "CLAIMED"]),
                supabase.from("user_rewards").select("*", { count: "exact", head: true }).eq("status", "CLAIMED"),
            ]);

        return {
            success: true,
            data: {
                total_missions: totalMissions ?? 0,
                active_missions: activeMissions ?? 0,
                total_completions: totalCompletions ?? 0,
                total_rewards_claimed: totalRewardsClaimed ?? 0,
            },
        };
    } catch (error: any) {
        console.error("getMissionDashboardSummary catch error:", error);
        return { success: false, message: error.message || "Terjadi kesalahan", data: null };
    }
};
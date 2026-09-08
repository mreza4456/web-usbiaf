"use server";

import { createClient, getAuthenticatedUser } from "@/config/supabase-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IProfileInfo {
  full_name?: string;
  country?: string;
}

export interface ISocialAccounts {
  instagram?: string;
  twitch?: string;
  x?: string;
  discord?: string;
  kick?: string;
  youtube?: string;
}

export interface INotificationPreferences {
  user_id: string;
  request_updated: boolean;
  promotion_discount: boolean;
  new_coming: boolean;
  newsletter: boolean;
  updated_at?: string;
}

// ─── Profile Information (First Name / Last Name / Country) ──────────────────

/**
 * Update nama & country user yang sedang login.
 * NB: tabel `users` cuma punya kolom `full_name` (bukan first_name/last_name
 * terpisah), jadi kalau UI-nya pisah First Name & Last Name, gabungkan
 * jadi satu string di client sebelum manggil action ini.
 */
export const updateProfileInfo = async (payload: IProfileInfo) => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        ...(payload.full_name !== undefined && { full_name: payload.full_name }),
        ...(payload.country !== undefined && { country: payload.country }),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("updateProfileInfo error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Profil berhasil diupdate", data };
  } catch (error: any) {
    console.error("updateProfileInfo error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// ─── Social Accounts (Instagram, Twitch, X, Discord, Kick, Youtube) ──────────

export const updateSocialAccounts = async (payload: ISocialAccounts) => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        ...payload,
        social_media_completed: true,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("updateSocialAccounts error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Social account berhasil disimpan", data };
  } catch (error: any) {
    console.error("updateSocialAccounts error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// ─── Notification Preferences ────────────────────────────────────────────────

const DEFAULT_PREFS: Omit<INotificationPreferences, "user_id"> = {
  request_updated: true,
  promotion_discount: true,
  new_coming: true,
  newsletter: false,
};

export const getNotificationPreferences = async () => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("getNotificationPreferences error:", error);
      return { success: false, message: error.message, data: null };
    }

    // Kalau belum ada row (misal user lama sebelum trigger dibuat), pakai default
    // tanpa nge-block UI — row bakal ke-create pas user pertama kali save toggle.
    return {
      success: true,
      data: (data as INotificationPreferences) ?? { user_id: user.id, ...DEFAULT_PREFS },
    };
  } catch (error: any) {
    console.error("getNotificationPreferences error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateNotificationPreferences = async (
  payload: Partial<Omit<INotificationPreferences, "user_id" | "updated_at">>
) => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("updateNotificationPreferences error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Preferensi notifikasi disimpan", data };
  } catch (error: any) {
    console.error("updateNotificationPreferences error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};
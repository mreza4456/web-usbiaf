"use server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Service Role Client — KHUSUS untuk server action ini.
//
// Kenapa tidak pakai createServerClient (cookie-based) seperti di
// user-actions.ts? Karena flow forgot-password terjadi SEBELUM user
// login, jadi tidak ada session/cookie untuk auth.uid(). RLS policy biasa
// (yang bergantung ke auth.uid()) tidak akan bisa dipakai untuk kasus ini.
//
// Service role key bypass RLS sepenuhnya, jadi query ini bisa jalan
// walau user belum login. Ini AMAN karena:
// 1. File ini "use server" — service role key tidak pernah dikirim ke browser.
// 2. Kita hanya return true/false (bukan data user), jadi tidak membocorkan
//    informasi sensitif lain.
//
// WAJIB: simpan service role key di env var TANPA prefix NEXT_PUBLIC_,
// supaya tidak ikut ter-bundle ke client-side JS.
//   SUPABASE_SERVICE_ROLE_KEY=xxxxx   (di .env.local, JANGAN commit ke git)
// ============================================================
const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Cek apakah sebuah email sudah terdaftar di tabel "users".
 * Dipanggil dari halaman forgot-password SEBELUM mengirim kode reset,
 * supaya user yang emailnya tidak terdaftar tidak bisa lanjut ke step
 * berikutnya.
 *
 * Catatan keamanan: fungsi ini sengaja hanya mengembalikan boolean,
 * bukan data user, untuk meminimalkan risiko information leakage —
 * meskipun secara prinsip fitur "cek email terdaftar" itu sendiri
 * memang bentuk enumeration by design sesuai permintaan produk.
 */
export const checkEmailRegistered = async (
  email: string
): Promise<{ success: boolean; exists: boolean; message?: string }> => {
  try {
    if (!email || typeof email !== "string") {
      return { success: false, exists: false, message: "Email tidak valid." };
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("checkEmailRegistered error:", error);
      return {
        success: false,
        exists: false,
        message: "Tidak dapat memverifikasi email saat ini. Silakan coba lagi.",
      };
    }

    return { success: true, exists: !!data };
  } catch (error: any) {
    console.error("checkEmailRegistered error:", error);
    return {
      success: false,
      exists: false,
      message: error.message || "Terjadi kesalahan.",
    };
  }
};
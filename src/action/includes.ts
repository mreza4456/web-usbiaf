"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IIncludes } from "@/interface";

// Create Supabase client dengan cookie support
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

// Helper function untuk get authenticated user
const getAuthenticatedUser = async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User tidak terautentikasi. Silakan login terlebih dahulu.");
  }

  return user;
};

// Helper function untuk check admin role
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

/* ==========================================================
   INCLUDES (relasi ke category, ditampilkan saat klik kategori)
   Semua select join ke categories supaya include.categories terisi
   ========================================================== */

export const addInclude = async (categoriesId: string, includeName: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah include.", data: null };
    }

    if (!includeName.trim()) {
      return { success: false, message: "Nama include tidak boleh kosong", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_include")
      .insert([{ include_name: includeName.trim(), categories_id: categoriesId }])
      .select(`
        *,
        categories (*)
      `)
      .single();

    if (error) {
      console.error("addInclude error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Include berhasil ditambahkan", data: data as IIncludes };
  } catch (error: any) {
    console.error("addInclude catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateInclude = async (id: string, includeName: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate include.", data: null };
    }

    if (!includeName.trim()) {
      return { success: false, message: "Nama include tidak boleh kosong", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_include")
      .update({ include_name: includeName.trim() })
      .eq("id", id)
      .select(`
        *,
        categories (*)
      `)
      .single();

    if (error) {
      console.error("updateInclude error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Include berhasil diupdate", data: data as IIncludes };
  } catch (error: any) {
    console.error("updateInclude catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteInclude = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus include.", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_include")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("deleteInclude error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Include berhasil dihapus", data: data as IIncludes };
  } catch (error: any) {
    console.error("deleteInclude catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Ambil semua includes (tanpa filter kategori)
export const getAllIncludes = async () => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_include")
      .select(`
        *,
        categories (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAllIncludes error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IIncludes[] };
  } catch (error: any) {
    console.error("getAllIncludes catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

// Ambil includes untuk 1 kategori tertentu (dipanggil saat klik kategori)
export const getIncludesByCategory = async (categoryId: string) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_include")
      .select(`
        *,
        categories (*)
      `)
      .eq("categories_id", categoryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getIncludesByCategory error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IIncludes[] };
  } catch (error: any) {
    console.error("getIncludesByCategory catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};
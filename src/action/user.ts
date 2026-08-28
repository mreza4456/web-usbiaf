"use server";
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { IUser } from "@/interface";

// Create Supabase client dengan cookie support untuk server actions
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

// Admin client khusus untuk operasi yang butuh service role key
// (mis. hapus user dari auth.users). JANGAN pernah expose key ini ke client.
const createAdminClient = () => {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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

// Get user role (public function, bisa dipanggil dari mana saja)
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return "user";
    return data.role;
  } catch (error) {
    console.error("getUserRole error:", error);
    return "user";
  }
};

// Add new user (biasanya dipanggil otomatis via trigger, tapi tetap perlu validasi)
export const addUsers = async (userData: Partial<IUser>) => {
  try {
    // User bisa create account sendiri (self-registration)
    // Tapi harus pastikan ID-nya sama dengan auth.uid()
    const user = await getAuthenticatedUser();
    
    // Validasi: user hanya bisa create data untuk diri sendiri
    if (userData.id && userData.id !== user.id) {
      return { 
        success: false, 
        message: "Tidak bisa membuat user data untuk user lain", 
        data: null 
      };
    }

    const supabase = await createClient();
    
    // Set ID dari authenticated user
    const userToInsert = {
      ...userData,
      id: user.id,
      role: userData.role || 'user', // Default role = user
    };

    const { data, error } = await supabase
      .from("users")
      .insert([userToInsert])
      .select()
      .single();

    if (error) {
      console.error("Add user error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "User berhasil dibuat", data: data as IUser };
  } catch (error: any) {
    console.error("addUsers error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Update user data
export const updateUsers = async (id: string, userData: Partial<IUser>) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    // User bisa update data sendiri, atau admin bisa update siapa saja
    if (user.id !== id && !adminCheck) {
      return { 
        success: false, 
        message: "Akses ditolak. Anda hanya bisa mengupdate data Anda sendiri.", 
        data: null 
      };
    }

    // Jika bukan admin, tidak boleh mengubah role
    if (!adminCheck && userData.role) {
      return {
        success: false,
        message: "Akses ditolak. Hanya admin yang bisa mengubah role.",
        data: null
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update user error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "User berhasil diupdate", data: data as IUser };
  } catch (error: any) {
    console.error("updateUsers error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Update password milik user yang sedang login.
// Verifikasi ulang currentPassword dengan sign-in sebelum mengizinkan perubahan,
// supaya tidak ada orang lain yang bisa ganti password hanya karena sesi masih aktif.
export const updatePassword = async (
  id: string,
  payload: { currentPassword: string; newPassword: string }
) => {
  try {
    const user = await getAuthenticatedUser();

    // Hanya boleh mengubah password milik sendiri
    if (user.id !== id) {
      return {
        success: false,
        message: "Akses ditolak. Anda hanya bisa mengubah password Anda sendiri.",
        data: null
      };
    }

    if (!payload.currentPassword || !payload.newPassword) {
      return {
        success: false,
        message: "Password saat ini dan password baru wajib diisi.",
        data: null
      };
    }

    if (payload.newPassword.length < 8) {
      return {
        success: false,
        message: "Password baru minimal 8 karakter.",
        data: null
      };
    }

    if (!user.email) {
      return {
        success: false,
        message: "Email user tidak ditemukan.",
        data: null
      };
    }

    const supabase = await createClient();

    // Verifikasi currentPassword benar dengan mencoba sign-in ulang
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: payload.currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        message: "Password saat ini salah.",
        data: null
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (error) {
      console.error("Update password error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Password berhasil diubah", data: null };
  } catch (error: any) {
    console.error("updatePassword error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Hapus akun milik sendiri secara permanen (data di tabel users + akun auth).
// Butuh SUPABASE_SERVICE_ROLE_KEY karena auth.admin.deleteUser tidak bisa dipanggil dengan anon key.
export const deleteAccount = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();

    // Hanya boleh menghapus akun milik sendiri lewat fungsi ini
    // (untuk admin menghapus user lain, tetap pakai deleteUsers)
    if (user.id !== id) {
      return {
        success: false,
        message: "Akses ditolak. Anda hanya bisa menghapus akun Anda sendiri.",
        data: null
      };
    }

    const supabase = await createClient();

    // Hapus dulu row di tabel public.users
    const { error: deleteRowError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteRowError) {
      console.error("Delete user row error:", deleteRowError);
      return { success: false, message: deleteRowError.message, data: null };
    }

    // Hapus akun dari auth.users pakai admin client (service role)
    const adminClient = createAdminClient();
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error("Delete auth user error:", deleteAuthError);
      return {
        success: false,
        message: "Data profil terhapus, tapi gagal menghapus akun auth: " + deleteAuthError.message,
        data: null
      };
    }

    // Sign out sesi yang sedang berjalan
    await supabase.auth.signOut();

    return { success: true, message: "Akun berhasil dihapus", data: null };
  } catch (error: any) {
    console.error("deleteAccount error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Delete user (hanya admin)
export const deleteUsers = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { 
        success: false, 
        message: "Akses ditolak. Hanya admin yang bisa menghapus user.", 
        data: null 
      };
    }

    // Tidak boleh delete diri sendiri
    if (user.id === id) {
      return {
        success: false,
        message: "Tidak bisa menghapus akun Anda sendiri.",
        data: null
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Delete user error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "User berhasil dihapus", data: data as IUser };
  } catch (error: any) {
    console.error("deleteUsers error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Get user by ID (user bisa lihat data sendiri, admin bisa lihat semua)
export const getUsersById = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    // User hanya bisa lihat data sendiri, admin bisa lihat semua
    if (user.id !== id && !adminCheck) {
      return {
        success: false,
        message: "Akses ditolak. Anda hanya bisa melihat data Anda sendiri.",
        data: null
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get user by ID error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IUser };
  } catch (error: any) {
    console.error("getUsersById error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

// Get all users (hanya admin)
export const getAllUsers = async () => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return {
        success: false,
        message: "Akses ditolak. Hanya admin yang bisa melihat semua user.",
        data: []
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all users error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IUser[] };
  } catch (error: any) {
    console.error("getAllUsers error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

// Get active users with filters (hanya admin)
export const getActiveUsers = async (filters: any) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return {
        success: false,
        message: "Akses ditolak. Hanya admin yang bisa melihat daftar user.",
        data: []
      };
    }

    const supabase = await createClient();

    let qry = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (filters.search) {
      qry = qry.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    if (filters.role) {
      qry = qry.eq("role", filters.role);
    }

    const { data, error } = await qry;
    
    if (error) {
      console.error("Get active users error:", error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data as IUser[],
    };
  } catch (error: any) {
    console.error("getActiveUsers error:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan",
      data: [],
    };
  }
};

// Get current logged in user data
export const getCurrentUser = async () => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Get current user error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IUser };
  } catch (error: any) {
    console.error("getCurrentUser error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};
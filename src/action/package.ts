"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IPackageCategories } from "@/interface";

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

export const addPackageCategory = async (packageCategory: Partial<IPackageCategories>) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .insert([packageCategory])
      .select()
      .single();

    if (error) {
      console.error("Package category insert error:", error);
      return { success: false, message: error.message, data: null };
    }
    
    return { success: true, message: "Package category created successfully", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("addPackageCategory error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updatePackageCategory = async (id: string | number, packageCategory: Partial<IPackageCategories>) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate kategori.", data: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .update(packageCategory)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Package category update error:", error);
      return { success: false, message: error.message, data: null };
    }
    
    return { success: true, message: "Package category updated successfully", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("updatePackageCategory error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deletePackageCategory = async (id: string | number) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus kategori.", data: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Package category delete error:", error);
      return { success: false, message: error.message, data: null };
    }
    
    return { success: true, message: "Package category deleted successfully", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("deletePackageCategory error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getPackageCategoryById = async (id: string | number) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .select(`
        *,
        categories (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("getPackageCategoryById error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IPackageCategories };
  } catch (error: any) {
    console.error("getPackageCategoryById error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getAllPackageCategories = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .select(`
        *,
        categories (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAllPackageCategories error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPackageCategories[] };
  } catch (error: any) {
    console.error("getAllPackageCategories error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

export const getPackageCategoriesByCategoryId = async (categoryId: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories_package")
      .select(`
        *,
        categories (*)
      `)
      .eq("categories_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getPackageCategoriesByCategoryId error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPackageCategories[] };
  } catch (error: any) {
    console.error("getPackageCategoriesByCategoryId error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};
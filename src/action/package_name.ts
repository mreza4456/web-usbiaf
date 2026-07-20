"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IPackageCategories, IPackageName } from "@/interface";

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
   PACKAGE_NAME (master data) — misal: "Paket Basic", "Paket Premium"
   ========================================================== */

export const addPackageName = async (name: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah nama package.", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("package_name")
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error("addPackageName error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Nama package berhasil ditambahkan", data: data as IPackageName };
  } catch (error: any) {
    console.error("addPackageName catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updatePackageName = async (id: string, name: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate nama package.", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("package_name")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updatePackageName error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Nama package berhasil diupdate", data: data as IPackageName };
  } catch (error: any) {
    console.error("updatePackageName catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deletePackageName = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus nama package.", data: null };
    }

    const supabase = await createClient();

    // Cek dulu apakah package_name ini masih dipakai di categories_package
    const { data: usedIn, error: checkError } = await supabase
      .from("categories_package")
      .select("id")
      .eq("package_id", id)
      .limit(1);

    if (checkError) {
      console.error("Check usage error:", checkError);
      return { success: false, message: checkError.message, data: null };
    }

    if (usedIn && usedIn.length > 0) {
      return {
        success: false,
        message: "Nama package ini masih dipakai di salah satu kategori. Hapus relasinya dulu sebelum menghapus master package.",
        data: null,
      };
    }

    const { data, error } = await supabase
      .from("package_name")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("deletePackageName error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Nama package berhasil dihapus", data: data as IPackageName };
  } catch (error: any) {
    console.error("deletePackageName catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getAllPackageNames = async () => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("package_name")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("getAllPackageNames error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPackageName[] };
  } catch (error: any) {
    console.error("getAllPackageNames catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

/* ==========================================================
   CATEGORIES_PACKAGE (relasi category <-> package_name,
   plus harga & deskripsi spesifik untuk kombinasi tsb)
   ========================================================== */

export const addCategoryPackage = async (payload: {
  categories_id: string;
  package_id: number;
  name: string;
  price: number;
  description?: string;
}) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah package ke kategori.", data: null };
    }

    const supabase = await createClient();

    // Cegah duplikat: package_id yang sama pada categories_id yang sama
    const { data: existing, error: existingError } = await supabase
      .from("categories_package")
      .select("id")
      .eq("categories_id", payload.categories_id)
      .eq("package_id", payload.package_id)
      .maybeSingle();

    if (existingError) {
      console.error("Check existing package error:", existingError);
      return { success: false, message: existingError.message, data: null };
    }

    if (existing) {
      return { success: false, message: "Package ini sudah terdaftar di kategori tersebut.", data: null };
    }

    const { data, error } = await supabase
      .from("categories_package")
      .insert([payload])
      .select(`*, package:package_name(*)`)
      .single();

    if (error) {
      console.error("addCategoryPackage error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Package berhasil ditambahkan ke kategori", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("addCategoryPackage catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateCategoryPackage = async (
  id: string,
  payload: Partial<Pick<IPackageCategories, "name" | "price" | "description" | "package_id">>
) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate package kategori.", data: null };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_package")
      .update(payload)
      .eq("id", id)
      .select(`*, package:package_name(*)`)
      .single();

    if (error) {
      console.error("updateCategoryPackage error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Package kategori berhasil diupdate", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("updateCategoryPackage catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteCategoryPackage = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus package kategori.", data: null };
    }

    const supabase = await createClient();

    // Hapus dulu carts yang refer ke relasi ini (sama seperti pada deleteCategories),
    // supaya tidak kena foreign key violation carts_package_id_fkey
    const { error: cartsError } = await supabase
      .from("carts")
      .delete()
      .eq("package_id", id);

    if (cartsError) {
      console.error("Carts delete error:", cartsError);
      return {
        success: false,
        message: `Gagal menghapus carts terkait: ${cartsError.message}`,
        data: null,
      };
    }

    const { data, error } = await supabase
      .from("categories_package")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("deleteCategoryPackage error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Package berhasil dihapus dari kategori", data: data as IPackageCategories };
  } catch (error: any) {
    console.error("deleteCategoryPackage catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getCategoryPackages = async (categoriesId: string) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories_package")
      .select(`*, package:package_name(*)`)
      .eq("categories_id", categoriesId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getCategoryPackages error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPackageCategories[] };
  } catch (error: any) {
    console.error("getCategoryPackages catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};
"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IPackageCategories, IPackageName } from "@/interface";

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
   PACKAGE_NAME (master data) — misal: "Basic", "Standard", "Premium"
   Dipakai oleh modal "Kelola Package Type" di admin
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
   Semua select join ke package_name supaya pkg.package.name terisi
   ========================================================== */

export const addPackageCategory = async (packageCategory: Partial<IPackageCategories>) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();

    // Cegah duplikat: package_id yang sama pada categories_id yang sama
    if (packageCategory.categories_id && packageCategory.package_id !== undefined) {
      const { data: existing, error: existingError } = await supabase
        .from("categories_package")
        .select("id")
        .eq("categories_id", packageCategory.categories_id)
        .eq("package_id", packageCategory.package_id)
        .maybeSingle();

      if (existingError) {
        console.error("Check existing package error:", existingError);
        return { success: false, message: existingError.message, data: null };
      }

      if (existing) {
        return { success: false, message: "Package ini sudah terdaftar di kategori tersebut.", data: null };
      }
    }

    const { data, error } = await supabase
      .from("categories_package")
      .insert([packageCategory])
      .select(`
        *,
        categories (*),
        package:package_name (*)
      `)
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
      .select(`
        *,
        categories (*),
        package:package_name (*)
      `)
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

    // Hapus dulu carts yang refer ke relasi ini (foreign key carts_package_id_fkey),
    // supaya delete categories_package tidak gagal
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
        categories (*),
        package:package_name (*)
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
        categories (*),
        package:package_name (*)
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
        categories (*),
        package:package_name (*)
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
"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ICategory, IImageCategories } from "@/interface";

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

export const addCategories = async (category: Partial<ICategory>, images: Partial<IImageCategories>[]) => {
  try {
    // Verify user is authenticated and is admin
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();

    // 1. Insert category terlebih dahulu
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();

    if (categoryError) {
      console.error("Category insert error:", categoryError);
      return { success: false, message: categoryError.message, data: null };
    }

    // 2. Insert semua images dengan categories_id
    if (images && images.length > 0) {
      const imagesToInsert = images.map(img => ({
        image_url: img.image_url,
        categories_id: categoryData.id,
      }));

      const { error: imagesError } = await supabase
        .from("image_categories")
        .insert(imagesToInsert);

      if (imagesError) {
        console.error("Images insert error:", imagesError);
        // Rollback: hapus category jika gagal insert images
        await supabase.from("categories").delete().eq("id", categoryData.id);
        return { success: false, message: `Gagal menyimpan gambar: ${imagesError.message}`, data: null };
      }
    }

    return { success: true, message: "Category berhasil dibuat", data: categoryData as ICategory };
  } catch (error: any) {
    console.error("addCategories error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateCategories = async (
  id: string, 
  category: Partial<ICategory>, 
  images: Partial<IImageCategories>[]
) => {
  try {
    // Verify user is authenticated and is admin
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate kategori.", data: null };
    }

    const supabase = await createClient();

    // 1. Update category
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();

    if (categoryError) {
      console.error("Category update error:", categoryError);
      return { success: false, message: categoryError.message, data: null };
    }

    // 2. Ambil existing images
    const { data: existingImages } = await supabase
      .from("image_categories")
      .select("*")
      .eq("categories_id", id);

    const existingImageIds = existingImages?.map(img => img.id) || [];
    const newImageIds = images.filter(img => img.id).map(img => img.id!);

    // 3. Hapus images yang tidak ada di array baru
    const imagesToDelete = existingImageIds.filter(id => !newImageIds.includes(id));
    if (imagesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("image_categories")
        .delete()
        .in("id", imagesToDelete);
      
      if (deleteError) {
        console.error("Images delete error:", deleteError);
      }
    }

    // 4. Insert images baru (yang tidak punya id)
    const newImages = images.filter(img => !img.id);
    if (newImages.length > 0) {
      const imagesToInsert = newImages.map(img => ({
        image_url: img.image_url,
        categories_id: id,
      }));

      const { error: insertError } = await supabase
        .from("image_categories")
        .insert(imagesToInsert);
      
      if (insertError) {
        console.error("Images insert error:", insertError);
      }
    }

    return { success: true, message: "Category berhasil diupdate", data: categoryData as ICategory };
  } catch (error: any) {
    console.error("updateCategories error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteCategories = async (id: string) => {
  try {
    // Verify user is authenticated and is admin
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus kategori.", data: null };
    }

    const supabase = await createClient();

    // 1. Hapus semua images terkait
    const { error: imagesError } = await supabase
      .from("image_categories")
      .delete()
      .eq("categories_id", id);

    if (imagesError) {
      console.error("Images delete error:", imagesError);
      return { 
        success: false, 
        message: `Gagal menghapus gambar: ${imagesError.message}`, 
        data: null 
      };
    }

    // 2. Hapus semua relasi di categories_package
    const { error: packagesError } = await supabase
      .from("categories_package")
      .delete()
      .eq("categories_id", id);

    if (packagesError) {
      console.error("Packages delete error:", packagesError);
      return { 
        success: false, 
        message: `Gagal menghapus relasi package: ${packagesError.message}`, 
        data: null 
      };
    }

    // 3. Hapus category itu sendiri
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Category delete error:", error);
      return { 
        success: false, 
        message: error.message, 
        data: null 
      };
    }

    return { 
      success: true, 
      message: "Category, images, dan relasi package berhasil dihapus", 
      data: data as ICategory 
    };
  } catch (error: any) {
    console.error("deleteCategories error:", error);
    return { 
      success: false, 
      message: error.message || "Terjadi kesalahan saat menghapus category", 
      data: null 
    };
  }
};

export const getCategoriesById = async (id: string) => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        packages:categories_package(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("getCategoriesById error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as ICategory & { images: IImageCategories[] } };
  } catch (error: any) {
    console.error("getCategoriesById catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getAllCategories = async () => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAllCategories error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as (ICategory & { images: IImageCategories[] })[] };
  } catch (error: any) {
    console.error("getAllCategories catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

export const getActiveCategories = async (filters: any) => {
  try {
    const supabase = await createClient();
    
    let qry = supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (filters.search) {
      qry = qry.ilike("name", `%${filters.search}%`);
    }
    
    if (filters.genre) {
      qry = qry.ilike("genre", `%${filters.genre}%`);
    }

    const { data, error } = await qry;
    
    if (error) {
      console.error("getActiveCategories error:", error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      data: data as (ICategory & { images: IImageCategories[] })[],
    };
  } catch (error: any) {
    console.error("getActiveCategories catch error:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan",
      data: [],
    };
  }
};
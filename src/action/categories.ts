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
    // sort_order diambil dari urutan array (index) sesuai urutan di form
    if (images && images.length > 0) {
      const imagesToInsert = images.map((img, index) => ({
        image_url: img.image_url,
        categories_id: categoryData.id,
        sort_order: index,
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

    // 4. Insert images baru (yang tidak punya id), sort_order sesuai posisi di array form
    const newImages = images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => !img.id);

    if (newImages.length > 0) {
      const imagesToInsert = newImages.map(({ img, index }) => ({
        image_url: img.image_url,
        categories_id: id,
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from("image_categories")
        .insert(imagesToInsert);
      
      if (insertError) {
        console.error("Images insert error:", insertError);
      }
    }

    // 5. Update sort_order untuk images yang sudah ada (yang punya id)
    // Ini bagian yang sebelumnya hilang, sehingga reorder tidak pernah tersimpan.
    const existingToUpdate = images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => img.id);

    if (existingToUpdate.length > 0) {
      const updateResults = await Promise.all(
        existingToUpdate.map(({ img, index }) =>
          supabase
            .from("image_categories")
            .update({ sort_order: index })
            .eq("id", img.id!)
        )
      );

      const updateError = updateResults.find(r => r.error);
      if (updateError?.error) {
        console.error("Images sort_order update error:", updateError.error);
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

    // 2. Ambil dulu id-id categories_package yang terkait,
    // karena carts merefer ke categories_package.id (bukan langsung ke categories.id)
    const { data: packageRelations, error: packageRelationsError } = await supabase
      .from("categories_package")
      .select("id")
      .eq("categories_id", id);

    if (packageRelationsError) {
      console.error("Fetch package relations error:", packageRelationsError);
      return { 
        success: false, 
        message: `Gagal mengambil relasi package: ${packageRelationsError.message}`, 
        data: null 
      };
    }

    const packageIds = packageRelations?.map(p => p.id) || [];

    // 3. Hapus carts yang masih merefer ke categories_package ini
    if (packageIds.length > 0) {
      const { error: cartsError } = await supabase
        .from("carts")
        .delete()
        .in("package_id", packageIds); // sesuaikan nama kolom FK jika berbeda

      if (cartsError) {
        console.error("Carts delete error:", cartsError);
        return { 
          success: false, 
          message: `Gagal menghapus carts terkait: ${cartsError.message}`, 
          data: null 
        };
      }
    }

    // 4. Hapus semua relasi di categories_package
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

    // 5. Hapus category itu sendiri
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
      // urutkan nested images berdasarkan sort_order (ascending)
      .order("sort_order", { foreignTable: "image_categories", ascending: true })
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
      .order("created_at", { ascending: false })
      // urutkan nested images berdasarkan sort_order (ascending)
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

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
      .order("created_at", { ascending: false })
      // urutkan nested images berdasarkan sort_order (ascending)
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

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
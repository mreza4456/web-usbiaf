"use server";
import { supabase } from '@/config/supabase';
import { ICategory, IImageCategories } from "@/interface";

export const addCategories = async (category: Partial<ICategory>, images: Partial<IImageCategories>[]) => {
  try {
    // 1. Insert category terlebih dahulu
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();

    if (categoryError) {
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
        // Rollback: hapus category jika gagal insert images
        await supabase.from("categories").delete().eq("id", categoryData.id);
        return { success: false, message: `Gagal menyimpan gambar: ${imagesError.message}`, data: null };
      }
    }

    return { success: true, message: "Category berhasil dibuat", data: categoryData as ICategory };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateCategories = async (
  id: string, 
  category: Partial<ICategory>, 
  images: Partial<IImageCategories>[]
) => {
  try {
    // 1. Update category
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();

    if (categoryError) {
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
      await supabase
        .from("image_categories")
        .delete()
        .in("id", imagesToDelete);
    }

    // 4. Insert images baru (yang tidak punya id)
    const newImages = images.filter(img => !img.id);
    if (newImages.length > 0) {
      const imagesToInsert = newImages.map(img => ({
        image_url: img.image_url,
    
        categories_id: id,
      }));

      await supabase.from("image_categories").insert(imagesToInsert);
    }

    return { success: true, message: "Category berhasil diupdate", data: categoryData as ICategory };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteCategories = async (id: string) => {
  try {
    // 1. Hapus semua images terkait
    const { error: imagesError } = await supabase
      .from("image_categories")
      .delete()
      .eq("categories_id", id);

    if (imagesError) {
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
    return { 
      success: false, 
      message: error.message || "Terjadi kesalahan saat menghapus category", 
      data: null 
    };
  }
};

export const getCategoriesById = async (id: string) => {
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
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as ICategory & { images: IImageCategories[] } };
};

export const getAllCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      images:image_categories(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as (ICategory & { images: IImageCategories[] })[] };
};

export const getActiveCategories = async (filters: any) => {
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
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    data: data as (ICategory & { images: IImageCategories[] })[],
  };
};
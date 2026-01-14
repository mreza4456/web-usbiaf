"use server";
import { supabase } from '@/config/supabase';
import { IPackageCategories } from "@/interface";

export const addPackageCategory = async (packageCategory: Partial<IPackageCategories>) => {
  const { data, error } = await supabase
    .from("categories_package")
    .insert([packageCategory])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Package category created successfully", data: data as IPackageCategories };
};

export const updatePackageCategory = async (id: string | number, packageCategory: Partial<IPackageCategories>) => {
  const { data, error } = await supabase
    .from("categories_package")
    .update(packageCategory)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Package category updated successfully", data: data as IPackageCategories };
};

export const deletePackageCategory = async (id: string | number) => {
  const { data, error } = await supabase
    .from("categories_package")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Package category deleted successfully", data: data as IPackageCategories };
};

export const getPackageCategoryById = async (id: string | number) => {
  const { data, error } = await supabase
    .from("categories_package")
    .select(`
      *,
      categories (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IPackageCategories };
};

export const getAllPackageCategories = async () => {
  const { data, error } = await supabase
    .from("categories_package")
    .select(`
      *,
      categories (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IPackageCategories[] };
};

export const getPackageCategoriesByCategoryId = async (categoryId: string) => {
  const { data, error } = await supabase
    .from("categories_package")
    .select(`
      *,
      categories (*)
    `)
    .eq("categories_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IPackageCategories[] };
};
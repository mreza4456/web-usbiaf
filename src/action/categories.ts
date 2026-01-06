"use server";
import { supabase } from '@/config/supabase';

import { ICategory } from "@/interface";


export const addCategories = async (category: Partial<ICategory>) => {
  const { data, error } = await supabase.from("categories").insert([category]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Categories successfully", data: data as ICategory };
};


export const updateCategories = async (id: string, category: Partial<ICategory>) => {
  const { data, error } = await supabase
    .from("categories")
    .update(category)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Category updated successfully", data: data as ICategory };
};


export const deleteCategories = async (id: string) => {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Category deleted successfully", data: data as ICategory };
};


export const getCategoriesById = async (id: string) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as ICategory };
};


export const getAllCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*").order("createdAt",{ascending:false});

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as ICategory[] };
};

export const getActiveCategories = async (filters: any) => {
  let qry = supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("createdAt", { ascending: false });

  // Apply filters if provided
  if (filters.search) {
   qry= qry.ilike("name",`%${filters.search}%`);
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
    data: data as ICategory[],
  };
};


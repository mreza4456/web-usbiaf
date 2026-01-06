"use server";
import { supabase } from '@/config/supabase';
import { IUser } from "@/interface";


export const addUsers = async (category: Partial<IUser>) => {
  const { data, error } = await supabase.from("users").insert([category]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Users successfully", data: data as IUser };
};


export const updateUsers = async (id: string, category: Partial<IUser>) => {
  const { data, error } = await supabase
    .from("users")
    .update(category)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Category updated successfully", data: data as IUser };
};


export const deleteUsers = async (id: string) => {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Category deleted successfully", data: data as IUser };
};


export const getUsersById = async (id: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IUser };
};


export const getAllUsers = async () => {
  const { data, error } = await supabase.from("users").select("*").order("created_at",{ascending:false});

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IUser[] };
};

export const getActiveUsers = async (filters: any) => {
  let qry = supabase
    .from("users")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

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
    data: data as IUser[],
  };
};
export const getUserRole = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return "user";
  return data.role;
};



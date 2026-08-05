"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IClass } from "@/interface";

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

export const getAllClasses = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class")
      .select("*")
      .order("class_name", { ascending: true });

    if (error) {
      console.error("getAllClasses error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IClass[] };
  } catch (error: any) {
    console.error("getAllClasses catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

export const getClassById = async (id: number | string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("getClassById error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IClass };
  } catch (error: any) {
    console.error("getClassById catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const addClass = async (classData: Partial<IClass>) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("class")
      .insert([classData])
      .select()
      .single();

    if (error) {
      console.error("addClass error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Class berhasil dibuat", data: data as IClass };
  } catch (error: any) {
    console.error("addClass catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateClass = async (id: number | string, classData: Partial<IClass>) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("class")
      .update(classData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateClass error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Class berhasil diupdate", data: data as IClass };
  } catch (error: any) {
    console.error("updateClass catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteClass = async (id: number | string) => {
  try {
    const supabase = await createClient();

    // Cek apakah class masih dipakai oleh categories, supaya tidak melanggar FK constraint
    const { data: usedByCategories, error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("class_id", id)
      .limit(1);

    if (checkError) {
      console.error("deleteClass check error:", checkError);
      return { success: false, message: checkError.message, data: null };
    }

    if (usedByCategories && usedByCategories.length > 0) {
      return {
        success: false,
        message: "Class tidak bisa dihapus karena masih digunakan oleh category lain.",
        data: null,
      };
    }

    const { data, error } = await supabase
      .from("class")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("deleteClass error:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Class berhasil dihapus", data: data as IClass };
  } catch (error: any) {
    console.error("deleteClass catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};
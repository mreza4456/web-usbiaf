"use server";
import { createClient, getAuthenticatedUser, isAdmin } from '@/config/supabase-server';

import { IVoucherEvents } from "@/interface";


export const addVoucherEvents = async (voucher: Partial<IVoucherEvents>) => {
  console.log("--- Start addVoucherEvents ---");
  console.log("Input payload:", voucher);

  const user = await getAuthenticatedUser();
  console.log("Authenticated User ID:", user?.id);

  const adminCheck = await isAdmin(user.id);
  console.log("Is Admin:", adminCheck);

  if (!adminCheck) {
    console.warn("Unauthorized attempt to add voucher by user:", user.id);
    return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate milestone reward." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voucher_events")
    .insert([voucher])
    .select()
    .single();

  if (error) {
    console.error("Supabase Insert Error:", error.message);
    return { success: false, message: error.message, data: null };
  }

  console.log("Voucher created successfully:", data);
  console.log("--- End addVoucherEvents ---");

  return { success: true, message: "voucher successfully", data: data as IVoucherEvents };
};

export const updateVoucherEvents = async (id: string, voucher: Partial<IVoucherEvents>) => {
  const user = await getAuthenticatedUser();
  const adminCheck = await isAdmin(user.id);

  if (!adminCheck) {
    return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate milestone reward." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voucher_events")
    .update(voucher)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "voucher updated successfully", data: data as IVoucherEvents };
};


export const deleteVoucherEvents = async (id: string) => {
  const user = await getAuthenticatedUser();
  const adminCheck = await isAdmin(user.id);

  if (!adminCheck) {
    return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate milestone reward." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voucher_events")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "voucher deleted successfully", data: data as IVoucherEvents };
};


export const getVoucherEventsById = async (id: string) => {



  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voucher_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IVoucherEvents };
};


export const getAllVoucherEvents = async () => {
  const user = await getAuthenticatedUser();
  const adminCheck = await isAdmin(user.id);

  if (!adminCheck) {
    return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate milestone reward." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("voucher_events").select("*").order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IVoucherEvents[] };
};

export const getActiveVoucherEvents = async (filters: any) => {


  const supabase = await createClient();
  let qry = supabase
    .from("voucher_events")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Apply filters if provided
  if (filters.search) {
    qry = qry.ilike("name", `%${filters.search}%`);
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
    data: data as IVoucherEvents[],
  };
};


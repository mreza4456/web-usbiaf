"use server";
import { supabase } from '@/config/supabase';

import { IVoucherEvents } from "@/interface";


export const addVoucherEvents = async (voucher: Partial<IVoucherEvents>) => {
  const { data, error } = await supabase.from("voucher_events").insert([voucher]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "voucher successfully", data: data as IVoucherEvents };
};


export const updateVoucherEvents = async (id: string, voucher: Partial<IVoucherEvents>) => {
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
  const { data, error } = await supabase.from("voucher_events").select("*").order("created_at",{ascending:false});

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IVoucherEvents[] };
};

export const getActiveVoucherEvents = async (filters: any) => {
  let qry = supabase
    .from("voucher_events")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Apply filters if provided
  if (filters.search) {
   qry= qry.ilike("name",`%${filters.search}%`);
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


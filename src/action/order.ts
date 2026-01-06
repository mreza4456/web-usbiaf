"use server";

import { supabase } from '@/config/supabase';
import { IOrder } from "@/interface";

export const getAllOrder = async () => {
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            categories:categories(*),
            users:users(*)
        `)
        .order("created_at", { ascending: false });

 
   if (error) {
     return { success: false, message: error.message, data: [] };
   }
 
   return { success: true, data: data as IOrder[] };

};

export const getOrderById = async (id: string) => {
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            categories:categories(*),
            users:users(*)
        `)
        .eq("id", id)
        .single();

   
     if (error) {
       return { success: false, message: error.message, data: null };
     }
   
     return { success: true, data: data as IOrder };
};

export const addOrder = async (product: Partial<IOrder>) => {
    try {
        // Debug payload to help diagnose malformed array literal errors
        console.log('addOrder payload (before conversion):', product);

        // Ensure platform is an array of strings (defensive). Some callers may pass a comma-separated string.
        const payload = {
            ...product,
            platform: Array.isArray(product?.platform)
                ? product.platform
                : product?.platform
                    ? String(product.platform).split(',').map((p) => p.trim()).filter(Boolean)
                    : []
        } as Partial<IOrder>;

        const { data, error } = await supabase
            .from("orders")
            .insert([payload])
            .select(`
                *,
                categories:categories(*),
                users:users(*)
            `)
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Product added successfully",
            data: data as IOrder,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const updateOrder = async (id: string, product: Partial<IOrder>) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .update({
                ...product,
                
            })
            .eq("id", id)
            .select(`
                *,
                categories:categories(*),
                users:users(*)
            `)
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Product updated successfully",
            data: data as IOrder,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const deleteOrder = async (id: string) => {
    try {
        // With CASCADE delete, images will be automatically deleted
        const { error } = await supabase
            .from("orders")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return {
            success: true,
            message: "Product deleted successfully",
            data: null,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};
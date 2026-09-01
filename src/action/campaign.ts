"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { ICampaign } from "@/interface";

export const getAllCampaigns = async () => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("campaigns")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return {
                success: false,
                message: error.message,
                data: [],
            };
        }

        return {
            success: true,
            data: data as ICampaign[],
        };
    } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        return {
            success: false,
            message: err.message,
            data: [],
        };
    }
};

export const getCampaignById = async (id: number) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("campaigns")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return {
                success: false,
                message: error.message,
                data: null,
            };
        }

        return {
            success: true,
            data: data as ICampaign,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};
export const addCampaign = async (formData: FormData) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied. Only admins can add campaigns.", data: null };
        }

        const supabase = await createClient();

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const categories = formData.get('categories') as string;
        const expired = formData.get('expired') as string;
        const date = formData.get('date') as string;
        const views = formData.get('views') as string;
        const click = formData.get('click') as string;

        if (!title || !description) {
            return { success: false, message: "Title and description are required", data: null };
        }

        const insertData = {
            title,
            description,
            categories: categories || null,
            expired: expired || null,
            date: date || null,
            views: views ? Number(views) : 0,
            click: click ? Number(click) : 0,
        };

        const { data, error } = await supabase
            .from("campaigns")
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        return { success: true, message: "Campaign added successfully", data: data as ICampaign };
    } catch (err: any) {
        console.error("addCampaign error:", err);
        return { success: false, message: err.message, data: null };
    }
};

export const updateCampaign = async (id: number, formData: FormData) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied. Only admins can update campaigns.", data: null };
        }

        const supabase = await createClient();

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const categories = formData.get('categories') as string;
        const expired = formData.get('expired') as string;
        const date = formData.get('date') as string;
        const views = formData.get('views') as string;
        const click = formData.get('click') as string;

        if (!title || !description) {
            return { success: false, message: "Title and description are required", data: null };
        }

        const updateData: any = {
            title,
            description,
            categories: categories || null,
            expired: expired || null,
            date: date || null,
            views: views ? Number(views) : 0,
            click: click ? Number(click) : 0,
        };

        const { data, error } = await supabase
            .from("campaigns")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, message: "Campaign updated successfully", data: data as ICampaign };
    } catch (err: any) {
        console.error("updateCampaign error:", err);
        return { success: false, message: err.message, data: null };
    }
};

export const deleteCampaign = async (id: number) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return {
                success: false,
                message: "Access denied. Only admins can delete campaigns.",
                data: null
            };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("campaigns")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return {
            success: true,
            message: "Campaign berhasil dihapus",
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

// Optional: increment views/click counter, sering dipakai untuk campaign
export const incrementCampaignViews = async (id: number) => {
    try {
        const supabase = await createClient();

        const { data: current, error: fetchError } = await supabase
            .from("campaigns")
            .select("views")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const { data, error } = await supabase
            .from("campaigns")
            .update({ views: (current.views || 0) + 1 })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: data as ICampaign };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

export const incrementCampaignClicks = async (id: number) => {
    try {
        const supabase = await createClient();

        const { data: current, error: fetchError } = await supabase
            .from("campaigns")
            .select("click")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const { data, error } = await supabase
            .from("campaigns")
            .update({ click: (current.click || 0) + 1 })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: data as ICampaign };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};
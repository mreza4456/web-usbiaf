"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { ITicket } from "@/interface";
import { revalidatePath } from "next/cache";

// =========================================================
// CREATE TICKET (public - dipakai di halaman contact/create ticket)
// =========================================================
export const createTicket = async (formData: FormData) => {
    try {
        const supabase = await createClient();

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const socialmedia = formData.get("socialmedia") as string;
        const subject = formData.get("subject") as string;
        const message = formData.get("message") as string;

        if (!name || !email || !subject || !message) {
            return {
                success: false,
                message: "Name, email, subject, and message are required",
                data: null,
            };
        }

        // Simple email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: "Invalid email format", data: null };
        }

        // Kalau user sedang login, ikutkan user_id (opsional, guest tetap boleh submit)
        let userId: string | null = null;
        try {
            const user = await getAuthenticatedUser();
            userId = user?.id ?? null;
        } catch {
            userId = null; // guest / belum login, tetap lanjut
        }

        const insertData = {
            name,
            email,
            social_media: socialmedia || null,
            subject,
            message,
            status: "open" as const,
            priority: "normal" as const,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from("tickets")
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/admin/tickets");

        return {
            success: true,
            message: "Ticket created successfully",
            data: data as ITicket,
        };
    } catch (err: any) {
        console.error("createTicket error:", err);
        return { success: false, message: err.message, data: null };
    }
};

// =========================================================
// GET ALL TICKETS (admin only)
// =========================================================
export const getAllTickets = async () => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied. Only admins can view tickets.", data: [] };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Database error:", error);
            return { success: false, message: error.message, data: [] };
        }

        return { success: true, data: data as ITicket[] };
    } catch (err: any) {
        console.error("Error fetching tickets:", err);
        return { success: false, message: err.message, data: [] };
    }
};

// =========================================================
// GET TICKET BY ID (admin only)
// =========================================================
export const getTicketById = async (id: number) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied.", data: null };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return { success: false, message: error.message, data: null };
        }

        return { success: true, data: data as ITicket };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

// =========================================================
// GET MY TICKETS BY EMAIL (public - untuk user cek status tiket sendiri
// tanpa perlu login, cukup masukkan email + ticket_number)
// =========================================================
export const getTicketByNumberAndEmail = async (ticketNumber: string, email: string) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .eq("ticket_number", ticketNumber)
            .eq("email", email)
            .single();

        if (error) {
            return { success: false, message: "Ticket not found", data: null };
        }

        return { success: true, data: data as ITicket };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

// =========================================================
// UPDATE TICKET STATUS / REPLY (admin only)
// =========================================================
export const updateTicket = async (
    id: number,
    payload: { status?: string; priority?: string; admin_reply?: string }
) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied. Only admins can update tickets.", data: null };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("tickets")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/admin/tickets");

        return { success: true, message: "Ticket updated successfully", data: data as ITicket };
    } catch (err: any) {
        console.error("updateTicket error:", err);
        return { success: false, message: err.message, data: null };
    }
};

// =========================================================
// DELETE TICKET (admin only)
// =========================================================
export const deleteTicket = async (id: number) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return { success: false, message: "Access denied. Only admins can delete tickets.", data: null };
        }

        const supabase = await createClient();

        const { error } = await supabase.from("tickets").delete().eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/tickets");

        return { success: true, message: "Ticket berhasil dihapus", data: null };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

export const getMyTickets = async () => {
    try {
        const user = await getAuthenticatedUser();
 
        if (!user) {
            return { success: false, message: "You must be logged in to view your tickets.", data: [] };
        }
 
        const supabase = await createClient();
 
        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
 
        if (error) {
            console.error("Database error:", error);
            return { success: false, message: error.message, data: [] };
        }
 
        return { success: true, data: data as ITicket[] };
    } catch (err: any) {
        console.error("getMyTickets error:", err);
        return { success: false, message: "You must be logged in to view your tickets.", data: [] };
    }
};
 
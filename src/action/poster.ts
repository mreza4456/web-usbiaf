"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { IPoster } from "@/interface";

// ─── Helper: Upload Image ────────────────────────────────────────────────────

const uploadImage = async (file: File, supabase: any): Promise<string> => {
    try {
        console.log("🖼️ Starting image upload:", file.name, file.type, file.size);

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `posters-images/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data, error } = await supabase.storage
            .from("images")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("🖼️ Upload error:", error);
            throw error;
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);

        console.log("🖼️ Public URL:", publicUrl);
        return publicUrl;
    } catch (err: any) {
        console.error("🖼️ Error uploading image:", err);
        throw err;
    }
};

// ─── Helper: Delete Image ────────────────────────────────────────────────────

const deleteImage = async (imageUrl: string, supabase: any): Promise<void> => {
    try {
        const urlParts = imageUrl.split("/images/");
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];
        const { error } = await supabase.storage.from("images").remove([filePath]);

        if (error) {
            console.error("🖼️ Error deleting image:", error);
        }
    } catch (err) {
        console.error("🖼️ Error in deleteImage:", err);
    }
};

// ─── Get All Posters ─────────────────────────────────────────────────────────

export const getAllPosters = async () => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("posters")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Database error:", error);
            return { success: false, message: error.message, data: [] };
        }

        return { success: true, data: data as IPoster[] };
    } catch (err: any) {
        console.error("Error fetching posters:", err);
        return { success: false, message: err.message, data: [] };
    }
};

// ─── Get Poster By ID ────────────────────────────────────────────────────────

export const getPosterById = async (id: string) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("posters")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return { success: false, message: error.message, data: null };

        return { success: true, data: data as IPoster };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

// ─── Add Poster ──────────────────────────────────────────────────────────────

export const addPoster = async (formData: FormData) => {
    try {
        console.log("📌 addPoster called");

        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return {
                success: false,
                message: "Access denied. Only admins can add posters.",
                data: null,
            };
        }

        const supabase = await createClient();

        const imageFile = formData.get("image") as File | null;
        const isActive = formData.get("is_active") === "true";

        if (!imageFile || imageFile.size === 0) {
            return {
                success: false,
                message: "Image is required",
                data: null,
            };
        }

        console.log("📌 Uploading image...");
        const imageUrl = await uploadImage(imageFile, supabase);

        const insertData = {
            image_url: imageUrl,
            is_active: isActive,
        };

        console.log("📌 Inserting data:", insertData);

        const { data, error } = await supabase
            .from("posters")
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error("📌 Insert error:", error);
            throw error;
        }

        return {
            success: true,
            message: "Poster added successfully",
            data: data as IPoster,
        };
    } catch (err: any) {
        console.error("📌 addPoster error:", err);
        return { success: false, message: err.message, data: null };
    }
};

// ─── Update Poster ───────────────────────────────────────────────────────────

export const updatePoster = async (id: string, formData: FormData) => {
    try {
        console.log("📌 updatePoster called for ID:", id);

        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return {
                success: false,
                message: "Access denied. Only admins can update posters.",
                data: null,
            };
        }

        const supabase = await createClient();

        const { data: existingPoster, error: fetchError } = await supabase
            .from("posters")
            .select("image_url")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const imageFile = formData.get("image") as File | null;
        const isActive = formData.get("is_active") === "true";

        let imageUrl = existingPoster.image_url;

        if (imageFile && imageFile.size > 0) {
            if (existingPoster.image_url) {
                await deleteImage(existingPoster.image_url, supabase);
            }
            imageUrl = await uploadImage(imageFile, supabase);
        }

        const updateData = {
            image_url: imageUrl,
            is_active: isActive,
        };

        const { data, error } = await supabase
            .from("posters")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Poster updated successfully",
            data: data as IPoster,
        };
    } catch (err: any) {
        console.error("📌 updatePoster error:", err);
        return { success: false, message: err.message, data: null };
    }
};

// ─── Delete Poster ───────────────────────────────────────────────────────────

export const deletePoster = async (id: string) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return {
                success: false,
                message: "Access denied. Only admins can delete posters.",
                data: null,
            };
        }

        const supabase = await createClient();

        const { data: poster, error: fetchError } = await supabase
            .from("posters")
            .select("image_url")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        if (poster.image_url) {
            await deleteImage(poster.image_url, supabase);
        }

        const { error } = await supabase.from("posters").delete().eq("id", id);

        if (error) throw error;

        return {
            success: true,
            message: "Poster deleted successfully",
            data: null,
        };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};

// ─── Toggle Poster Status ────────────────────────────────────────────────────

export const togglePosterStatus = async (id: string, isActive: boolean) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);

        if (!adminCheck) {
            return {
                success: false,
                message: "Access denied. Only admins can update posters.",
                data: null,
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("posters")
            .update({ is_active: isActive })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: `Poster ${isActive ? "activated" : "deactivated"} successfully`,
            data: data as IPoster,
        };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};
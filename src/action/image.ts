"use server";

import { supabase } from '@/config/supabase';
import { IImage } from "@/interface";
import { uploadToCloudflare, deleteFromCloudflare } from "@/lib/storage";

export const getAllImages = async () => {
    const { data, error } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return {
            success: false,
            message: error.message,
            data: [],
        };
    }

    return {
        success: true,
        data: data as IImage[],
    };
};

export const getImagesByProductId = async (productId: string) => {
    const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: true }); // First uploaded = main image

    if (error) {
        return {
            success: false,
            message: error.message,
            data: [],
        };
    }

    return {
        success: true,
        data: data as IImage[],
    };
};

export const getImageById = async (id: string) => {
    const { data, error } = await supabase
        .from("images")
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
        data: data as IImage,
    };
};

export const addImage = async (image: Partial<IImage>, file: File) => {
    try {
        const result = await uploadToCloudflare(file);

        if (!result.success || !result.url || !result.imageId) {
            throw new Error(result.message || "Cloudflare upload failed");
        }

        // Log for debugging
        console.debug("Uploaded image:", { publicUrl: result.url, imageId: result.imageId });

        const { data, error } = await supabase
            .from("images")
            .insert([{ 
                ...image, 
                image_url: result.url,
                file_path: result.imageId
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Image added successfully",
            data: data as IImage,
        };
    } catch (err: any) {
        return { 
            success: false, 
            message: err.message, 
            data: null 
        };
    }
};

export const updateImage = async (id: string, image: Partial<IImage>) => {
    const { data, error } = await supabase
        .from("images")
        .update(image)
        .eq("id", id)
        .select()
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
        message: "Image updated successfully",
        data: data as IImage,
    };
}


export const deleteImage = async (id: string) => {
    try {
        const { data: imageData } = await supabase
            .from("images")
            .select("image_url, file_path")
            .eq("id", id)
            .single();

        if (!imageData) {
            return { success: false, message: "Image not found", data: null };
        }

        // Prefer file_path (berisi Cloudflare imageId); fallback ke parsing dari URL
        const target = imageData.file_path || imageData.image_url;

        if (target) {
            const delResult = await deleteFromCloudflare(target);
            if (!delResult.success) {
                console.error("Cloudflare delete error:", delResult.message);
            }
        }

        const { error } = await supabase.from("images").delete().eq("id", id);

        if (error) {
            return { success: false, message: error.message, data: null };
        }

        return { success: true, message: "Image deleted successfully", data: null };
    } catch (err: any) {
        return { success: false, message: err.message, data: null };
    }
};
export const deleteImagesByProductId = async (productId: string) => {
    try {
        // Get all images for the product
        const { data: images } = await supabase
            .from("images")
            .select("id, image_url, file_path")
            .eq("product_id", productId);

        if (!images || images.length === 0) {
            return { 
                success: true, 
                message: "No images to delete", 
                data: null 
            };
        }

        // Delete each image (from storage + database)
        for (const image of images) {
            await deleteImage(image.id);
        }

        return { 
            success: true, 
            message: `${images.length} image(s) deleted successfully`, 
            data: null 
        };
    } catch (err: any) {
        return { 
            success: false, 
            message: err.message, 
            data: null 
        };
    }
};
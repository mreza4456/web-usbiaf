"use server";

import { supabase } from '@/config/supabase';
import { IImage } from "@/interface";
import { uploadImageToBucket } from "./storage";

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
        const { publicUrl, filePath } = await uploadImageToBucket(file);

        // Log for debugging
        console.debug("Uploaded image:", { publicUrl, filePath });

        const { data, error } = await supabase
            .from("images")
            .insert([{ 
                ...image, 
                image_url: publicUrl,
                file_path: filePath
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
};

export const deleteImage = async (id: string) => {
    try {
        // Get image data first
        const { data: imageData } = await supabase
            .from("images")
            .select("image_url, file_path")
            .eq("id", id)
            .single();

        if (!imageData) {
            return { 
                success: false, 
                message: "Image not found", 
                data: null 
            };
        }

        // Prefer stored file_path; fallback to parsing from image_url
        const filePath = imageData.file_path || (imageData.image_url && imageData.image_url.split("/storage/v1/object/public/images/")[1]);

        // Delete from storage
        if (filePath) {
            await supabase.storage.from("images").remove([filePath]);
        }

        // Delete from database
        const { error } = await supabase
            .from("images")
            .delete()
            .eq("id", id);

        if (error) {
            return { 
                success: false, 
                message: error.message, 
                data: null 
            };
        }

        return { 
            success: true, 
            message: "Image deleted successfully", 
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
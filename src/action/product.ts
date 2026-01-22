"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { IProduct } from "@/interface";

export const getAllProducts = async () => {
 

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            category:categories(*),
            images(*)
        `)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error('Database error:', error);
        return {
            success: false,
            message: error.message,
            data: [],
        };
    }

    console.log('Raw data from database:', JSON.stringify(data, null, 2)); // Debug log

    // Map products with their images sorted by created_at
    const products = data?.map((product: any) => {
        // Handle images array properly
        const images = Array.isArray(product.images) && product.images.length > 0
            ? product.images
                .filter((img: any) => img && img.image_url) // Filter out null/undefined
                .sort((a: any, b: any) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateA - dateB;
                })
            : [];
        
        console.log(`Product ${product.name} images:`, images); // Debug log
        
        return {
            id: product.id,
            categories_id: product.categories_id,
            image_id: product.image_id,
            name: product.name,
            description: product.description,
            price: product.price,
            created_at: product.created_at,
            updated_at: product.updated_at,
            category: product.category,
            images: images,
            main_image: images[0] || null,
            image_count: images.length,
        };
    }) || [];

    console.log('Processed products:', JSON.stringify(products, null, 2)); // Debug log

    return {
        success: true,
        data: products as IProduct[],
    };
};

export const getProductById = async (id: string) => {
   

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            category:categories(*),
            images(*)
        `)
        .eq("id", id)
        .single();

    if (error) {
        return {
            success: false,
            message: error.message,
            data: null,
        };
    }

    // Map product with images sorted by created_at (first uploaded = main)
    const images = Array.isArray(data.images) && data.images.length > 0
        ? data.images
            .filter((img: any) => img && img.image_url)
            .sort((a: any, b: any) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateA - dateB;
            })
        : [];
    
    const product = {
        id: data.id,
        categories_id: data.categories_id,
        image_id: data.image_id,
        name: data.name,
        description: data.description,
        price: data.price,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.category,
        images: images,
        main_image: images[0] || null,
        image_count: images.length,
    };

    return {
        success: true,
        data: product as IProduct,
    };
};

export const addProducts = async (product: Partial<IProduct>) => {
    try {
         const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();
        const { data, error } = await supabase
            .from("products")
            .insert([product])
            .select(`
                *,
                category:categories(*)
            `)
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Product added successfully",
            data: data as IProduct,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const updateProducts = async (id: string, product: Partial<IProduct>) => {
    
    try {
         const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();

        const { data, error } = await supabase
            .from("products")
            .update({
                ...product,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(`
                *,
                category:categories(*)
            `)
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Product updated successfully",
            data: data as IProduct,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const deleteProducts = async (id: string) => {
    
    try {
         const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();
        // With CASCADE delete, images will be automatically deleted
        const { error } = await supabase
            .from("products")
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
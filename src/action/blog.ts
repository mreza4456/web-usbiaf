"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { IBlogPost } from "@/interface";
import { uploadToCloudflare, deleteFromCloudflare } from "@/lib/storage";

export const getAllBlogPosts = async () => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("blog_posts")
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

        console.log('Blog posts from database:', JSON.stringify(data, null, 2));

        return {
            success: true,
            data: data as IBlogPost[],
        };
    } catch (err: any) {
        console.error('Error fetching blog posts:', err);
        return {
            success: false,
            message: err.message,
            data: [],
        };
    }
};

export const getBlogPostById = async (id: string) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("blog_posts")
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
            data: data as IBlogPost,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

// Helper function to upload image to Cloudflare Images
const uploadImage = async (file: File): Promise<string> => {
    try {
        console.log("🚀 Starting image upload:", file.name, file.type, file.size);

        const result = await uploadToCloudflare(file);

        if (!result.success || !result.url) {
            throw new Error(result.message || "Cloudflare upload failed");
        }

        console.log("🚀 Upload success, URL:", result.url);
        return result.url;
    } catch (err: any) {
        console.error('🚀 Error uploading image:', err);
        throw err;
    }
};

// Helper function to delete image from Cloudflare Images
const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        const result = await deleteFromCloudflare(imageUrl);
        if (!result.success) {
            console.error('Error deleting image from Cloudflare:', result.message);
        }
    } catch (err) {
        console.error('Error in deleteImage:', err);
    }
};

export const addBlogPost = async (formData: FormData) => {
    try {
        console.log("🚀 addBlogPost called");
        
        const user = await getAuthenticatedUser();
        console.log("🚀 User:", user?.id);
        
        const adminCheck = await isAdmin(user.id);
        console.log("🚀 Admin check:", adminCheck);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can add blog posts.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Extract form data
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File | null;

        console.log("🚀 Form data:", { title, description, imageFile: imageFile?.name });

        if (!title || !description) {
            return {
                success: false,
                message: "Title and description are required",
                data: null
            };
        }

        let imageUrl = null;

        // Upload image if provided
        if (imageFile && imageFile.size > 0) {
            console.log("🚀 Uploading image...");
        imageUrl = await uploadImage(imageFile);
            console.log("🚀 Image uploaded:", imageUrl);
        }

        // Insert blog post
        const insertData = {
            title,
            description,
            image: imageUrl,
        };

        console.log("🚀 Inserting data:", insertData);

        const { data, error } = await supabase
            .from("blog_posts")
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error("🚀 Insert error:", error);
            throw error;
        }

        console.log("🚀 Insert success:", data);

        return {
            success: true,
            message: "Blog post added successfully",
            data: data as IBlogPost,
        };
    } catch (err: any) {
        console.error("🚀 addBlogPost error:", err);
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const updateBlogPost = async (id: string, formData: FormData) => {
    try {
        console.log("🚀 updateBlogPost called for ID:", id);
        
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can update blog posts.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Get existing blog post
        const { data: existingPost, error: fetchError } = await supabase
            .from("blog_posts")
            .select("image")
            .eq("id", id)
            .single();

        if (fetchError) {
            console.error("🚀 Fetch error:", fetchError);
            throw fetchError;
        }

        // Extract form data
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File | null;

        console.log("🚀 Update data:", { title, description, imageFile: imageFile?.name });

        if (!title || !description) {
            return {
                success: false,
                message: "Title and description are required",
                data: null
            };
        }

        let imageUrl = existingPost.image;

        // Upload new image if provided
        if (imageFile && imageFile.size > 0) {
            console.log("🚀 Uploading new image...");
            
            // Delete old image if exists
            if (existingPost.image) {
                console.log("🚀 Deleting old image...");
                await deleteImage(existingPost.image);
            }
            
            imageUrl = await uploadImage(imageFile);
            console.log("🚀 New image uploaded:", imageUrl);
        }

        // Update blog post
        const updateData: any = {
            title,
            description,
            image: imageUrl,
            updated_at: new Date().toISOString(),
        };

        console.log("🚀 Updating with data:", updateData);

        const { data, error } = await supabase
            .from("blog_posts")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("🚀 Update error:", error);
            throw error;
        }

        console.log("🚀 Update success:", data);

        return {
            success: true,
            message: "Blog post updated successfully",
            data: data as IBlogPost,
        };
    } catch (err: any) {
        console.error("🚀 updateBlogPost error:", err);
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const deleteBlogPost = async (id: string) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can delete blog posts.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Get blog post to delete its image
        const { data: post, error: fetchError } = await supabase
            .from("blog_posts")
            .select("image")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        // Delete image from storage if exists
        if (post.image) {
            await deleteImage(post.image);
        }

        // Delete blog post from database
        const { error } = await supabase
            .from("blog_posts")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return {
            success: true,
            message: "Blog post deleted successfully",
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
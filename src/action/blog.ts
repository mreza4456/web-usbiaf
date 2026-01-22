"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { IBlogPost } from "@/interface";

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

export const addBlogPost = async (blogPost: Partial<IBlogPost>) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Akses ditolak. Hanya admin yang bisa menambah blog post.", 
                data: null 
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("blog_posts")
            .insert([blogPost])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Blog post added successfully",
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

export const updateBlogPost = async (id: string, blogPost: Partial<IBlogPost>) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Akses ditolak. Hanya admin yang bisa mengupdate blog post.", 
                data: null 
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("blog_posts")
            .update({
                ...blogPost,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: "Blog post updated successfully",
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

export const deleteBlogPost = async (id: string) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Akses ditolak. Hanya admin yang bisa menghapus blog post.", 
                data: null 
            };
        }

        const supabase = await createClient();

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
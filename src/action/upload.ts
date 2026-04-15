"use server";
import { supabase } from '@/config/supabase';

type UploadResult = {
  success: boolean;
  message: string;
  url: string | null;
  filePath?: string | null;
}

export const uploadImage = async (file: FormData): Promise<UploadResult> => {
  try {
    const imageFile = file.get('file') as File;
    
    if (!imageFile) {
      return { success: false, message: 'No file provided', url: null, filePath: null };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(imageFile.type)) {
      return { success: false, message: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed', url: null, filePath: null };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return { success: false, message: 'File size too large. Max 5MB', url: null, filePath: null };
    }

    // Generate unique filename
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `categories/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images') // Make sure you have a bucket named 'images'
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, message: error.message, url: null, filePath: null };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { success: true, message: 'Image uploaded successfully', url: publicUrl, filePath };
  } catch (error: any) {
    return { success: false, message: error.message || 'Upload failed', url: null, filePath: null };
  }
};

export const deleteImage = async (imageUrl: string) => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('categories')).join('/');

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Image deleted successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Delete failed' };
  }
};
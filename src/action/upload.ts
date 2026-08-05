"use server";
import { uploadToCloudflare, deleteFromCloudflare } from "@/lib/storage";

type UploadResult = {
  success: boolean;
  message: string;
  url: string | null;
  filePath?: string | null; // dipertahankan biar tidak break caller lama, tidak dipakai lagi
};

export const uploadImage = async (file: FormData): Promise<UploadResult> => {
  const imageFile = file.get("file") as File;

  if (!imageFile) {
    return { success: false, message: "No file provided", url: null, filePath: null };
  }

  const result = await uploadToCloudflare(imageFile);

  return {
    success: result.success,
    message: result.message,
    url: result.url,
    filePath: result.imageId, // simpan imageId di sini kalau caller lama butuh referensi
  };
};

export const deleteImage = async (imageUrl: string) => {
  const result = await deleteFromCloudflare(imageUrl);
  return { success: result.success, message: result.message };
};
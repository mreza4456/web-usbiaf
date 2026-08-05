import { uploadToCloudflare } from "@/lib/storage";

export const uploadImageToBucket = async (file: File) => {
  const result = await uploadToCloudflare(file);

  if (!result.success || !result.url || !result.imageId) {
    throw new Error(result.message || "Upload to Cloudflare failed");
  }

  // Return publicUrl + imageId as filePath so existing callers keep working
  return { publicUrl: result.url, filePath: result.imageId };
};

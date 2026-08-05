/**
 * Helper: cek apakah sebuah URL berasal dari Cloudflare Images.
 * Ganti semua pengecekan `.includes('supabase')` di komponen client dengan ini.
 */
export const isCloudflareImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.includes("imagedelivery.net");
};

/**
 * Extract image ID dari full URL Cloudflare Images
 * Format URL: https://imagedelivery.net/<account_hash>/<image_id>/<variant>
 * Kalau input bukan URL (sudah berupa id polos), langsung dikembalikan apa adanya.
 */
export const extractImageId = (input: string): string | null => {
  if (!isCloudflareImageUrl(input)) {
    return input || null;
  }

  const parts = input.split("/").filter(Boolean);
  const imageId = parts[parts.length - 2];
  return imageId || null;
};
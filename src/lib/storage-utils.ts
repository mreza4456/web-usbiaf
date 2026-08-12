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

/**
 * Daftar variant Cloudflare Images yang tersedia.
 * Sesuaikan nama-nama ini dengan variant yang sudah dikonfigurasi
 * di Cloudflare Images dashboard (Images > Variants).
 *
 * Contoh ukuran rekomendasi:
 *  - thumbnail : 150x150  (avatar, icon kecil)
 *  - small      : 400px wide (kartu grid mobile)
 *  - medium     : 800px wide (kartu desktop, blog)
 *  - large      : 1200px wide (hero section, full-width banner)
 *  - public     : ukuran asli / tidak di-resize (fallback / admin upload)
 */
export type CloudflareVariant =
  | "thumbnail"
  | "small"
  | "medium"
  | "large"
  | "public";

/**
 * Mapping ukuran display → nama variant Cloudflare Images.
 * Gunakan konstanta ini di komponen agar mudah diubah secara terpusat.
 */
export const CLOUDFLARE_VARIANTS = {
  /** Avatar, icon kecil (≤ 150px) */
  avatar: "thumbnail" as CloudflareVariant,
  /** Kartu produk / kategori di carousel mobile */
  card: "small" as CloudflareVariant,
  /** Kartu produk / blog di desktop, thumbnail artikel */
  cardDesktop: "medium" as CloudflareVariant,
  /** Hero section, banner full-width */
  hero: "large" as CloudflareVariant,
  /** Gambar asli (admin, preview upload) */
  original: "public" as CloudflareVariant,
} as const;

/**
 * Mengganti atau menambahkan variant pada URL Cloudflare Images.
 *
 * Format URL: https://imagedelivery.net/<hash>/<image_id>/<variant>
 *
 * - Jika URL bukan dari Cloudflare, dikembalikan apa adanya.
 * - Jika URL sudah memiliki variant, akan diganti dengan `variant` yang diberikan.
 * - Jika URL belum memiliki variant (hanya sampai image_id), variant akan ditambahkan.
 *
 * @param url     URL gambar (bisa dari Cloudflare maupun sumber lain)
 * @param variant Nama variant Cloudflare Images yang diinginkan
 * @returns       URL yang sudah disesuaikan variantnya
 *
 * @example
 * // Mengganti variant menjadi "thumbnail"
 * getCloudflareImageUrl(
 *   "https://imagedelivery.net/abc123/img-uuid/public",
 *   "thumbnail"
 * );
 * // → "https://imagedelivery.net/abc123/img-uuid/thumbnail"
 */
export const getCloudflareImageUrl = (
  url: string | null | undefined,
  variant: CloudflareVariant = "public"
): string => {
  if (!url) return "";

  // Bukan URL Cloudflare → kembalikan apa adanya
  if (!isCloudflareImageUrl(url)) return url;

  // Hilangkan trailing slash agar split konsisten
  const normalized = url.replace(/\/+$/, "");
  const parts = normalized.split("/");

  // Struktur: ["https:", "", "imagedelivery.net", "<hash>", "<image_id>", "<variant?>"]
  // Index:       0       1          2                3           4              5
  if (parts.length < 5) return url;

  if (parts.length === 5) {
    // URL belum punya variant → tambahkan
    return `${normalized}/${variant}`;
  }

  // Ganti bagian paling akhir (variant lama) dengan variant baru
  parts[parts.length - 1] = variant;
  return parts.join("/");
};
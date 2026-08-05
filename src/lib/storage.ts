"use server";

import { extractImageId } from "./storage-utils";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const getApiBase = () =>
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;

export type CloudflareUploadResult = {
  success: boolean;
  message: string;
  url: string | null;
  imageId: string | null;
};

export type CloudflareDeleteResult = {
  success: boolean;
  message: string;
};

const DEFAULT_VALID_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

interface UploadOptions {
  validTypes?: string[];
  maxSize?: number;
  id?: string;
}

export const uploadToCloudflare = async (
  file: File,
  options?: UploadOptions
): Promise<CloudflareUploadResult> => {
  try {
    if (!file) {
      return { success: false, message: "No file provided", url: null, imageId: null };
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error("Missing Cloudflare env vars:", {
        hasAccountId: !!CLOUDFLARE_ACCOUNT_ID,
        hasToken: !!CLOUDFLARE_API_TOKEN,
      });
      return {
        success: false,
        message: "Cloudflare credentials not configured (periksa CLOUDFLARE_ACCOUNT_ID dan CLOUDFLARE_API_TOKEN di .env)",
        url: null,
        imageId: null,
      };
    }

    const validTypes = options?.validTypes ?? DEFAULT_VALID_TYPES;
    const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        message: `Invalid file type. Allowed: ${validTypes.join(", ")}`,
        url: null,
        imageId: null,
      };
    }

    if (file.size > maxSize) {
      return {
        success: false,
        message: `File size too large. Max ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
        url: null,
        imageId: null,
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    if (options?.id) {
      formData.append("id", options.id);
    }

    const res = await fetch(getApiBase(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    });

    let result: any;
    try {
      result = await res.json();
    } catch {
      return {
        success: false,
        message: `Cloudflare returned non-JSON response (HTTP ${res.status})`,
        url: null,
        imageId: null,
      };
    }

    if (!result.success) {
      const errMsg = result.errors?.[0]?.message || "Upload failed";
      console.error(`Cloudflare upload error (HTTP ${res.status}):`, result.errors);
      return {
        success: false,
        message: `${errMsg} (status: ${res.status})`,
        url: null,
        imageId: null,
      };
    }

    const publicUrl: string =
      result.result.variants.find((v: string) => v.endsWith("/public")) ||
      result.result.variants[0];

    return {
      success: true,
      message: "Image uploaded successfully",
      url: publicUrl,
      imageId: result.result.id,
    };
  } catch (error: any) {
    console.error("uploadToCloudflare error:", error);
    return {
      success: false,
      message: error.message || "Upload failed",
      url: null,
      imageId: null,
    };
  }
};

export const deleteFromCloudflare = async (
  urlOrImageId: string
): Promise<CloudflareDeleteResult> => {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return { success: false, message: "Cloudflare credentials not configured" };
    }

    const imageId = extractImageId(urlOrImageId);

    if (!imageId) {
      return { success: false, message: "Gagal menentukan image ID dari input" };
    }

    const res = await fetch(`${getApiBase()}/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    let result: any;
    try {
      result = await res.json();
    } catch {
      return {
        success: false,
        message: `Cloudflare returned non-JSON response (HTTP ${res.status})`,
      };
    }

    if (!result.success) {
      const errMsg = result.errors?.[0]?.message || "Delete failed";
      console.error(`Cloudflare delete error (HTTP ${res.status}):`, result.errors);
      return {
        success: false,
        message: `${errMsg} (status: ${res.status})`,
      };
    }

    return { success: true, message: "Image deleted successfully" };
  } catch (error: any) {
    console.error("deleteFromCloudflare error:", error);
    return { success: false, message: error.message || "Delete failed" };
  }
};
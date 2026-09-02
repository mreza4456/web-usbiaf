export interface IProduct {
  id: string;
  categories_id: string;
  image_id: string;
  name: string;
  description?: string;
  price: number;

  created_at?: string;
  updated_at?: string;
  category?: ICategory;
  images: IImage[];
  // Loaded via JOIN
  main_image?: IImage
  image_count?: number

}
// Copy dari artifact "Updated Interfaces"
export interface IImage {
  id: string
  image_url: string
  file_path?: string
  product_id?: string // NEW
  created_at?: string
}

export interface IPoster {
  id: string;
  image_url: string;
  created_at: string;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T | T[];
  count?: number;
}

export interface IUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  created_at: string;
}
// interface/order.ts

export interface IOrderItem {
  id: string;
  order_id: string;
  cart_id: string | null;
  categories_id: string;
  package_id: string;       // FK -> categories_package.id
  package_name_id: number;  // FK -> package_name.id
  category_name: string;
  package_title: string;         // nama paket, e.g. "Paket A" (dari categories_package.name)
  package_name?: IPackageName;   // relasi tier, e.g. { id, name: "Basic" | "Standard" | "Premium" }
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  updated_at: string;

  categories: ICategory;
}

export interface IOrder {
  id: string;
  user_id: string;
  code_order: string;
  discord: string;
  purpose: string;
  project_overview: string;
  references_link: string;
  platform: string[];
  usage_type: string;
  additional_notes: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface IOrderWithItems extends IOrder {
  order_items: IOrderItem[];
  users?: {
    email: string;
    full_name: string;
  };
}

export interface ICheckoutFormData {
  discord: string;
  purpose: string;
  project_overview: string;
  hasReferences: string;
  references_link: string;
  platforms: string[];
  usage_type: string;
  additional_notes: string;
}

export interface ICheckoutData {
  user_id: string;
  discord: string;
  purpose: string;
  project_overview: string;
  references_link: string;
  platform: string[];
  usage_type: string;
  additional_notes: string;
  total: number;
  cart_items: Array<{
    cart_id: string;
    categories_id: string;
    package_id: string;       // FK -> categories_package.id
    package_name_id: number;  // FK -> package_name.id
    quantity: number;
    price: number;
    total: number;
    category_name: string;
    package_title: string; // nama paket, e.g. "Paket A"
  }>;
}
export interface IVoucher {
  id: string;
  user_id: string;
  code: string;
  value: string;
  expired_at: string;
  is_used: boolean;
  milestone_order: string;
  voucher_event_id?: string; // Tambahkan ini untuk relasi ke voucher_events
  created_at: string;
applicable_categories_id?: string | null; // Tambahkan ini untuk relasi ke categories (produk) jika voucher khusus produk tertentu
  users: IUser;
  voucher_events?: IVoucherEvents; // Optional relasi
}
export interface IVoucherEvents {
  id: string;
  name: string;
  code: string;
  value: string;
  expired_at: string;
  type: string;
  is_active: boolean;
  created_at: string;

}
export interface IPackageCategories {
  id: string;             // categories_package.id
  categories_id: string;
  name: string;
  price: number;

  package_id: number;     // FK -> package_name.id
  description?: string;
  created_at?: string;

  categories?: ICategory;
  package?: IPackageName;

}
export interface IPackageName {
  id: string;
  name: string;
  created_at?: string;
}

export interface IIncludes {
  id: string;
  include_name: string;
  categories_id: string;
  created_at?: string;

  categories: ICategory
}

// interface.ts
export interface ICategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  start_price?: string;
  is_best_seller: boolean;
  is_popular: boolean;
  is_handpick: boolean;
  sales: string;

  badge_id?: number | string;
  created_at?: string;
  updated_at?: string;

  badge?: IBadge;
}

export interface IClass {
  id: number;
  class_name: string;
  created_at?: string;

}

export interface IClassService{
  id:number;
  class_id:number;
  categories_id:string;

  categories:ICategory;
  class:IClass;
}

export interface IBadge {
  id: number;
  name: string;
  created_at?: string;

}
export interface IImageCategories {
  id: number;
  image_url: string;
  sort_order?: number;
  categories_id?: string // NEW
  created_at?: string
  categories?: ICategory;
}

// ============================================
// FILE: /interface/index.ts
// Tambahkan interface cart di file existing interface
// ============================================
export interface IPackageName {
  id: string;           // bigint di DB
  name: string;  // kolom name boleh null
}

export interface ICart {
  id: string;
  user_id: string;
  categories_id: string;
  package_id: string;    // FK -> categories_package.id
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ICartItemDetail extends ICart {
  // Category info
  category_name: string;
  category_start_price: number;

  // Package info
  package_title: string;      // nama paket dari categories_package.name, e.g. "Paket A"
  package_name_id: number;    // FK -> package_name.id
  package_name: IPackageName; // relasi ke tabel package_name -> tier (Basic/Standard/Premium)
  package_price: number;
  package_description?: string;

  // Calculated
  item_total: number;
}

export interface ICartSummary {
  total_items: number;
  subtotal: number;
}

// Add to Cart Request
export interface IAddToCartRequest {
  user_id: string;
  categories_id: string;
  package_id: string;
  quantity: number;
}

// Update Cart Request
export interface IUpdateCartQuantityRequest {
  cart_id: string;
  quantity: number;
  user_id: string;
}

export interface ICartResponse {
  success: boolean;
  message?: string;
  data?: ICartItemDetail[];
}

export interface ICartSummaryResponse {
  success: boolean;
  message?: string;
  data?: ICartSummary;
}

export interface ICartActionResponse {
  success: boolean;
  message?: string;
  action?: 'added' | 'updated' | 'removed' | 'cleared';
}

export interface ICartCountResponse {
  success: boolean;
  message?: string;
  count: number;
}
export interface IMilestoneReward {
  id: string;
  milestone_step: number;
  voucher_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
// @/interface/chat.ts

export interface IChatRoom {
  id: string;
  user_id: string;
  admin_id: string | null;
  status: 'open' | 'closed';
  last_message_at: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
  admin?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
  unread_count?: number;
  last_message?: string;
}

// @/interface/index.ts
export interface IChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message: string;
  message_type: "text" | "image" | "file";
  attachment_url: string | null;
  attachment_id: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; email: string; full_name: string; avatar_url: string };
}

// Tambahkan interface berikut ke file interface.ts yang sudah ada

export interface IBlogPost {
  id: string;
  title: string;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}
export interface ITeams {
  id: string;
  name: string;
  position: string;
  skills: [];
  projects: string | number;
  descriptions?: string;
  photo_url?: string;
  created_at: string;
}

export interface IComment {
  id: string;
  user_id: string;
  order_items_id: string;  // ← Updated!
  message: string;
  rating: string;
  created_at: string;
  users?: IUser;
  order_items?: IOrderItem;
}

export interface ICampaign {
    id: number;
    created_at: string;
    title: string | null;
    description: string | null;
    views: number | null;
    click: number | null;
    categories: string | null;
    expired: string | null; // date, format YYYY-MM-DD
    date: string | null;    // date, format YYYY-MM-DD
}
// Tambahkan ini ke file interface kamu (misal: @/interface/index.ts)

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface ITicket {
    id: number;
    ticket_number: string;
    name: string;
    email: string;
    social_media: string | null;
    subject: string;
    message: string;
    status: TicketStatus;
    priority: TicketPriority;
    admin_reply: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}



// interface/mission.ts
// Tipe & interface untuk sistem Mission / Quest Event.
// Semua tipe di sini bersifat generik: menambah mission type atau event type baru
// TIDAK memerlukan perubahan struktur, cukup tambah value baru di union type + config di UI admin.
//
// RELASI PENTING (baca ini sebelum ubah-ubah):
// - config.product_id  -> merujuk ke tabel `categories` (yang sekarang berfungsi sebagai PRODUCT,
//   namanya belum diganti di database).
// - config.category_id -> merujuk ke tabel `class` (yang sekarang berfungsi sebagai CATEGORY/grup jasa).
// - reward.applicable_categories_id -> merujuk ke tabel `categories` (produk) juga, dipakai untuk
//   reward tipe ITEM (voucher 100% khusus produk tsb) atau reward VOUCHER umum (boleh null).

/** Semua event yang bisa terjadi di sistem. Tambahkan value baru di sini kalau ada aktivitas baru. */
export type MissionEventType =
    | "USER_LOGIN"
    | "ORDER_COMPLETED"
    | "PRODUCT_PURCHASED"
    | "PROFILE_COMPLETED"
    | "PAGE_VISITED";

/** Semua tipe mission yang didukung engine secara generik. */
export type MissionType =
    | "LOGIN_COUNT"          // login N kali
    | "LOGIN_STREAK_DAYS"    // login pada N hari berbeda
    | "PRODUCT_PURCHASE_COUNT" // beli produk tertentu (categories.id) N kali
    | "CATEGORY_PURCHASE_COUNT" // beli dari kategori tertentu (class.id) N kali
    | "TOTAL_SPEND"          // total nominal pembelian >= target
    | "ORDER_COMPLETED_COUNT" // menyelesaikan order N kali
    | "PROFILE_COMPLETED"    // melengkapi profile (target selalu 1)
    | "PAGE_VISIT_COUNT";    // mengunjungi halaman tertentu N kali

export type MissionStatus = "IN_PROGRESS" | "COMPLETED" | "CLAIMED" | "EXPIRED";

export type RewardType = "POINTS" | "XP" | "VOUCHER" | "COUPON" | "ITEM" | "BADGE";

export type UserRewardStatus = "PENDING_CLAIM" | "CLAIMED";

/** Grouping mission untuk kebutuhan UI/kategori masa depan (daily, weekly, dst). */
export type MissionCategory =
    | "DAILY"
    | "WEEKLY"
    | "LIMITED_TIME"
    | "ACHIEVEMENT"
    | "GENERAL";

/**
 * Kondisi/config tambahan mission, disimpan sebagai JSONB di kolom `config`.
 * Engine mencocokkan config ini terhadap `metadata` event menggunakan jsonb containment (config <@ metadata),
 * artinya: SEMUA key/value di config harus ada & sama persis di metadata event.
 * Kosongkan ({}) kalau mission tidak butuh syarat tambahan (mis. LOGIN_COUNT).
 *
 * - product_id  : uuid dari tabel `categories` (produk)
 * - category_id : id dari tabel `class` (kategori/grup jasa)
 * - page        : path halaman, mis. "/promo"
 */
export interface IMissionConfig {
    product_id?: string;
    category_id?: string;
    page?: string;
    [key: string]: string | number | boolean | undefined;
}

/** Reward master data (katalog reward yang bisa dipakai berulang oleh banyak mission). */
export interface IReward {
    id: string;
    type: RewardType;
    name: string;
    description?: string | null;
    /** Dipakai untuk POINTS/XP, mis. { amount: 100 } */
    value: Record<string, any>;
    /** Dipakai untuk type VOUCHER (nilai diskon umum, mis. "10%" atau "50000"). Null untuk type lain. */
    voucher_value?: string | null;
    /**
     * Wajib diisi untuk type ITEM (produk yang akan digratiskan lewat voucher 100%).
     * Untuk type VOUCHER dibiarkan null (voucher umum, tidak dikunci ke produk tertentu).
     * Merujuk ke categories.id (produk).
     */
    applicable_categories_id?: string | null;
    /** Masa berlaku voucher hasil klaim, dalam hari. Default 30. Dipakai untuk VOUCHER & ITEM. */
    valid_days?: number;
    /** Hasil join ke tabel categories, hanya terisi kalau applicable_categories_id di-set. */
    product?: { id: string; name: string } | null;
    created_at?: string;
}

export interface IMission {
    id: string;
    title: string;
    description?: string | null;
    mission_type: MissionType;
    /** Event yang memicu evaluasi mission ini. Di-derive otomatis dari mission_type saat create, tapi disimpan eksplisit. */
    event_type: MissionEventType;
    target: number;
    config: IMissionConfig;
    reward_id?: string | null;
    reward?: IReward | null;
    category: MissionCategory;
    start_date?: string | null;
    end_date?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface IMissionEvent {
    id: string;
    user_id: string;
    event_type: MissionEventType;
    reference_id?: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

export interface IUserMission {
    id: string;
    user_id: string;
    mission_id: string;
    progress: number;
    /** Data bantu progress, mis. { days: ["2026-01-01", "2026-01-02"] } untuk LOGIN_STREAK_DAYS */
    progress_meta: Record<string, any>;
    status: MissionStatus;
    completed_at?: string | null;
    claimed_at?: string | null;
    created_at: string;
    updated_at: string;
}

/** Bentuk gabungan mission + progress user, dipakai di halaman user. */
export interface IMissionWithProgress extends IMission {
    user_mission?: IUserMission | null;
    /** progress ternormalisasi untuk UI, 0 kalau user belum mulai */
    progress: number;
    status: MissionStatus | "NOT_STARTED";
}

export interface IUserReward {
    id: string;
    user_id: string;
    mission_id: string;
    user_mission_id: string;
    reward_id: string;
    reward?: IReward | null;
    mission?: Pick<IMission, "id" | "title"> | null;
    status: UserRewardStatus;
    granted_at: string;
    claimed_at?: string | null;
}

/** Hasil pemanggilan RPC fn_claim_reward — kalau reward berupa VOUCHER/ITEM, voucher_id & voucher_code terisi. */
export interface IClaimRewardResult {
    user_reward_id: string;
    reward_id: string;
    reward_type: RewardType;
    voucher_id: string | null;
    voucher_code: string | null;
    status: "CLAIMED";
}

/** Statistik dashboard admin untuk satu mission. */
export interface IMissionStats {
    mission_id: string;
    total_participants: number;
    total_completed: number;
    total_claimed: number;
}

/** Payload untuk create/update mission dari form admin. */
export interface IMissionFormInput {
    title: string;
    description?: string;
    mission_type: MissionType;
    event_type: MissionEventType;
    target: number;
    config: IMissionConfig;
    reward_id?: string | null;
    category: MissionCategory;
    start_date?: string | null;
    end_date?: string | null;
    is_active: boolean;
}

/** Payload untuk create/update reward dari form admin. */
export interface IRewardFormInput {
    type: RewardType;
    name: string;
    description?: string;
    /** Dipakai untuk POINTS/XP: { amount: number } */
    value?: Record<string, any>;
    /** WAJIB untuk type VOUCHER, mis. "10%" atau "50000" */
    voucher_value?: string | null;
    /** WAJIB untuk type ITEM — produk (categories.id) yang jadi gratis */
    applicable_categories_id?: string | null;
    valid_days?: number;
}

/** Mapping default mission_type -> event_type. Dipakai UI admin supaya event ter-derive otomatis. */
export const MISSION_TYPE_EVENT_MAP: Record<MissionType, MissionEventType> = {
    LOGIN_COUNT: "USER_LOGIN",
    LOGIN_STREAK_DAYS: "USER_LOGIN",
    PRODUCT_PURCHASE_COUNT: "PRODUCT_PURCHASED",
    CATEGORY_PURCHASE_COUNT: "PRODUCT_PURCHASED",
    TOTAL_SPEND: "ORDER_COMPLETED",
    ORDER_COMPLETED_COUNT: "ORDER_COMPLETED",
    PROFILE_COMPLETED: "PROFILE_COMPLETED",
    PAGE_VISIT_COUNT: "PAGE_VISITED",
};

/** Label ramah-manusia untuk tiap mission type, dipakai di admin dropdown & user page. */
export const MISSION_TYPE_LABEL: Record<MissionType, string> = {
    LOGIN_COUNT: "Log in multiple times",
    LOGIN_STREAK_DAYS: "Log in on different days",
    PRODUCT_PURCHASE_COUNT: "Purchase a specific product",
    CATEGORY_PURCHASE_COUNT: "Purchase from a specific category",
    TOTAL_SPEND: "Reach a total spending amount",
    ORDER_COMPLETED_COUNT: "Complete orders",
    PROFILE_COMPLETED: "Complete your profile",
    PAGE_VISIT_COUNT: "Visit a specific page",
};

/** Field config yang relevan per mission_type, dipakai untuk render form dinamis di admin. */
export const MISSION_TYPE_CONFIG_FIELDS: Record<MissionType, (keyof IMissionConfig)[]> = {
    LOGIN_COUNT: [],
    LOGIN_STREAK_DAYS: [],
    PRODUCT_PURCHASE_COUNT: ["product_id"],
    CATEGORY_PURCHASE_COUNT: ["category_id"],
    TOTAL_SPEND: [],
    ORDER_COMPLETED_COUNT: [],
    PROFILE_COMPLETED: [],
    PAGE_VISIT_COUNT: ["page"],
};

export const REWARD_TYPE_LABEL: Record<RewardType, string> = {
    POINTS: "Points",
    XP: "XP",
    VOUCHER: "Voucher",
    COUPON: "Coupon",
    ITEM: "Item (Free via Voucher 100%)",
    BADGE: "Badge",
};


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
  package_id: string;
  category_name: string;
  package_name: string;
  package_type: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  updated_at: string;
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
    package_id: string;
    quantity: number;
    price: number;
    total: number;
    category_name: string;
    package_name: string;
    package_type: string;
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
  id: string;
  categories_id: string;
  name: string;
  price: number;
  package: string;
  description?: string;
  created_at?: string;

  categories?: ICategory;

}

// interface.ts
export interface ICategory {
  id: string;
  name: string;
  description?: string;

  start_price?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IImageCategories {
  id: number;
  image_url: string;

  categories_id?: string // NEW
  created_at?: string
  categories?: ICategory;
}

// ============================================
// FILE: /interface/index.ts
// Tambahkan interface cart di file existing interface
// ============================================

// Cart Item Interface
export interface ICart {
  id: string;
  user_id: string;
  categories_id: string;
  package_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Cart Item dengan detail lengkap (untuk display)
export interface ICartItemDetail extends ICart {
  // Category info
  category_name: string;
  category_start_price: number;
  
  // Package info
  package_name: string;
  package_type: string; // 'Basic', 'Pro', 'Premium'
  package_price: number;
  package_description?: string;
  
  // Calculated
  item_total: number; // package_price * quantity
}

// Cart Summary
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

export interface IChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
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
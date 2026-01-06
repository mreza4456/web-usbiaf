

// interface.ts
export interface ICategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IProduct {
  id: string;
  category_id: string;
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
  created_at:string;
}

export interface IOrder {

  id: string;
  discord: string;
  user_id: string;
  categories_id: string;
  purpose: string;
  project_overview: string;
  references_link: string;
  platform: string[];
  usage_type: string;
  additional_notes: string;
  status: string;
  created_at: string;

  users:IUser;
  categories:ICategory;

}
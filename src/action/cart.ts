'use server';

import { supabase } from '@/config/supabase';
import { revalidatePath } from 'next/cache';
import type {
  ICartItemDetail,
  ICartSummary,
  IAddToCartRequest,
  ICartResponse,
  ICartActionResponse,
  ICartSummaryResponse,
  ICartCountResponse,
} from '@/interface';

// ============================================
// GET CART ITEMS dengan detail lengkap (+ brief)
// ============================================
export async function getCartItems(userId: string): Promise<ICartResponse> {
  try {
    const result = await supabase
      .from('carts')
      .select(`
    id,
    quantity,
    created_at,
    updated_at,
    categories_id,
    package_id,
    discord,
    purpose,
    project_overview,
    has_references,
    references_link,
    platform,
    usage_type,
    additional_notes,
    categories (
      id,
      name,
      start_price,
      images:image_categories (
        id,
        image_url,
        sort_order
      )
    ),
    categories_package (
      id,
      name,
      price,
      description,
      package_name (
        id,
        name
      )
    )
  `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) {
      console.error('Error fetching cart:', error);
      return { success: false, message: error.message, data: [] };
    }

    const rows = data || [];
    const cartItems: ICartItemDetail[] = rows.map((item: any) => {
      const sortedImages = (item.categories?.images || []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );

      return {
        id: item.id,
        user_id: userId,
        categories_id: item.categories_id,
        package_id: item.package_id,
        quantity: item.quantity,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category_name: item.categories?.name,
        category_start_price: item.categories?.start_price,
        category_image: sortedImages[0]?.image_url ?? null,
        package_title: item.categories_package?.name,
        package_name_id: item.categories_package?.package_name?.id,
        package_name: item.categories_package?.package_name,
        package_price: item.categories_package?.price,
        package_description: item.categories_package?.description,
        item_total: (item.categories_package?.price || 0) * item.quantity,
        // ── brief ──
        discord: item.discord,
        purpose: item.purpose,
        project_overview: item.project_overview,
        has_references: item.has_references,
        references_link: item.references_link,
        platform: item.platform ?? [],
        usage_type: item.usage_type,
        additional_notes: item.additional_notes,
      };
    });

    return { success: true, data: cartItems };
  } catch (error: any) {
    console.error('Error in getCartItems:', error);
    return { success: false, message: error.message, data: [] };
  }
}

// ============================================
// ADD TO CART — tiap request punya brief sendiri, selalu insert baris baru
// ============================================
export async function addToCart(payload: IAddToCartRequest): Promise<ICartActionResponse> {
  const {
    user_id, categories_id, package_id, quantity,
    discord, purpose, project_overview, has_references,
    references_link, platform, usage_type, additional_notes,
  } = payload;

  if (!discord?.trim() || !purpose?.trim() || !project_overview?.trim() || !usage_type) {
    return { success: false, message: 'Please complete the request details' };
  }
  if (!platform?.length) {
    return { success: false, message: 'Select at least one platform' };
  }
  if (has_references === 'yes' && !references_link?.trim()) {
    return { success: false, message: 'Add your reference link' };
  }

  const { error } = await supabase.from('carts').insert([{
    user_id,
    categories_id,
    package_id,
    quantity,
    discord: discord.trim(),
    purpose: purpose.trim(),
    project_overview: project_overview.trim(),
    has_references,
    references_link: has_references === 'yes' ? references_link?.trim() : null,
    platform,
    usage_type,
    additional_notes: additional_notes?.trim() || null,
  }]);

  if (error) return { success: false, message: error.message };

  revalidatePath('/cart');
  return { success: true, action: 'added', message: 'Added to cart' };
}

// ============================================
// UPDATE QUANTITY
// ============================================
export async function updateCartQuantity(cartId: string, quantity: number, userId: string): Promise<ICartActionResponse> {
  try {
    if (quantity < 1) {
      return { success: false, message: 'Quantity must be at least 1' };
    }

    const { error } = await supabase
      .from('carts')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartId)
      .eq('user_id', userId);

    if (error) return { success: false, message: error.message };

    revalidatePath('/cart');
    return { success: true, message: 'Quantity updated', action: 'updated' };
  } catch (error: any) {
    console.error('Error in updateCartQuantity:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// REMOVE FROM CART
// ============================================
export async function removeFromCart(cartId: string, userId: string): Promise<ICartActionResponse> {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('id', cartId)
      .eq('user_id', userId);

    if (error) return { success: false, message: error.message };

    revalidatePath('/cart');
    return { success: true, message: 'Item removed from cart', action: 'removed' };
  } catch (error: any) {
    console.error('Error in removeFromCart:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET CART SUMMARY (total items & subtotal)
// ============================================
export async function getCartSummary(userId: string): Promise<ICartSummaryResponse> {
  try {
    const result = await supabase
      .from('carts')
      .select(`
        quantity,
        categories_package (
          price
        )
      `)
      .eq('user_id', userId);

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) {
      return { success: false, message: error.message, data: { total_items: 0, subtotal: 0 } };
    }

    const rows = data || [];
    const summary: ICartSummary = {
      total_items: rows.reduce((sum, item: any) => sum + (item.quantity || 0), 0),
      subtotal: rows.reduce((sum: number, item: any) => {
        const price = item.categories_package?.price || 0;
        return sum + (price * (item.quantity || 0));
      }, 0),
    };

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('Error in getCartSummary:', error);
    return { success: false, message: error.message, data: { total_items: 0, subtotal: 0 } };
  }
}

// ============================================
// CLEAR CART
// ============================================
export async function clearCart(userId: string): Promise<ICartActionResponse> {
  try {
    const { error } = await supabase.from('carts').delete().eq('user_id', userId);

    if (error) return { success: false, message: error.message };

    revalidatePath('/cart');
    return { success: true, message: 'Cart cleared', action: 'cleared' };
  } catch (error: any) {
    console.error('Error in clearCart:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET CART COUNT (badge navbar)
// ============================================
export async function getCartCount(userId: string): Promise<ICartCountResponse> {
  try {
    const result = await supabase.from('carts').select('quantity').eq('user_id', userId);

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) return { success: false, message: error.message, count: 0 };

    const rows = data || [];
    const count = rows.reduce((sum, item: any) => sum + (item.quantity || 0), 0);
    return { success: true, count };
  } catch (error: any) {
    console.error('Error in getCartCount:', error);
    return { success: false, message: error.message, count: 0 };
  }
}

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
// GET CART ITEMS dengan detail lengkap
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
        categories (
          id,
          name,
          start_price
        ),
        categories_package (
          id,
          name,
          package,
          price,
          description
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

    // Transform data untuk kemudahan akses
    const rows = data || [];
    const cartItems: ICartItemDetail[] = rows.map((item: any) => ({
      id: item.id,
      user_id: userId,
      categories_id: item.categories_id,
      package_id: item.package_id,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      category_name: item.categories?.name,
      category_start_price: item.categories?.start_price,
      package_name: item.categories_package?.name,
      package_type: item.categories_package?.package,
      package_price: item.categories_package?.price,
      package_description: item.categories_package?.description,
      item_total: (item.categories_package?.price || 0) * item.quantity
    }));

    return { success: true, data: cartItems };
  } catch (error: any) {
    console.error('Error in getCartItems:', error);
    return { success: false, message: error.message, data: [] };
  }
}

// ============================================
// ADD TO CART (atau update quantity jika sudah ada)
// ============================================
export async function addToCart(payload: IAddToCartRequest): Promise<ICartActionResponse> {
  const { user_id, categories_id, package_id, quantity } = payload;

  const { data: existing } = await supabase
    .from('carts')
    .select('id, quantity')
    .eq('user_id', user_id)
    .eq('categories_id', categories_id)
    .eq('package_id', package_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('carts')
      .update({
        quantity: existing.quantity + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) return { success: false, message: error.message };

    revalidatePath('/cart');
    return { success: true, action: 'updated', message: 'Cart updated' };
  }

  const { error } = await supabase.from('carts').insert([{
    user_id,
    categories_id,
    package_id,
    quantity,
     // JSONB FIX
    // JSONB FIX
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
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId)
      .eq('user_id', userId); // Security: pastikan user hanya update cart sendiri

    if (error) {
      return { success: false, message: error.message };
    }

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
      .eq('user_id', userId); // Security: pastikan user hanya hapus cart sendiri

    if (error) {
      return { success: false, message: error.message };
    }

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
      return { 
        success: false, 
        message: error.message, 
        data: { total_items: 0, subtotal: 0 } 
      };
    }

    const rows = data || [];
    const summary: ICartSummary = {
      total_items: rows.reduce((sum, item: any) => sum + (item.quantity || 0), 0),
      subtotal: rows.reduce((sum: number, item: any) => {
        const price = item.categories_package?.price || 0;
        return sum + (price * (item.quantity || 0));
      }, 0)
    };

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('Error in getCartSummary:', error);
    return { 
      success: false, 
      message: error.message, 
      data: { total_items: 0, subtotal: 0 } 
    };
  }
}

// ============================================
// CLEAR CART (setelah checkout)
// ============================================
export async function clearCart(userId: string): Promise<ICartActionResponse> {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/cart');
    return { success: true, message: 'Cart cleared', action: 'cleared' };
  } catch (error: any) {
    console.error('Error in clearCart:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET CART COUNT (untuk badge di navbar)
// ============================================
export async function getCartCount(userId: string): Promise<ICartCountResponse> {
  try {
    const result = await supabase
      .from('carts')
      .select('quantity')
      .eq('user_id', userId);

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) {
      return { success: false, message: error.message, count: 0 };
    }

    const rows = data || [];
    const count = rows.reduce((sum, item: any) => sum + (item.quantity || 0), 0);
    return { success: true, count };
  } catch (error: any) {
    console.error('Error in getCartCount:', error);
    return { success: false, message: error.message, count: 0 };
  }
}

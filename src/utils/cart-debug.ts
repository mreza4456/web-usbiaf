// utils/cart-debug.ts
// Utility functions untuk debugging cart clearing

import { supabase } from '@/config/supabase';

/**
 * Check if user's cart is empty
 */
export async function isCartEmpty(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking cart:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error in isCartEmpty:', error);
    return false;
  }
}

/**
 * Get cart item count for debugging
 */
export async function getCartItemCount(userId: string): Promise<number> {
  try {
    const { data, error, count } = await supabase
      .from('carts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting cart items:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getCartItemCount:', error);
    return 0;
  }
}

/**
 * Verify cart items were deleted after checkout
 */
export async function verifyCartCleared(
  userId: string,
  cartIds: string[]
): Promise<{ cleared: boolean; remainingIds: string[] }> {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .in('id', cartIds);

    if (error) {
      console.error('Error verifying cart clear:', error);
      return { cleared: false, remainingIds: [] };
    }

    const remainingIds = data?.map(item => item.id) || [];
    
    return {
      cleared: remainingIds.length === 0,
      remainingIds
    };
  } catch (error) {
    console.error('Error in verifyCartCleared:', error);
    return { cleared: false, remainingIds: [] };
  }
}

/**
 * Log checkout process for debugging
 */
export function logCheckoutProcess(
  stage: string,
  data: any,
  success: boolean = true
) {
  const timestamp = new Date().toISOString();
  const status = success ? '✅' : '❌';
  
  console.log(`[${timestamp}] ${status} CHECKOUT - ${stage}:`, data);
}

/**
 * Comprehensive checkout debug info
 */
export async function getCheckoutDebugInfo(userId: string) {
  const cartCount = await getCartItemCount(userId);
  const isEmpty = await isCartEmpty(userId);
  
  const debugInfo = {
    userId,
    timestamp: new Date().toISOString(),
    cartItemCount: cartCount,
    cartIsEmpty: isEmpty,
    status: isEmpty ? 'CART_CLEARED' : 'ITEMS_REMAINING'
  };
  
  console.log('🔍 Checkout Debug Info:', debugInfo);
  return debugInfo;
}
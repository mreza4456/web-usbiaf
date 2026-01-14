
'use server';

import { supabase } from '@/config/supabase';
import { revalidatePath } from 'next/cache';

interface CheckoutData {
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

// ============================================
// CHECKOUT - Using order_items table
// ============================================
export async function processCheckout(checkoutData: CheckoutData) {
  try {
    const { cart_items, ...orderData } = checkoutData;

    // 1. Verify cart items exist and belong to user
    const cartIds = cart_items.map(item => item.cart_id);
    const { data: existingCarts, error: verifyError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', checkoutData.user_id)
      .in('id', cartIds);

    if (verifyError) {
      console.error('Cart verification error:', verifyError);
      return {
        success: false,
        message: 'Failed to verify cart items'
      };
    }

    if (!existingCarts || existingCarts.length !== cartIds.length) {
      return {
        success: false,
        message: 'Some cart items are no longer available or do not belong to you'
      };
    }

    // 2. Generate order reference
    const orderRef = `ORD-${Date.now()}-${checkoutData.user_id.substring(0, 8)}`;

    // 3. Create main order (without items in additional_notes)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.user_id,
        code_order: orderRef,
        discord: orderData.discord,
        purpose: orderData.purpose,
        project_overview: orderData.project_overview,
        references_link: orderData.references_link,
        platform: orderData.platform,
        usage_type: orderData.usage_type,
        additional_notes: orderData.additional_notes, // Clean notes only
        total: orderData.total,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return {
        success: false,
        message: `Failed to create order: ${orderError.message}`
      };
    }

    // 4. Create order items in separate table
    const orderItems = cart_items.map(item => ({
      order_id: order.id,
      cart_id: item.cart_id,
      categories_id: item.categories_id,
      package_id: item.package_id,
      category_name: item.category_name,
      package_name: item.package_name,
      package_type: item.package_type,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      
      // ROLLBACK: Delete the order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      
      return {
        success: false,
        message: `Failed to create order items: ${itemsError.message}`
      };
    }

    // 5. ✅ DELETE cart items after successful order creation
    const { error: deleteError } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', checkoutData.user_id) // Extra safety: only delete user's items
      .in('id', cartIds);

    if (deleteError) {
      console.error('Cart deletion error:', deleteError);
      // Log but don't fail - order is already created successfully
      // User can manually remove cart items if needed
      console.warn(`Order ${order.id} created but failed to clear cart. User may see duplicate items.`);
    }

    // 6. Revalidate paths to update UI
    revalidatePath('/cart');
    revalidatePath('/orders');
    revalidatePath('/checkout');

    return {
      success: true,
      message: 'Order placed successfully! Your cart has been cleared.',
      order_id: order.id,
      order_ref: orderRef,
      cleared_items: cartIds.length
    };

  } catch (error: any) {
    console.error('Checkout error:', error);
    return {
      success: false,
      message: error.message || 'Failed to process checkout'
    };
  }
}

// ============================================
// CLEAR CART MANUALLY (if needed)
// ============================================
export async function clearUserCart(userId: string) {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/cart');
    
    return {
      success: true,
      message: 'Cart cleared successfully'
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
}

// ============================================
// GET ORDER WITH ITEMS
// ============================================
export async function getOrderWithItems(orderId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (
          email,
          full_name
        ),
        order_items (
          id,
          quantity,
          price,
          total,
          category_name,
          package_name,
          package_type,
          categories_id,
          package_id
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }

    return {
      success: true,
      data
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}

// ============================================
// GET ALL USER ORDERS WITH ITEMS
// ============================================
export async function getUserOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          total,
          category_name,
          package_name,
          package_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

// ============================================
// GET ORDER ITEMS BY ORDER ID
// ============================================
export async function getOrderItems(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

export async function getAllOrdersWithItems() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      users (email, full_name),
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) return { success: false, message: error.message, data: [] };
  return { success: true, data };
}

export async function updateOrder(orderId: string, updateData: { status: string }) {
  try {
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(updateData.status)) {
      return {
        success: false,
        message: 'Invalid status value'
      };
    }

    // Check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (checkError || !existingOrder) {
      return {
        success: false,
        message: 'Order not found'
      };
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: updateData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Update order error:', error);
      return {
        success: false,
        message: error.message
      };
    }

    // Revalidate paths
    revalidatePath('/admin/orders');
    revalidatePath('/orders');

    return {
      success: true,
      message: `Order status updated to ${updateData.status}`,
      data
    };

  } catch (error: any) {
    console.error('Update order exception:', error);
    return {
      success: false,
      message: error.message || 'Failed to update order'
    };
  }
}

// ============================================
// DELETE ORDER (with CASCADE to order_items)
// ============================================
export async function deleteOrder(orderId: string) {
  try {
    // 1. Check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, code_order, status')
      .eq('id', orderId)
      .single();

    if (checkError || !existingOrder) {
      return {
        success: false,
        message: 'Order not found'
      };
    }

    const { error: itemsDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsDeleteError) {
      console.error('Delete order items error:', itemsDeleteError);
      return {
        success: false,
        message: `Failed to delete order items: ${itemsDeleteError.message}`
      };
    }

    // 4. Delete the order
    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderDeleteError) {
      console.error('Delete order error:', orderDeleteError);
      return {
        success: false,
        message: `Failed to delete order: ${orderDeleteError.message}`
      };
    }

    // 5. Revalidate paths
    revalidatePath('/admin/orders');
    revalidatePath('/orders');

    return {
      success: true,
      message: `Order ${existingOrder.code_order} deleted successfully`
    };

  } catch (error: any) {
    console.error('Delete order exception:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete order'
    };
  }
}

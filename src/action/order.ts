'use server';

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
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
  voucher_id?: string;
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
export async function processCheckout(checkoutData: CheckoutData) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    console.log('🔍 CHECKOUT DEBUG - Received data:', {
      voucher_id: checkoutData.voucher_id,
      user_id: checkoutData.user_id,
      total: checkoutData.total,
      cart_items_count: checkoutData.cart_items?.length
    });

    const { cart_items, voucher_id, ...orderData } = checkoutData;

    console.log('🔍 CHECKOUT DEBUG - After destructuring:', {
      voucher_id,
      orderData_has_voucher: 'voucher_id' in orderData
    });

    // 1. Verify cart items exist and belong to user
    const cartIds = cart_items.map(item => item.cart_id);
    const { data: existingCarts, error: verifyError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', checkoutData.user_id)
      .in('id', cartIds);

    if (verifyError) {
      console.error('❌ Cart verification error:', verifyError);
      return {
        success: false,
        message: 'Failed to verify cart items'
      };
    }

    if (!existingCarts || existingCarts.length !== cartIds.length) {
      console.error('❌ Cart items mismatch:', {
        expected: cartIds.length,
        found: existingCarts?.length
      });
      return {
        success: false,
        message: 'Some cart items are no longer available or do not belong to you'
      };
    }

    // ✅ 2. Verify and check voucher if provided
    if (voucher_id) {
      console.log('🎫 VOUCHER DEBUG - Checking voucher:', voucher_id);

      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('id, is_used, expired_at, user_id')
        .eq('id', voucher_id)
        .single();

      console.log('🎫 VOUCHER DEBUG - Query result:', {
        found: !!voucher,
        error: voucherError,
        voucher_data: voucher
      });

      if (voucherError || !voucher) {
        console.error('❌ Voucher not found:', voucherError);
        return {
          success: false,
          message: 'Voucher not found'
        };
      }

      // Check if voucher belongs to user
      if (voucher.user_id !== checkoutData.user_id) {
        console.error('❌ Voucher ownership mismatch:', {
          voucher_user_id: voucher.user_id,
          current_user_id: checkoutData.user_id
        });
        return {
          success: false,
          message: 'This voucher does not belong to you'
        };
      }

      // Check if voucher already used
      if (voucher.is_used) {
        console.error('❌ Voucher already used');
        return {
          success: false,
          message: 'Voucher has already been used'
        };
      }

      // Check if voucher expired
      const now = new Date();
      const expiredDate = new Date(voucher.expired_at);
      if (now > expiredDate) {
        console.error('❌ Voucher expired:', {
          now: now.toISOString(),
          expired_at: expiredDate.toISOString()
        });
        return {
          success: false,
          message: 'Voucher has expired'
        };
      }

      console.log('✅ Voucher validation passed');
    } else {
      console.log('ℹ️ No voucher provided');
    }

    // 3. Generate order reference
    const orderRef = `ORD-${Date.now()}-${checkoutData.user_id.substring(0, 8)}`;

    // 4. Create main order (with voucher_id if provided)
    const orderPayload = {
      user_id: orderData.user_id,
      code_order: orderRef,
      discord: orderData.discord,
      purpose: orderData.purpose,
      project_overview: orderData.project_overview,
      references_link: orderData.references_link,
      platform: orderData.platform,
      usage_type: orderData.usage_type,
      additional_notes: orderData.additional_notes,
      total: orderData.total,
      status: 'pending' as const,
      voucher_id: voucher_id || null
    };

    console.log('📦 ORDER DEBUG - Creating order with payload:', {
      ...orderPayload,
      voucher_id: orderPayload.voucher_id,
      has_voucher: !!orderPayload.voucher_id
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    console.log('📦 ORDER DEBUG - Insert result:', {
      success: !!order,
      error: orderError,
      order_id: order?.id,
      order_voucher_id: order?.voucher_id
    });

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      return {
        success: false,
        message: `Failed to create order: ${orderError.message}`
      };
    }

    // 5. Create order items in separate table
    const orderItems = cart_items.map(item => ({
      order_id: order.id,
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

    // ✅ 6. Mark voucher as used (if voucher was applied)
    if (voucher_id) {
      console.log('🎫 VOUCHER DEBUG - Marking voucher as used:', voucher_id);

      const { error: voucherUpdateError } = await supabase
        .from('vouchers')
        .update({
          is_used: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', voucher_id);

      if (voucherUpdateError) {
        console.error('❌ Voucher update error:', voucherUpdateError);
        console.warn(`Order ${order.id} created but failed to mark voucher as used.`);
      } else {
        console.log('✅ Voucher marked as used successfully');
      }
    }

    // 7. DELETE cart items after successful order creation
    const { error: deleteError } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', checkoutData.user_id)
      .in('id', cartIds);

    if (deleteError) {
      console.error('Cart deletion error:', deleteError);
      console.warn(`Order ${order.id} created but failed to clear cart.`);
    }

    // 8. Revalidate paths to update UI
    revalidatePath('/cart');
    revalidatePath('/orders');
    revalidatePath('/checkout');
    revalidatePath('/vouchers');

    console.log('✅ CHECKOUT SUCCESS:', {
      order_id: order.id,
      order_ref: orderRef,
      voucher_applied: !!voucher_id,
      cleared_items: cartIds.length
    });

    return {
      success: true,
      message: 'Order placed successfully! Your cart has been cleared.',
      order_id: order.id,
      order_ref: orderRef,
      cleared_items: cartIds.length,
      voucher_applied: !!voucher_id
    };

  } catch (error: any) {
    console.error('❌ CHECKOUT EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to process checkout'
    };
  }
}

// ============================================
export async function clearUserCart(userId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
export async function getOrderWithItems(orderId: string, userId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
        ),
        vouchers (
          id,
          code,
          value,
          is_used
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
export async function getUserOrders(userId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
        ),
        vouchers (
          id,
          code,
          value
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
export async function getOrderItems(orderId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa melihat semua order.", data: [] };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (email, full_name),
        order_items (*),
        vouchers (id, code, value, is_used)
      `)
      .order('created_at', { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message, data: [] };
  }
}
// Untuk USER - update order details
export async function updateOrder(
  orderId: string,
  updateData: {
    discord?: string;
    purpose: string;
    project_overview: string;
    references_link?: string;
    platform: string[];
    usage_type: string;
    additional_notes?: string;
  }
) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Check if order exists and belongs to user
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .eq('user_id', user.id) // hanya order milik user
      .single();

    if (checkError || !existingOrder) {
      return {
        success: false,
        message: 'Order not found'
      };
    }

    // Cek status - tidak bisa edit jika completed/cancelled
    if (existingOrder.status === 'completed' || existingOrder.status === 'cancelled') {
      return {
        success: false,
        message: 'Cannot edit completed or cancelled orders'
      };
    }

    // Update order details (TANPA status)
    const { data, error } = await supabase
      .from('orders')
      .update({
        discord: updateData.discord,
        purpose: updateData.purpose,
        project_overview: updateData.project_overview,
        references_link: updateData.references_link,
        platform: updateData.platform,
        usage_type: updateData.usage_type,
        additional_notes: updateData.additional_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user.id) // double check ownership
      .select()
      .single();

    if (error) {
      console.error('Update order error:', error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/myorder');
    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Order updated successfully',
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

// Untuk ADMIN - update order status
export async function updateOrderStatus(
  orderId: string,
  updateData: { status: string }
) {
  try {
    const user = await getAuthenticatedUser();

    // TODO: Check if user is admin
    // if (!user.is_admin) { return { success: false, message: 'Unauthorized' }; }

    const supabase = await createClient();

    // Validate dan normalize status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    const normalizedStatus = updateData.status?.trim().toLowerCase();

    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
      return {
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
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
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/orders');
    revalidatePath('/myorder');

    return {
      success: true,
      message: `Order status updated to ${normalizedStatus}`,
      data
    };

  } catch (error: any) {
    console.error('Update order status exception:', error);
    return {
      success: false,
      message: error.message || 'Failed to update order status'
    };
  }
}

// ============================================
export async function deleteOrder(orderId: string) {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus order." };
    }

    const supabase = await createClient();

    // 1. Check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, code_order, status, voucher_id')
      .eq('id', orderId)
      .single();

    if (checkError || !existingOrder) {
      return {
        success: false,
        message: 'Order not found'
      };
    }

    // ✅ 2. If order had a voucher, reset it back to unused
    if (existingOrder.voucher_id) {
      const { error: voucherResetError } = await supabase
        .from('vouchers')
        .update({
          is_used: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.voucher_id);

      if (voucherResetError) {
        console.error('Voucher reset error:', voucherResetError);
        // Continue anyway, just log the error
      }
    }

    // 3. Delete order items first
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
    revalidatePath('/vouchers');

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
"use server";
import { supabase } from '@/config/supabase';
import { IVoucher } from "@/interface";

// Generate voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'STAMP-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get voucher value based on milestone (3, 6, 9, 12, 15, 18, etc.)
function getVoucherValue(completedOrders: number): string {
  // Calculate which cycle we're in (0-indexed)
  const cyclePosition = ((completedOrders - 1) % 12) + 1;
  
  // Determine voucher percentage based on position in cycle
  if (cyclePosition === 3 || cyclePosition === 6 || cyclePosition === 9) {
    return '5%';
  } else if (cyclePosition === 12) {
    return '15%';
  }
  
  return '5%'; // Default
}

// Check if user already has voucher for this milestone
export async function checkVoucherExists(userId: string, milestone: number) {

  
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('user_id', userId)
    .eq('milestone_order', milestone)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking voucher:', error);
    return { success: false, exists: false };
  }
  
  return { success: true, exists: !!data };
}

// Create voucher
export async function createVoucher(userId: string, completedOrders: number) {

  
  // Check if voucher already exists for this milestone
  const existCheck = await checkVoucherExists(userId, completedOrders);
  if (existCheck.exists) {
    console.log(`Voucher already exists for milestone ${completedOrders}`);
    return { success: false, message: 'Voucher already exists' };
  }
  
  const voucherCode = generateVoucherCode();
  const voucherValue = getVoucherValue(completedOrders);
  
  // Set expiration to 3 months from now
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 3);
  
  const { data, error } = await supabase
    .from('vouchers')
    .insert({
      user_id: userId,
      code: voucherCode,
      value: voucherValue,
      expired_at: expirationDate.toISOString(),
      is_used: false,
      milestone_order: completedOrders
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating voucher:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

// FIXED: Changed 'message' to 'error' for consistency
export async function getUserVouchers(userId: string) {
  console.log("Getting vouchers for user:", userId);
  
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message, data: [] };
    }

    console.log("Vouchers fetched:", data);
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return { success: false, error: err.message, data: [] };
  }
}

// Use voucher
export async function useVoucher(voucherId: string) {

  
  const { data, error } = await supabase
    .from('vouchers')
    .update({ is_used: true })
    .eq('id', voucherId)
    .select()
    .single();
  
  if (error) {
    console.error('Error using voucher:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

// Check and generate voucher after order completion
export async function checkAndGenerateVoucher(userId: string, completedOrdersCount: number) {
  // Check if completed orders is a multiple of 3
  if (completedOrdersCount % 3 !== 0) {
    return { success: false, message: 'Not a milestone yet' };
  }
  
  // Check if voucher already exists for this milestone
  const existCheck = await checkVoucherExists(userId, completedOrdersCount);
  if (existCheck.exists) {
    return { success: false, message: 'Voucher already generated' };
  }
  
  // Create voucher
  return await createVoucher(userId, completedOrdersCount);
}
export const claimVoucherEvent = async (userId: string, voucherEventId: string) => {
  try {
    // 1. Check apakah voucher event masih aktif
    const { data: voucherEvent, error: eventError } = await supabase
      .from("voucher_events")
      .select("*")
      .eq("id", voucherEventId)
      .eq("is_active", true)
      .single();

    if (eventError || !voucherEvent) {
      return { 
        success: false, 
        message: "Voucher event tidak ditemukan atau sudah tidak aktif" 
      };
    }

    // 2. Check apakah voucher event sudah expired
    if (new Date(voucherEvent.expired_at) < new Date()) {
      return { 
        success: false, 
        message: "Voucher event sudah kadaluarsa" 
      };
    }

    // 3. Check apakah user sudah pernah claim voucher ini
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from("vouchers")
      .select("id")
      .eq("user_id", userId)
      .eq("voucher_event_id", voucherEventId)
      .single();

    if (existingClaim) {
      return { 
        success: false, 
        message: "Anda sudah pernah mengambil voucher ini" 
      };
    }

    // 4. Generate unique code untuk user ini
    const uniqueCode = `${voucherEvent.code}-${Date.now().toString(36).toUpperCase()}`;

    // 5. Insert voucher baru untuk user
    const { data: newVoucher, error: insertError } = await supabase
      .from("vouchers")
      .insert([{
        user_id: userId,
        code: uniqueCode,
        value: voucherEvent.value,
        expired_at: voucherEvent.expired_at,
        is_used: false,
        milestone_order: 0, // Atau bisa disesuaikan
        voucher_event_id: voucherEventId
      }])
      .select()
      .single();

    if (insertError) {
      return { 
        success: false, 
        message: insertError.message 
      };
    }

    return { 
      success: true, 
      message: "Voucher berhasil diklaim!", 
      data: newVoucher as IVoucher 
    };

  } catch (error) {
    return { 
      success: false, 
      message: "Terjadi kesalahan saat mengklaim voucher" 
    };
  }
};

// Fungsi untuk check apakah user sudah claim voucher event tertentu
export const checkVoucherEventClaimed = async (userId: string, voucherEventId: string) => {
  const { data, error } = await supabase
    .from("vouchers")
    .select("id")
    .eq("user_id", userId)
    .eq("voucher_event_id", voucherEventId)
    .single();

  return {
    claimed: !!data,
    error: error?.message
  };
};
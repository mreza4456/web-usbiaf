"use server";

import { createClient, getAuthenticatedUser, isAdmin } from '@/config/supabase-server';
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

// Get voucher value from database based on milestone
async function getVoucherValue(completedOrders: number): Promise<string> {
  const supabase = await createClient();
  const cyclePosition = ((completedOrders - 1) % 12) + 1;
  
  const { data, error } = await supabase
    .from('milestone_rewards')
    .select('voucher_value')
    .eq('milestone_step', cyclePosition)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    console.error('Error fetching milestone reward:', error);
    return '5%'; // Default fallback
  }
  
  return data.voucher_value;
}

// Check if user already has voucher for this milestone
export async function checkVoucherExists(userId: string, milestone: number) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
  } catch (error: any) {
    return { success: false, exists: false, message: error.message };
  }
}

// Create voucher
export async function createVoucher(userId: string, completedOrders: number) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const existCheck = await checkVoucherExists(userId, completedOrders);
    if (existCheck.exists) {
      console.log(`Voucher already exists for milestone ${completedOrders}`);
      return { success: false, message: 'Voucher already exists' };
    }
    
    const voucherCode = generateVoucherCode();
    const voucherValue = await getVoucherValue(completedOrders);
    
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserVouchers(userId: string) {
  console.log("Getting vouchers for user:", userId);
  
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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

export async function useVoucher(voucherId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkAndGenerateVoucher(userId: string, completedOrdersCount: number) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    if (completedOrdersCount % 3 !== 0) {
      return { success: false, message: 'Not a milestone yet' };
    }
    
    const existCheck = await checkVoucherExists(userId, completedOrdersCount);
    if (existCheck.exists) {
      return { success: false, message: 'Voucher already generated' };
    }
    
    return await createVoucher(userId, completedOrdersCount);
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export const claimVoucherEvent = async (userId: string, voucherEventId: string) => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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

    if (new Date(voucherEvent.expired_at) < new Date()) {
      return { 
        success: false, 
        message: "Voucher event sudah kadaluarsa" 
      };
    }

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

    const uniqueCode = `${voucherEvent.code}-${Date.now().toString(36).toUpperCase()}`;

    const { data: newVoucher, error: insertError } = await supabase
      .from("vouchers")
      .insert([{
        user_id: userId,
        code: uniqueCode,
        value: voucherEvent.value,
        expired_at: voucherEvent.expired_at,
        is_used: false,
        milestone_order: 0,
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

export const checkVoucherEventClaimed = async (userId: string, voucherEventId: string) => {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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
  } catch (error: any) {
    return {
      claimed: false,
      error: error.message
    };
  }
};

// ============ ADMIN FUNCTIONS ============

// Get all milestone rewards
export async function getMilestoneRewards() {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa melihat milestone rewards.", data: [] };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('milestone_rewards')
      .select('*')
      .order('milestone_step', { ascending: true });
    
    if (error) {
      console.error('Error fetching milestone rewards:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// Update milestone reward
export async function updateMilestoneReward(
  milestoneStep: number, 
  voucherValue: string
) {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate milestone reward." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('milestone_rewards')
      .update({ 
        voucher_value: voucherValue,
        updated_at: new Date().toISOString()
      })
      .eq('milestone_step', milestoneStep)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating milestone reward:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toggle milestone reward active status
export async function toggleMilestoneReward(milestoneStep: number, isActive: boolean) {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);
    
    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengubah status milestone reward." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('milestone_rewards')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('milestone_step', milestoneStep)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling milestone reward:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
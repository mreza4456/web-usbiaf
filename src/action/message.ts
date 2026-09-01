// @/actions/chat.actions.ts
"use server";
import { supabase } from '@/config/supabase';
import { createClient, getAuthenticatedUser, isAdmin } from '@/config/supabase-server';
import { IChatRoom, IChatMessage } from "@/interface/index";
import { supabaseAdmin } from '@/config/supabase-admin';

// Get or create chat room for user
export const getOrCreateChatRoom = async (userId: string) => {
  // Check if chat room exists
  const { data: existingRoom, error: fetchError } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .single();

  if (existingRoom) {
    return { success: true, data: existingRoom as IChatRoom };
  }

  // FIX: Jangan return error jika tidak ada room, lanjutkan create
  // Create new chat room
  const { data, error } = await supabase
    .from("chat_rooms")
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error("[SERVER] Error creating room:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data as IChatRoom };
};

export const getAllChatRooms = async () => {
  console.log("[GET ALL CHAT ROOMS] Starting query...");

  // Gunakan admin client untuk bypass RLS
  const { data, error } = await supabaseAdmin
    .from("chat_rooms")
    .select(`
      *,
      user:users!chat_rooms_user_id_fkey(id, email, full_name, avatar_url),
      admin:users!chat_rooms_admin_id_fkey(id, email, full_name, avatar_url)
    `)
    .order("last_message_at", { ascending: false });

  console.log("[GET ALL CHAT ROOMS] Result:", { data, error });

  if (error) {
    console.error("[GET ALL CHAT ROOMS] Error:", error);
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IChatRoom[] };
};

// Get user's chat room
export const getUserChatRoom = async (userId: string) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(`
      *,
      admin:users!chat_rooms_admin_id_fkey(id, email, full_name, avatar_url)
    `)
    .eq("user_id", userId)
    .eq("status", "open")
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IChatRoom };
};

// Get messages for a chat room
export const getChatMessages = async (chatRoomId: string) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      *,
      sender:users(id, email, full_name, avatar_url)
    `)
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IChatMessage[] };
};

// Mark messages as read
export const markMessagesAsRead = async (chatRoomId: string, userId: string) => {
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("chat_room_id", chatRoomId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};

// Assign admin to chat room
export const assignAdminToChatRoom = async (chatRoomId: string, adminId: string) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .update({ admin_id: adminId })
    .eq("id", chatRoomId)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IChatRoom };
};

// Close chat room
export const closeChatRoom = async (chatRoomId: string) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .update({ status: "closed" })
    .eq("id", chatRoomId)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IChatRoom };
};

// Get unread message count
export const getUnreadMessageCount = async (chatRoomId: string, userId: string) => {
  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: 'exact', head: true })
    .eq("chat_room_id", chatRoomId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) {
    return { success: false, count: 0 };
  }

  return { success: true, count: count || 0 };
};

// Get all users (for admin to create new chat)
export const getAllUsers = async () => {
  console.log("[GET ALL USERS] Starting query...");

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, avatar_url")
    .order("full_name", { ascending: true });

  console.log("[GET ALL USERS] Result:", { data, error });

  if (error) {
    console.error("[GET ALL USERS] Error:", error);
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data };
};

// Create chat room for specific user (admin initiated)
export const createChatRoomForUser = async (userId: string, adminId: string) => {
  console.log("[CREATE CHAT ROOM] Creating for user:", userId, "with admin:", adminId);

  // Check if chat room already exists
  const { data: existingRoom } = await supabaseAdmin
    .from("chat_rooms")
    .select(`
      *,
      user:users!chat_rooms_user_id_fkey(id, email, full_name, avatar_url),
      admin:users!chat_rooms_admin_id_fkey(id, email, full_name, avatar_url)
    `)
    .eq("user_id", userId)
    .eq("status", "open")
    .single();

  if (existingRoom) {
    console.log("[CREATE CHAT ROOM] Room already exists:", existingRoom);
    return { success: true, data: existingRoom as IChatRoom };
  }

  // Create new chat room with admin assigned
  const { data, error } = await supabaseAdmin
    .from("chat_rooms")
    .insert([{ 
      user_id: userId,
      admin_id: adminId,
      last_message_at: new Date().toISOString()
    }])
    .select(`
      *,
      user:users!chat_rooms_user_id_fkey(id, email, full_name, avatar_url),
      admin:users!chat_rooms_admin_id_fkey(id, email, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("[CREATE CHAT ROOM] Error:", error);
    return { success: false, message: error.message, data: null };
  }

  console.log("[CREATE CHAT ROOM] Room created:", data);
  return { success: true, data: data as IChatRoom };
};

// @/actions/chat.actions.ts
import { uploadToCloudflare } from '@/lib/storage'; // sesuaikan path file kamu

interface SendMessageOptions {
  file?: File; // image only untuk sekarang, file lain nunggu R2
}

const NON_IMAGE_MESSAGE = "Upload file selain gambar belum tersedia (menunggu aktivasi R2). Coming soon.";

export const sendMessage = async (
  chatRoomId: string,
  senderId: string,
  message: string,
  options?: SendMessageOptions
) => {
  let attachment = {
    message_type: "text" as "text" | "image",
    attachment_url: null as string | null,
    attachment_id: null as string | null,
    attachment_name: null as string | null,
    attachment_size: null as number | null,
  };

  if (options?.file) {
    const file = options.file;

    if (!file.type.startsWith("image/")) {
      return { success: false, message: NON_IMAGE_MESSAGE, data: null };
    }

    const uploaded = await uploadToCloudflare(file);

    if (!uploaded.success || !uploaded.url) {
      return { success: false, message: uploaded.message, data: null };
    }

    attachment = {
      message_type: "image",
      attachment_url: uploaded.url,
      attachment_id: uploaded.imageId,
      attachment_name: file.name,
      attachment_size: file.size,
    };
  }

  // Cegah kirim kosong (tanpa teks & tanpa file)
  if (!message?.trim() && !attachment.attachment_url) {
    return { success: false, message: "Pesan tidak boleh kosong", data: null };
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{
      chat_room_id: chatRoomId,
      sender_id: senderId,
      message: message?.trim() || "",
      ...attachment,
    }])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  await supabase
    .from("chat_rooms")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", chatRoomId);

  return { success: true, data: data as IChatMessage };
};

// @/actions/chat.actions.ts
import { deleteFromCloudflare } from '@/lib/storage'; // sesuaikan path file kamu

export const deleteChatMessage = async (messageId: string) => {
  const { data: msg, error: fetchError } = await supabase
    .from("chat_messages")
    .select("attachment_id, message_type")
    .eq("id", messageId)
    .single();

  if (fetchError) {
    return { success: false, message: fetchError.message };
  }

  // Hapus gambar di Cloudflare dulu kalau ada
  if (msg?.message_type === "image" && msg.attachment_id) {
    const del = await deleteFromCloudflare(msg.attachment_id);
    if (!del.success) {
      console.warn("[DELETE MSG] Gagal hapus image di Cloudflare:", del.message);
      // tetap lanjut hapus row-nya, jangan blok user
    }
  }

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};
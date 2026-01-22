
"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, User, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import {
  getAllChatRooms,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  assignAdminToChatRoom,
  closeChatRoom,
} from "@/action/message";
import { IChatRoom, IChatMessage } from "@/interface/";
import { supabase } from "@/config/supabase";

export default function AdminChatDashboard() {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<IChatRoom | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatRooms();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`admin_chat_room_${selectedRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${selectedRoom.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as IChatMessage;

          // Fetch sender info
          const { data: senderData } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          if (senderData) {
            newMsg.sender = senderData;
          }

          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if message is from user
          if (newMsg.sender_id !== user?.id) {
            await markMessagesAsRead(selectedRoom.id, user?.id || "");
          }
        }
      )
      .subscribe();

    // Subscribe to chat room updates
    const roomChannel = supabase
      .channel("chat_rooms_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        () => {
          loadChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(roomChannel);
    };
  }, [selectedRoom, user?.id]);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const result = await getAllChatRooms();
      if (result.success) {
        setChatRooms(result.data);
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChatRoom = async (room: IChatRoom) => {
    setSelectedRoom(room);
    
    // Assign admin if not assigned
    if (!room.admin_id && user?.id) {
      await assignAdminToChatRoom(room.id, user.id);
    }

    // Load messages
    const messagesResult = await getChatMessages(room.id);
    if (messagesResult.success) {
      setMessages(messagesResult.data);
    }

    // Mark messages as read
    if (user?.id) {
      await markMessagesAsRead(room.id, user.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  
  console.log("[ADMIN SEND] Submit triggered");
  console.log("[ADMIN SEND] State:", {
    newMessage: newMessage.trim(),
    selectedRoom: selectedRoom?.id,
    userId: user?.id,
    userRole: user?.role,
  });

  if (!newMessage.trim() || !selectedRoom || !user?.id) {
    console.warn("[ADMIN SEND] Validation failed");
    return;
  }

  setIsSending(true);
  try {
    console.log("[ADMIN SEND] Calling sendMessage...");
    const result = await sendMessage(selectedRoom.id, user.id, newMessage.trim());
    
    console.log("[ADMIN SEND] Result:", result);
    
    if (!result) {
      console.error("[ADMIN SEND] Result is null/undefined");
      alert("Gagal mengirim pesan. Silakan coba lagi.");
      return;
    }

    if (!result.success) {
      console.error("[ADMIN SEND] Failed:", result.message);
      alert(`Gagal mengirim pesan: ${result.message || "Unknown error"}`);
      return;
    }

    setNewMessage("");
    console.log("[ADMIN SEND] Success!");
  } catch (error) {
    console.error("[ADMIN SEND] Exception:", error);
    alert("Terjadi kesalahan saat mengirim pesan.");
  } finally {
    setIsSending(false);
  }
};

  const handleCloseChatRoom = async (roomId: string) => {
    try {
      await closeChatRoom(roomId);
      setSelectedRoom(null);
      loadChatRooms();
    } catch (error) {
      console.error("Error closing chat room:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Rooms List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Chat Rooms
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Belum ada chat room</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectChatRoom(room)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedRoom?.id === room.id
                      ? "bg-gradient-to-r from-[#D78FEE]/20 to-[#8B5CF6]/20 border border-[#D78FEE]/50"
                      : "bg-gray-800/50 hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary text-sm">
                          {room.user?.full_name || room.user?.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-400">{room.user?.email}</p>
                      </div>
                    </div>
                    {room.status === "open" ? (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        Open
                      </span>
                    ) : (
                      <span className="bg-gray-600/20 text-gray-400 text-xs px-2 py-1 rounded">
                        Closed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(room.last_message_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    {selectedRoom.user?.full_name || selectedRoom.user?.email?.split("@")[0]}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedRoom.user?.email}</p>
                </div>
              </div>
              {selectedRoom.status === "open" && (
                <Button
                  onClick={() => handleCloseChatRoom(selectedRoom.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  Close Chat
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">Belum ada pesan</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwn
                              ? "bg-gradient-to-r from-[#D78FEE] to-[#8B5CF6] text-white"
                              : "bg-gray-800 text-primary"
                          } rounded-lg p-3`}
                        >
                          {!isOwn && (
                            <p className="text-xs text-gray-400 mb-1">
                              {msg.sender?.full_name || "User"}
                            </p>
                          )}
                          <p className="text-sm break-words">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-white/70" : "text-gray-500"
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            {selectedRoom.status === "open" && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-gray-800 text-primary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D78FEE]"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-gradient-to-r from-[#D78FEE] to-[#8B5CF6] hover:opacity-90"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Pilih chat room untuk memulai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
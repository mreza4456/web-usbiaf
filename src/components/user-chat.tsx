"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, User, MessageCircleMore, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import {
  getOrCreateChatRoom,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
} from "@/action/message";
import { IChatMessage } from "@/interface/";
import { supabase } from "@/config/supabase";

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user?.id && !chatRoomId) {
      initializeChat();
    }
  }, [isOpen, user?.id]);
  // Tambahkan useEffect ini


  // Subscribe to new messages
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`chat_room_${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
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

          // Mark as read if chat is open and message is from admin
          if (isOpen && newMsg.sender_id !== user?.id) {
            await markMessagesAsRead(chatRoomId, user?.id || "");
          } else if (!isOpen && newMsg.sender_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, isOpen, user?.id]);

  const initializeChat = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const roomResult = await getOrCreateChatRoom(user.id);

      // FIX: Tambahkan logging
      console.log("[INIT] Room result:", roomResult);

      if (roomResult.success && roomResult.data) {
        setChatRoomId(roomResult.data.id);
        console.log("[INIT] Room ID set:", roomResult.data.id);

        const messagesResult = await getChatMessages(roomResult.data.id);
        if (messagesResult.success) {
          setMessages(messagesResult.data);
        }

        await markMessagesAsRead(roomResult.data.id, user.id);
        setUnreadCount(0);
      } else {
        // FIX: Handle error
        console.error("[INIT] Failed to get/create room:", roomResult);
      }
    } catch (error) {
      console.error("[INIT] Error initializing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[SEND] Submit triggered");

    if (!newMessage.trim()) {
      console.warn("[SEND] Message empty");
      return;
    }

    if (!user?.id) {
      console.error("[SEND] user not logged in");
      return;
    }

    // FIX: Create room if not exists
    let roomId = chatRoomId;
    if (!roomId) {
      console.log("[SEND] No chatRoomId, creating room...");
      const roomResult = await getOrCreateChatRoom(user.id);
      if (roomResult.success && roomResult.data) {
        roomId = roomResult.data.id;
        setChatRoomId(roomId);
      } else {
        console.error("[SEND] Failed to create room:", roomResult.error);
        return;
      }
    }

    setIsSending(true);

    try {
      console.log("[SEND] Sending message:", {
        chatRoomId: roomId,
        senderId: user.id,
        message: newMessage,
      });

      const result = await sendMessage(roomId, user.id, newMessage.trim());

      console.log("[SEND] Result:", result);

      if (!result?.success) {
        console.error("[SEND] Failed:", result?.message);
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error("[SEND] Exception:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="  flex items-center justify-center  hover:scale-110 transition-transform z-50"
      >
        <MessageCircleMore className="w-6 h-6 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed right-0 bottom-0 w-96  h-[500px] bg-background border border-gray-100 rounded-lg shadow-xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4  rounded-t-lg border-gray-800 bg-secondary">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-white">Chat Support</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-800 hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:transparent
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-secondary/50
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-[#D78FEE] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">
                  Belum ada pesan
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Mulai chat dengan admin
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const read = msg.is_read === true;
                  return (
                    <div key={msg.id}>
                      {isOwn && (
                        <span className={`flex text-[5px] text-gray-400 text-start ${isOwn ? "justify-end" : "justify-start"}`}>
                          {msg.sender?.full_name}
                        </span>
                      )}
                      {!isOwn && (
                        <span className={`flex text-[5px] text-gray-400 ${isOwn ? "justify-end" : "justify-start"}`}>
                          Admin
                        </span>
                      )}

                      <div

                        className={`flex ${isOwn ? "justify-end " : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%]  ${isOwn
                            ? "bg-primary text-white tooltip"
                            : "bg-muted text-primary tooltipleft"
                            } rounded-xl px-4 py-2`}
                        >

                          <p className="text-sm break-words">{msg.message}</p>
                     
                        </div>


                      </div>
                      <span className={`flex text-[5px] items-center   text-gray-400 ${isOwn ? "justify-end " : "justify-start ml-2"}`}

                      >
                        {formatTime(msg.created_at)}
                        {read &&(
                          <CheckCheck className="w-3 h-3 mx-1 text-primary" />
                        )} 
                        {!read &&(
                          <Check className="w-3 h-3 mx-1 " />
                        )} 
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-300"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-muted/30 text-primary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D78FEE]"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-primary hover:opacity-90"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
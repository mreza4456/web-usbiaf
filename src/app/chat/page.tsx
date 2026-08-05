"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, Check, CheckCheck, ArrowLeft } from "lucide-react";
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
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user?.id && !chatRoomId) {
      initializeChat();
    }
  }, [user?.id]);

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

          // Mark as read if message is from admin
          if (newMsg.sender_id !== user?.id) {
            await markMessagesAsRead(chatRoomId, user?.id || "");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;
    if (!user?.id) return;

    // Create room if not exists
    let roomId = chatRoomId;
    if (!roomId) {
      const roomResult = await getOrCreateChatRoom(user.id);
      if (roomResult.success && roomResult.data) {
        roomId = roomResult.data.id;
        setChatRoomId(roomId);
      } else {
        console.error("Failed to create room:", roomResult.error);
        return;
      }
    }

    setIsSending(true);

    try {
      const result = await sendMessage(roomId, user.id, newMessage.trim());

      if (!result?.success) {
        console.error("Failed to send message:", result?.message);
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const initializeChat = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const roomResult = await getOrCreateChatRoom(user.id);

      if (roomResult.success && roomResult.data) {
        setChatRoomId(roomResult.data.id);

        const messagesResult = await getChatMessages(roomResult.data.id);
        if (messagesResult.success) {
          setMessages(messagesResult.data);
        }

        // Mark as read
        await markMessagesAsRead(roomResult.data.id, user.id);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-gray-500">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-secondary border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-white">Chat Support</h1>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col bg-white shadow">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-secondary/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-400 text-lg font-medium">
                Belum ada pesan
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Mulai chat dengan admin
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const read = msg.is_read === true;
                return (
                  <div key={msg.id} className="space-y-1">
                    {/* Sender name */}
                    <div
                      className={`flex text-xs text-gray-400 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      {isOwn ? msg.sender?.full_name : "Admin"}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwn
                            ? "bg-primary text-white"
                            : "bg-muted text-primary"
                        } rounded-xl px-4 py-3`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>

                    {/* Time and read status */}
                    <div
                      className={`flex text-xs items-center text-gray-400 ${
                        isOwn ? "justify-end" : "justify-start ml-2"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                      {isOwn && (
                        <>
                          {read ? (
                            <CheckCheck className="w-3 h-3 ml-1 text-primary" />
                          ) : (
                            <Check className="w-3 h-3 ml-1" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 bg-white">
          <div className="p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-muted/30 text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-primary hover:opacity-90 px-6"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
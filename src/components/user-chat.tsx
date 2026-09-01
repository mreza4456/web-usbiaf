"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, User, MessageCircleMore, Check, CheckCheck, SquareArrowOutUpLeft, Maximize2, ImagePlus } from "lucide-react";
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
import Image from "next/image";
import { getCloudflareImageUrl } from "@/lib/storage-utils";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Lampiran gambar
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && user?.id && !chatRoomId) {
      initializeChat();
    }
  }, [isOpen, user?.id]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAttachError(null);

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setAttachError("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setAttachError("Ukuran gambar maksimal 10MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAttachError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = newMessage.trim();
    if (!trimmed && !selectedFile) return;
    if (!user?.id) return;

    let roomId = chatRoomId;
    if (!roomId) {
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
      const result = await sendMessage(
        roomId,
        user.id,
        trimmed,
        selectedFile ? { file: selectedFile } : undefined
      );

      if (!result?.success) {
        console.error("[SEND] Failed:", result?.message);
        setAttachError(result?.message ?? "Gagal mengirim pesan");
        return;
      }

      setNewMessage("");
      clearSelectedFile();
    } catch (error) {
      console.error("[SEND] Exception:", error);
      setAttachError("Terjadi kesalahan saat mengirim pesan");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (user?.id && !isOpen) {
      fetchUnreadCount();
    }
  }, [user?.id]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const roomResult = await getOrCreateChatRoom(user.id);
      if (roomResult.success && roomResult.data) {
        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_room_id", roomResult.data.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
        if (isOpen) {
          await markMessagesAsRead(roomResult.data.id, user.id);
          setUnreadCount(0);
        }
      } else {
        console.error("[INIT] Failed to get/create room:", roomResult);
      }
    } catch (error) {
      console.error("[INIT] Error initializing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      if (!chatRoomId) {
        initializeChat();
      } else {
        markMessagesAsRead(chatRoomId, user.id);
        setUnreadCount(0);
      }
    } else if (!isOpen && user?.id) {
      fetchUnreadCount();
    }
  }, [isOpen, user?.id]);

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

          const { data: senderData } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          if (senderData) {
            newMsg.sender = senderData;
          }

          setMessages((prev) => [...prev, newMsg]);

          if (newMsg.sender_id !== user?.id) {
            if (isOpen) {
              await markMessagesAsRead(chatRoomId, user?.id || "");
            } else {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, isOpen, user?.id]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const Handlemax = () => {
    router.push("/chat");
    setIsOpen(false);
  };

  const handleChatButtonClick = () => {
    if (isMobile) {
      router.push("/chat");
    } else {
      setIsOpen(true);
    }
  };

  if (!user) return null;
  return (
    <>
      <button
        onClick={handleChatButtonClick}
        className="relative flex items-center justify-center hover:scale-110 transition-transform z-50 "
      >
        <Image src="/icon/SVG/mailicon.svg" width={20} height={20} className="w-6 h-6 hover:scale-110 cursor-pointer transition-transform" alt="" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && !isMobile && (
        <div className="fixed right-2 bottom-5 w-96 h-[500px] card-campaign border-2 border-primary rounded-4xl overflow-hidden shadow-xl flex flex-col z-50">
          <div className="flex items-center justify-between p-4 rounded-t-3xl  border-b-2 border-primary text-primary">
            <div className="flex items-center text-primary gap-2">
              <img src="icon/SVG/contacticon.svg" className="w-6 h-6" alt="" />
              <h3 className="font-semibold text-lilita text-xl text-primary">Chat Support</h3>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button onClick={Handlemax} className="text-primary cursor-pointer hover:text-primary transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-primary cursor-pointer hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 [&::-webkit-scrollbar]:w-1
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
                <p className="text-gray-400 text-sm">Belum ada pesan</p>
                <p className="text-gray-500 text-xs mt-1">Mulai chat dengan admin</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const read = msg.is_read === true;
                  const hasImage = msg.message_type === "image" && !!msg.attachment_url;

                  return (
                    <div key={msg.id}>
                      <div>
                        {isOwn ? (
                          <span className={`flex text-[10px] text-gray-400 text-start ${isOwn ? "justify-end" : "justify-start"}`}>
                            {msg.sender?.full_name}
                          </span>
                        ) : (
                          <span className={`flex text-[10px] text-gray-400 ${isOwn ? "justify-end" : "justify-start"}`}>
                            Admin
                          </span>
                        )}

                        <div className={`flex ${isOwn ? "justify-end " : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] ${isOwn ? "bg-primary text-white tooltip" : "bg-muted text-primary tooltipleft"} rounded-xl px-4 py-2 space-y-1.5`}
                          >
                            {hasImage && (
                              <a href={getCloudflareImageUrl(msg.attachment_url, "public")} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={getCloudflareImageUrl(msg.attachment_url, "small")}
                                  alt={msg.attachment_name ?? "attachment"}
                                  className="rounded-lg max-w-[180px] max-h-[180px] object-cover"
                                />
                              </a>
                            )}
                            {msg.message && <p className="text-sm break-words">{msg.message}</p>}
                          </div>
                        </div>
                      </div>
                      <span className={`flex text-[10px] items-center text-gray-400 ${isOwn ? "justify-end " : "justify-start ml-2"}`}>
                        {formatTime(msg.created_at)}
                        {read ? <CheckCheck className="w-3 h-3 mx-1 text-primary" /> : <Check className="w-3 h-3 mx-1 " />}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-primary">
            {previewUrl && (
              <div className="mb-2 flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                <img src={previewUrl} alt="preview" className="w-10 h-10 rounded object-cover shrink-0" />
                <p className="text-xs text-primary truncate flex-1">{selectedFile?.name}</p>
                <button type="button" onClick={clearSelectedFile} disabled={isSending} className="text-primary/60 hover:text-primary shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {attachError && <p className="text-[11px] text-red-500 mb-1.5">{attachError}</p>}
            <div className="flex gap-2 relative items-center">
              <button
                type="button"
                onClick={handlePickImage}
                disabled={isSending}
                className="text-primary/60 hover:text-primary transition-colors shrink-0 disabled:opacity-50"
                aria-label="Lampirkan gambar"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={VALID_IMAGE_TYPES.join(",")}
                onChange={handleFileChange}
                hidden
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="type messsage..."
                className="flex-1 bg-muted/30 text-primary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || isSending}
                className="text-primary bg-transparent absolute right-0 cursor-pointer hover:bg-transparent"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
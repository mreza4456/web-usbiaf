"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  Check,
  CheckCheck,
  ChevronDown,
  Link2,
  ImagePlus,
  MoreVertical,
  ChevronRight,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Video,
  Youtube,
  Instagram,
  Twitter,
  MessagesSquare,
} from "lucide-react";
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

// Ganti sesuai kategori order yang sebenarnya ada di sistem kamu


// Ganti dengan akun sosial media studio yang sebenarnya
const SOCIALS = [
  { icon: Youtube, href: "https://youtube.com" },
  { icon: Instagram, href: "https://instagram.com" },
  { icon: MessagesSquare, href: "https://discord.com" },
  { icon: Twitter, href: "https://x.com" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

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

  // Hitung ringkasan lampiran dari pesan yang ada.
  // Skema IChatMessage saat ini belum punya field attachments — begitu fitur
  // upload file ditambahkan, ganti bagian ini dengan data attachment asli.
  const attachmentSummary = [
    { key: "documents", label: "Documents", icon: FileText, bg: "bg-primary/10", iconColor: "text-primary", count: 0 },
    { key: "photos", label: "Photos", icon: ImageIcon, bg: "bg-pink-100", iconColor: "text-pink-500", count: 0 },
    { key: "video", label: "Video", icon: Video, bg: "bg-emerald-100", iconColor: "text-emerald-500", count: 0 },
    { key: "other", label: "Other", icon: FolderOpen, bg: "bg-amber-100", iconColor: "text-amber-500", count: 0 },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* KOLOM CHAT */}
      <div className="flex-1 flex flex-col min-w-0 lg:border-r border-secondary">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-6 border-b border-secondary border-r bg-white px-6  lg:fixed lg:left-60 lg:right-90 xl:left-70 lg:top-20 xl:right-90 sm:px-8 py-5">
          <div className="">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary text-lilita">Chat Messages</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Online
            </p>
          </div>

          {/* <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-primary/10 text-primary text-sm font-medium rounded-full pl-4 pr-9 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div> */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-primary/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 text-primary/20 mb-4" />
              <p className="text-gray-400 text-lg font-medium">Belum ada pesan</p>
              <p className="text-gray-400 text-sm mt-2">Mulai chat dengan admin</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const read = msg.is_read === true;
                const attachments = (msg as any).attachments as string[] | undefined;

                return (
                  <div key={msg.id} className="space-y-1.5">
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-3 ${
                          isOwn ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1 text-xs text-muted-foreground ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                      {isOwn &&
                        (read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        ))}
                    </div>

                    {attachments && attachments.length > 0 && (
                      <div className="flex gap-2 flex-wrap max-w-[75%] sm:max-w-[65%] ml-auto">
                        {attachments.slice(0, 3).map((url, i) => (
                          <div
                            key={i}
                            className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className=" px-6  lg:fixed lg:left-60 lg:right-90 xl:left-70 bottom-0 xl:right-90 sm:px-8 py-5">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#EFEBFF] w-full rounded-xl pl-4 pr-4 py-3">
            <button
              type="button"
              className="text-primary/60 hover:text-primary transition-colors shrink-0"
              aria-label="Lampirkan link"
            >
              <Link2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-primary/60 hover:text-primary transition-colors shrink-0"
              aria-label="Lampirkan gambar"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type something..."
              className="flex-1 bg-transparent text-primary text-sm px-2 py-2 focus:outline-none placeholder:text-muted-foreground"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="rounded-full bg-primary hover:opacity-90 shrink-0 w-10 h-10"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* SIDEBAR STUDIO */}
      <aside className="hidden lg:flex lg:flex-col w-[360px] shrink-0 px-6 py-8 overflow-y-auto">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-36 h-36 rounded-full bg-primary" />
            <span className="absolute -top-1 -right-4 bg-white shadow-md rounded-full px-3 py-1 text-xs font-medium text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold text-primary text-lilita">Nemuneko Studio</h2>
          <p className="text-sm text-muted-foreground mt-1">24/7 Customer Support</p>

          <div className="flex items-center gap-3 mt-5">
            {SOCIALS.map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <div className="w-full mt-6 rounded-2xl bg-primary/10 p-5">
            <p className="text-sm text-primary/80 leading-relaxed">
              Kami biasanya membalas dalam beberapa jam. Ceritakan kebutuhan order kamu di sini ya!
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary">Attachments</h3>
            <button className="text-muted-foreground hover:text-primary transition-colors" aria-label="Opsi lainnya">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {attachmentSummary.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count > 0 ? `${item.count} Files` : "No files yet"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto ">
          <div className="rounded-2xl bg-primary/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
              <MessagesSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-primary leading-tight">Still Need Help?</p>
              <a href="/ticket" className="text-primary underline font-bold">
                OPEN A TICKET HERE
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
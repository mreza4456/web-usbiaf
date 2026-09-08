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
  X,
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
import { getCloudflareImageUrl } from "@/lib/storage-utils";

const SOCIALS = [
  { icon: Youtube, href: "https://youtube.com" },
  { icon: Instagram, href: "https://instagram.com" },
  { icon: MessagesSquare, href: "https://discord.com" },
  { icon: Twitter, href: "https://x.com" },
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB, samakan dengan DEFAULT_MAX_SIZE di server
const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function ChatPage() {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  // State untuk lampiran gambar yang dipilih tapi belum dikirim
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Bersihkan object URL preview biar tidak leak memori
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  // --- Handler pilih gambar ---
  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset supaya bisa pilih file sama lagi
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
        console.error("Failed to create room:", roomResult.error);
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
        console.error("Failed to send message:", result?.message);
        setAttachError(result?.message ?? "Gagal mengirim pesan");
        return;
      }

      setNewMessage("");
      clearSelectedFile();
    } catch (error) {
      console.error("Error sending message:", error);
      setAttachError("Terjadi kesalahan saat mengirim pesan");
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

  // Hitung ringkasan lampiran dari pesan yang benar-benar ada.
  // Documents/Video/Other masih 0 karena upload non-image nunggu R2 aktif.
  const photoCount = messages.filter((m) => m.message_type === "image").length;
  const attachmentSummary = [
    { key: "documents", label: "Documents", icon: FileText, bg: "bg-primary/10", iconColor: "text-primary", count: 0 },
    { key: "photos", label: "Photos", icon: ImageIcon, bg: "bg-pink-100", iconColor: "text-pink-500", count: photoCount },
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
    <>
      <div className="h-full overflow-hidden bg-white flex flex-col lg:flex-row">
        {/* KOLOM CHAT */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden lg:border-r border-secondary">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-secondary bg-white">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary text-lilita">Chat Messages</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 [&::-webkit-scrollbar]:w-1.5
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
                  const hasImage = msg.message_type === "image" && !!msg.attachment_url;

                  return (
                    <div key={msg.id}> 
                      <div  className="space-y-1.5">
                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-3 space-y-2 ${isOwn ? "bg-muted/50 text-primary" : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {hasImage && (

                              <a href={getCloudflareImageUrl(msg.attachment_url, "public")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={getCloudflareImageUrl(msg.attachment_url, "small")}
                                  alt={msg.attachment_name ?? "attachment"}
                                  className="rounded-xl max-w-[220px] max-h-[220px] object-cover"
                                />
                              </a>
                            )}
                            {msg.message && (
                              <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                            )}
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-1 text-xs text-muted-foreground ${isOwn ? "justify-end" : "justify-start"
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
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-6 sm:px-8 py-5 border-t border-secondary bg-white">
            {/* Preview gambar yang mau dikirim */}
            {previewUrl && (
              <div className="mb-3 flex items-center gap-3 bg-[#EFEBFF] rounded-xl p-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="text-primary/60 hover:text-primary transition-colors shrink-0"
                  aria-label="Batalkan lampiran"
                  disabled={isSending}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {attachError && (
              <p className="text-xs text-red-500 mb-2 px-1">{attachError}</p>
            )}

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
                onClick={handlePickImage}
                disabled={isSending}
                className="text-primary/60 hover:text-primary transition-colors shrink-0 disabled:opacity-50"
                aria-label="Lampirkan gambar"
              >
                <ImagePlus className="w-5 h-5" />
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
                placeholder="Type something..."
                className="flex-1 bg-transparent text-primary text-sm px-2 py-2 focus:outline-none placeholder:text-muted-foreground"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || isSending}
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
        <aside className="hidden lg:flex lg:flex-col w-[360px] shrink-0 h-full overflow-hidden px-6 py-8">
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

              <a  key = { i }
                  href = { href }
                  target = "_blank"
                  rel = "noopener noreferrer"
                  className = "w-10 h-10 rounded-full bg-muted/50 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                <Icon className="w-4 h-4" />
                </a>
              ))}
          </div>

          <div className="w-full mt-6 rounded-2xl bg-muted/50 p-5">
            <p className="text-sm text-primary leading-relaxed">
              We usually respond within a few hours. Please tell us about your order here!
            </p>
          </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-primary text-fredoka font-semibold">Attachments</h3>
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
                  <img src="/icon/SVG/fileicon.svg" className="w-6 h-6" alt="" />
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

      <div className="mt-auto">
        <div className="rounded-2xl bg-muted/50 p-4 flex items-center gap-3">
          <div className="w-10 h-10  flex items-center justify-center shrink-0">
          <img src="/icon/SVG/quoteicon.svg" className="w-7 h-7" alt="" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-primary leading-tight">Still Need Help?</p>
            <a href="/contact" className="text-primary underline font-bold">
              OPEN A TICKET HERE
            </a>
          </div>
        </div>
      </div>
    </aside >
      </div >
    </>
  );
}
"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, User, CheckCircle, Clock, Check, CheckCheck, Search, Plus, X, MessageCirclePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import {
  getAllChatRooms,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  assignAdminToChatRoom,
  closeChatRoom,
  createChatRoomForUser,
  getAllUsers,
} from "@/action/message";
import { IChatRoom, IChatMessage } from "@/interface/";
import { supabase } from "@/config/supabase";

interface IUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function AdminChatDashboard() {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [filteredChatRooms, setFilteredChatRooms] = useState<IChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<IChatRoom | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // New Chat View State
  const [showNewChatView, setShowNewChatView] = useState(false);
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  console.log("[DASHBOARD] Current user:", user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log("[DASHBOARD] Component mounted, loading chat rooms...");
    loadChatRooms();
  }, []);

  // Filter chat rooms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChatRooms(chatRooms);
    } else {
      const filtered = chatRooms.filter((room) => {
        const name = room.user?.full_name || room.user?.email?.split("@")[0] || "";
        const email = room.user?.email || "";
        const query = searchQuery.toLowerCase();

        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query)
        );
      });
      setFilteredChatRooms(filtered);
    }
  }, [searchQuery, chatRooms]);

  // Filter users in new chat view
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((u) => {
        const name = u.full_name || u.email?.split("@")[0] || "";
        const email = u.email || "";
        const query = userSearchQuery.toLowerCase();

        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, users]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedRoom) {
      console.log("[SUBSCRIPTION] No room selected, skipping subscription");
      return;
    }

    console.log("[SUBSCRIPTION] Setting up subscription for room:", selectedRoom.id);

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
          console.log("[SUBSCRIPTION] New message received:", payload);
          const newMsg = payload.new as IChatMessage;

          // Fetch sender info
          const { data: senderData } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          console.log("[SUBSCRIPTION] Sender data:", senderData);

          if (senderData) {
            newMsg.sender = senderData;
          }

          console.log("[SUBSCRIPTION] Message with sender:", newMsg);
          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if message is from user
          if (newMsg.sender_id !== user?.id) {
            console.log("[SUBSCRIPTION] Marking message as read");
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
          console.log("[SUBSCRIPTION] Chat room updated, reloading...");
          loadChatRooms();
        }
      )
      .subscribe();

    return () => {
      console.log("[SUBSCRIPTION] Cleaning up subscriptions");
      supabase.removeChannel(channel);
      supabase.removeChannel(roomChannel);
    };
  }, [selectedRoom, user?.id]);

  const loadChatRooms = async () => {
    console.log("[LOAD ROOMS] Starting to load chat rooms...");
    setIsLoading(true);
    try {
      const result = await getAllChatRooms();
      console.log("[LOAD ROOMS] Result:", result);

      if (result.success) {
        console.log("[LOAD ROOMS] Chat rooms loaded:", result.data);
        setChatRooms(result.data);
      } else {
        console.error("[LOAD ROOMS] Failed to load:", result.message);
      }
    } catch (error) {
      console.error("[LOAD ROOMS] Exception:", error);
    } finally {
      setIsLoading(false);
      console.log("[LOAD ROOMS] Loading complete");
    }
  };

  const loadUsers = async () => {
    console.log("[LOAD USERS] Starting to load users...");
    setIsLoadingUsers(true);
    try {
      const result = await getAllUsers();
      console.log("[LOAD USERS] Result:", result);

      if (result.success) {
        // Filter out users that already have open chat rooms
        const existingUserIds = chatRooms
          .filter(room => room.status === "open")
          .map(room => room.user_id);

        const availableUsers = result.data.filter(
          (u: IUser) => !existingUserIds.includes(u.id) && u.id !== user?.id
        );

        console.log("[LOAD USERS] Available users:", availableUsers);
        setUsers(availableUsers);
        setFilteredUsers(availableUsers);
      } else {
        console.error("[LOAD USERS] Failed to load:", result.message);
      }
    } catch (error) {
      console.error("[LOAD USERS] Exception:", error);
    } finally {
      setIsLoadingUsers(false);
      console.log("[LOAD USERS] Loading complete");
    }
  };

  const handleOpenNewChatView = () => {
    setShowNewChatView(true);
    setUserSearchQuery("");
    loadUsers();
  };

  const handleCloseNewChatView = () => {
    setShowNewChatView(false);
    setUserSearchQuery("");
  };

  const handleCreateChatRoom = async (userId: string) => {
    console.log("[CREATE ROOM] Creating chat room for user:", userId);
    try {
      const result = await createChatRoomForUser(userId, user?.id || "");

      if (result.success) {
        console.log("[CREATE ROOM] Room created:", result.data);
        handleCloseNewChatView();
        await loadChatRooms();
        // Auto select the new room
        if (result.data) {
          selectChatRoom(result.data);
        }
      } else {
        console.error("[CREATE ROOM] Failed:", result.message);
        alert(`Gagal membuat chat room: ${result.message}`);
      }
    } catch (error) {
      console.error("[CREATE ROOM] Exception:", error);
      alert("Terjadi kesalahan saat membuat chat room.");
    }
  };

  const selectChatRoom = async (room: IChatRoom) => {
    console.log("[SELECT ROOM] Selecting room:", room);
    console.log("[SELECT ROOM] Room user data:", room.user);
    setSelectedRoom(room);

    // Assign admin if not assigned
    if (!room.admin_id && user?.id) {
      console.log("[SELECT ROOM] Assigning admin to room");
      await assignAdminToChatRoom(room.id, user.id);
    }

    // Load messages
    console.log("[SELECT ROOM] Loading messages for room:", room.id);
    const messagesResult = await getChatMessages(room.id);
    console.log("[SELECT ROOM] Messages result:", messagesResult);

    if (messagesResult.success) {
      console.log("[SELECT ROOM] Messages loaded:", messagesResult.data);
      setMessages(messagesResult.data);
    } else {
      console.error("[SELECT ROOM] Failed to load messages:", messagesResult.message);
    }

    // Mark messages as read
    if (user?.id) {
      console.log("[SELECT ROOM] Marking messages as read");
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

      console.log("[ADMIN SEND] Message sent successfully");
      setNewMessage("");
    } catch (error) {
      console.error("[ADMIN SEND] Exception:", error);
      alert("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setIsSending(false);
      console.log("[ADMIN SEND] Send complete");
    }
  };

  const handleCloseChatRoom = async (roomId: string) => {
    console.log("[CLOSE ROOM] Closing room:", roomId);
    try {
      await closeChatRoom(roomId);
      setSelectedRoom(null);
      loadChatRooms();
      console.log("[CLOSE ROOM] Room closed successfully");
    } catch (error) {
      console.error("[CLOSE ROOM] Error:", error);
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
    <div className="h-full bg-gray-50 flex overflow-hidden">
      {/* Chat Rooms List / New Chat View */}
      <div className="w-80 flex flex-col bg-white border-r border-gray-200">
        {!showNewChatView ? (
          <>
            {/* Normal Chat Rooms View */}
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center justify-between gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama..."
                    className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 border border-gray-200"
                  />
                </div>
                <Button
                  onClick={handleOpenNewChatView}
                  className="p-2.5 bg-gray-800 hover:bg-gray-700 text-white shrink-0"
                >
                  <MessageCirclePlus className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : filteredChatRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageCircle className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada chat room"}
                  </p>
                </div>
              ) : (
                <>
                  {filteredChatRooms.map((room) => {
                    console.log("[RENDER ROOM]", {
                      id: room.id,
                      user: room.user,
                      full_name: room.user?.full_name,
                      email: room.user?.email,
                    });

                    return (
                      <button
                        key={room.id}
                        onClick={() => selectChatRoom(room)}
                        className={`w-full p-4 text-left transition-all border-b border-gray-100 ${
                          selectedRoom?.id === room.id
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="font-medium text-gray-900 text-sm">
                            {room.user?.full_name || room.user?.email?.split("@")[0]}
                          </span>
                          {room.status === "open" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-200 shrink-0">
                              Open
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                              Closed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {room.user?.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(room.last_message_at)}
                        </p>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* New Chat View */}
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  onClick={handleCloseNewChatView}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 hover:bg-gray-200 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <h3 className="text-lg font-semibold text-gray-900">Chat Baru</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Cari user..."
                  className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 border border-gray-200"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <User className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-400 text-sm">
                    {userSearchQuery ? "Tidak ada hasil pencarian" : "Semua user sudah memiliki chat room"}
                  </p>
                </div>
              ) : (
                <>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleCreateChatRoom(u.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {u.full_name || u.email?.split("@")[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedRoom ? (
          <>
            {/* Chat Header - Sticky */}
            <div className="p-4 bg-gray-800 flex-shrink-0 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">
                      {(() => {
                        const name = selectedRoom.user?.full_name || selectedRoom.user?.email?.split("@")[0];
                        console.log("[RENDER HEADER] User name:", name);
                        console.log("[RENDER HEADER] Selected room user:", selectedRoom.user);
                        return name;
                      })()}
                    </h3>
                    <p className="text-sm text-gray-300 truncate">{selectedRoom.user?.email}</p>
                  </div>
                </div>
                {selectedRoom.status === "open" && (
                  <Button
                    onClick={() => handleCloseChatRoom(selectedRoom.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400 hover:bg-red-400/10 shrink-0 ml-4"
                  >
                    Close Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-3" />
                  <p className="text-gray-400 font-medium">Belum ada pesan</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Mulai percakapan dengan user
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    const read = msg.is_read === true;

                    console.log("[RENDER MESSAGE]", {
                      id: msg.id,
                      sender_id: msg.sender_id,
                      sender: msg.sender,
                      sender_name: msg.sender?.full_name,
                      isOwn,
                      message: msg.message
                    });

                    return (
                      <div key={msg.id} className="flex flex-col">
                        <span className={`text-xs text-gray-400 mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {isOwn ? 'Admin' : (msg.sender?.full_name || 'User')}
                        </span>

                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isOwn
                                ? "bg-gray-800 text-white rounded-br-sm"
                                : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[11px] text-gray-400">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            <>
                              {read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
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

            {/* Input - Sticky */}
            {selectedRoom.status === "open" && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 border border-gray-200 resize-none"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-gray-800 hover:bg-gray-700 text-white flex justify-center items-center p-5 rounded-xl shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : (
                      <Send className="w-10 h-10" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">Pilih chat room untuk memulai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
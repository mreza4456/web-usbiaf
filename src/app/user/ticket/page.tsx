"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Clock, MessageSquare, LogIn } from "lucide-react";
import { toast } from "sonner";
import { ITicket } from "@/interface";
import { getMyTickets } from "@/action/tickets";
import { BadgeCard } from "@/components/card-dashed";

type TabFilter = "open" | "in_progress" | "resolved";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
];

// Warna ribbon per priority
const RIBBON_COLORS: Record<string, string> = {
    LOW: "bg-gray-200 text-gray-700 border-gray-400/40",
    NORMAL: "bg-purple-200 text-primary border-primary/40",
    HIGH: "bg-orange-200 text-orange-700 border-orange-400/40",
    URGENT: "bg-red-200 text-red-700 border-red-400/40",
};

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [search, setSearch] = useState("");
    const [priority, setPriority] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<TabFilter>("open");
    const router = useRouter();

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getMyTickets();

            if (!response?.success) {
                setUnauthorized(true);
                setTickets([]);
                return;
            }

            setUnauthorized(false);
            setTickets(response.data as ITicket[]);
        } catch (error: any) {
            console.error("❌ Error:", error);
            toast.error(error.message || "Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Kelompokkan status jadi 3 tab: open, in_progress, resolved (resolved & closed digabung)
    const getTabStatus = useCallback((ticket: ITicket): TabFilter => {
        if (ticket.status === "open") return "open";
        if (ticket.status === "in_progress") return "in_progress";
        return "resolved"; // resolved & closed
    }, []);

    // Daftar priority unik untuk dropdown filter
    const priorityOptions = useMemo(() => {
        const unique = Array.from(
            new Set(tickets.map((t) => t.priority).filter(Boolean))
        ) as string[];
        return unique;
    }, [tickets]);

    // Filter: search + priority + tab status
    const filteredTickets = useMemo(() => {
        const q = search.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const matchSearch =
                !q ||
                ticket.ticket_number?.toLowerCase().includes(q) ||
                ticket.subject?.toLowerCase().includes(q) ||
                ticket.message?.toLowerCase().includes(q);

            const matchPriority =
                priority === "all" || ticket.priority === priority;

            const matchTab = getTabStatus(ticket) === activeTab;

            return matchSearch && matchPriority && matchTab;
        });
    }, [tickets, search, priority, activeTab, getTabStatus]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const statusLabel: Record<string, string> = {
        open: "Open",
        in_progress: "In Progress",
        resolved: "Resolved",
        closed: "Closed",
    };

 

    const renderTicketCard = (ticket: ITicket) => {
        const isOpen = ticket.status === "open";

        return (
            <div
                key={ticket.id}
                className={`relative bg-white p-5 relative card-campaign border-2 rounded-3xl flex flex-col space-y-3 transition-colors ${isOpen ? "border-primary shadow-primary" : "border-primary"
                    }`}
            >
              

                <div className="flex w-full justify-between items-center">
                    <span className="inline-block text-xs text-fredoka font-medium w-fit text-primary bg-muted/50 px-3 py-1 rounded-full ">
                        {formatDate(ticket.created_at)}
                    </span>
                    <div className="flex items-center text-fredoka justify-between ">
                        <span
                            className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${statusColor(ticket.status)
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            {statusLabel[ticket.status] ?? ticket.status}
                        </span>


                    </div>
                </div>


                <h3 className="text-2xl text-lilita font-extrabold text-primary leading-tight">
                    {ticket.subject}
                </h3>

                <span className="font-mono text-xs text-gray-400">{ticket.ticket_number}</span>

                <p className="text-primary text-fredoka line-clamp-3">
                    {ticket.message}
                </p>

                {ticket.admin_reply && (
                    <div className="flex items-start gap-2 bg-[#e6dcff] rounded-2xl p-3 text-sm text-primary">
                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{ticket.admin_reply}</span>
                    </div>
                )}


            </div>
        );
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "open":
                return "bg-blue-100 text-blue-700";
            case "in_progress":
                return "bg-yellow-100 text-yellow-700";
            case "resolved":
                return "bg-green-100 text-green-700";
            case "closed":
                return "bg-gray-100 text-gray-700";
            default:
                return "bg-muted text-primary";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen px-5 mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-primary/10 rounded-full w-full max-w-md"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-14 bg-primary/10 rounded-xl"></div>
                        <div className="h-14 bg-primary/10 rounded-xl"></div>
                        <div className="h-14 bg-primary/10 rounded-xl"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-56 bg-primary/10 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center gap-4">
                <LogIn className="w-10 h-10 text-primary" />
                <h3 className="text-xl font-bold text-primary">Please login to view your tickets</h3>
                <Button
                    onClick={() => router.push("/login")}
                    className="rounded-full bg-primary text-white px-8 py-5"
                >
                    Login
                </Button>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full px-15 mx-auto py-8">

            <h1 className="text-4xl sm:text-6xl w-full text-primary leading-5 uppercase mb-10">Support <span className='text-5xl sm:text-7xl bg-title'>TICKETS</span></h1>

            {/* Search + Priority Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search ticket number, subject..."
                        className="rounded-full text-fredoka border-2 border-primary pl-11 py-5"
                    />
                </div>

           
                <Button
                    onClick={() => router.push("/contact")}
                    className="rounded-full bg-primary text-fredoka font-bold cursor-pointer text-white  px-8 py-5"
                >
                    Create New Ticket
                </Button>
            </div>

            <div className="relative">
                <div className="w-full h-0.5 bg-secondary/80 absolute top-15"></div>
                {/* Tabs: Open / In Progress / Resolved */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-4 text-left text-fredoka font-semibold text-lg transition-colors ${activeTab === tab.key
                                ? "bg-muted text-primary"
                                : "bg-muted/50 text-primary hover:bg-muted/80"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Ticket */}
            {filteredTickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-5">
                    {filteredTickets.map(renderTicketCard)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">
                        No tickets found
                    </h3>
                    <p className="text-primary text-center max-w-md">
                        {activeTab === "open" && "You don't have any open tickets right now."}
                        {activeTab === "in_progress" && "No tickets are currently in progress."}
                        {activeTab === "resolved" && "No resolved or closed tickets yet."}
                    </p>
                </div>
            )}
        </div>
    );
}
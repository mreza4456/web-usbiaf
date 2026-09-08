"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, MessageSquare, LogIn } from "lucide-react";
import { toast } from "sonner";
import { ITicket } from "@/interface";
import { getMyTickets } from "@/action/tickets";
import { CardSecondary, CardTicket } from "@/components/card-dashed";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type TabFilter = "open" | "in_progress" | "resolved";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
];

// Grid template shared by header row + every ticket row so columns line up
const ROW_COLS = "grid-cols-[2fr_1fr_1fr_auto]";

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [search, setSearch] = useState("");
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

    // Filter: search + tab status
    const filteredTickets = useMemo(() => {
        const q = search.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const matchSearch =
                !q ||
                ticket.ticket_number?.toLowerCase().includes(q) ||
                ticket.subject?.toLowerCase().includes(q) ||
                ticket.message?.toLowerCase().includes(q);

            const matchTab = getTabStatus(ticket) === activeTab;

            return matchSearch && matchTab;
        });
    }, [tickets, search, activeTab, getTabStatus]);

    const statusLabel: Record<string, string> = {
        open: "Open",
        in_progress: "Awaiting",
        resolved: "Solved",
        closed: "Closed",
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "open":
                return "bg-[#FF5A5A] text-white";
            case "in_progress":
                return "bg-[#FDD916] text-primary";
            case "resolved":
                return "bg-[#87F784] text-primary";
            case "closed":
                return "bg-gray-100 text-gray-600";
            default:
                return "bg-muted text-primary";
        }
    };

    // Thin dashed "stitch" line, repeated under each column of a row


    const renderTicketRow = (ticket: ITicket) => (
        <CardTicket
            key={ticket.id}
            className={`relative bg-white  items-center mb-3`}
        >
            {/* stitch lines near the top and bottom edge of the pill */}
            <div className="w-full px-10 relative  grid grid-cols-4 items-center gap-4 py-4">

                <h3 className="relative z-10 text-primary font-fredoka font-semibold text-lg truncate">
                    {ticket.subject}
                </h3>

                <span className="relative z-10 font-mono text-sm text-primary truncate">
                    {ticket.ticket_number}
                </span>
                <div className="col-span-2 flex justify-between items-center gap-4 w-full">
                    <span
                        className={`relative z-10 w-fit inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${statusColor(
                            ticket.status
                        )}`}
                    >
                        {statusLabel[ticket.status] ?? ticket.status}
                    </span>


                    <Dialog>
                        <DialogTrigger>   
                            <div
                           
                            className="relative z-10 w-fit cursor-pointer uppercase  rounded-full bg-primary text-white font-semibold px-6 py-1 shrink-0"
                        >
                            Check Detail
                        </div></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{ticket.subject}</DialogTitle>
                                <DialogDescription>
                                
                                    {ticket.message}
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

        </CardTicket>
    );

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
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 bg-primary/10 rounded-full"></div>
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
            <div className="flex  flex-col justify-between sm:flex-row items-stretch sm:items-center">

                <h1 className="text-4xl sm:text-6xl w-full text-primary leading-5 uppercase mb-10">
                    TICKETS <span className="text-5xl sm:text-7xl bg-title"> TRACKING</span>
                </h1>
                <Button
                    onClick={() => router.push("/contact")}
                    className="rounded-full bg-primary text-fredoka font-bold cursor-pointer text-white px-8 py-5"
                >
                    Create New Ticket
                </Button>
            </div>


            {filteredTickets.length > 0 ? (
                <div className="p-5">
                    {/* Column headers */}
                    <div className={`grid grid-cols-4 gap-6 px-6 `}>
                        <span className="text-primary fredoka-bold text-md">Subject</span>
                        <span className="text-primary fredoka-bold text-md">#TicketID</span>
                        <span className="text-primary fredoka-bold text-md col-span-2">Status</span>
                        <span />
                    </div>
                    <div className="w-full h-0.5 bg-muted mb-10" />

                    <div className="flex flex-col gap-5">
                        {filteredTickets.map(renderTicketRow)}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">No tickets found</h3>
                    <p className="text-primary text-center max-w-md">
                        You don't have any open tickets right now

                    </p>
                </div>
            )}
        </div>
    );
}
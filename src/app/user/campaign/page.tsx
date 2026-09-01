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
import { Search, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { ICampaign } from "@/interface";
import { getAllCampaigns } from "@/action/campaign";
import { BadgeCard } from "@/components/card-dashed";

type TabFilter = "active" | "upcoming" | "past";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past Event" },
];

// Warna ribbon per kategori — silakan sesuaikan / tambah sesuai kategori yang ada
const RIBBON_COLORS: Record<string, string> = {
    RAFFLE: "bg-purple-200 text-primary border-primary/40",
    GIVEAWAY: "bg-purple-200 text-primary border-primary/40",
    SKEB: "bg-purple-200 text-primary border-primary/40",
};

export default function CampaignListPage() {
    const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<TabFilter>("active");
    const router = useRouter();

    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllCampaigns();

            if (!response?.success) {
                throw new Error(response?.message || "Failed to fetch campaigns");
            }

            setCampaigns(response.data as ICampaign[]);
        } catch (error: any) {
            console.error("❌ Error:", error);
            toast.error(error.message || "Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Hitung status campaign dari kolom date & expired
    const getCampaignStatus = useCallback((campaign: ICampaign): TabFilter => {
        const now = new Date();
        const start = campaign.date ? new Date(campaign.date) : null;
        const end = campaign.expired ? new Date(campaign.expired) : null;

        if (start && start > now) return "upcoming";
        if (end && end < now) return "past";
        return "active";
    }, []);

    // Daftar kategori unik untuk dropdown filter
    const categoryOptions = useMemo(() => {
        const unique = Array.from(
            new Set(campaigns.map((c) => c.categories).filter(Boolean))
        ) as string[];
        return unique;
    }, [campaigns]);

    // Filter: search + category + tab status
    const filteredCampaigns = useMemo(() => {
        const q = search.trim().toLowerCase();

        return campaigns.filter((campaign) => {
            const matchSearch =
                !q ||
                campaign.title?.toLowerCase().includes(q) ||
                campaign.description?.toLowerCase().includes(q);

            const matchCategory =
                category === "all" || campaign.categories === category;

            const matchTab = getCampaignStatus(campaign) === activeTab;

            return matchSearch && matchCategory && matchTab;
        });
    }, [campaigns, search, category, activeTab, getCampaignStatus]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatCount = (num: number | null) => {
        const n = num ?? 0;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return `${n}`;
    };



    const renderRibbon = (label: string | null) => {
        if (!label) return null;
        const upper = label.toUpperCase();
    

        return (
            <BadgeCard
                className={`absolute -top-4 left-65 font-extrabold text-xl w-fit tracking-wide -rotate-3`}
               
            >
                {upper}
            </BadgeCard>
        );
    };

    const renderCampaignCard = (campaign: ICampaign) => {
        const isActive = getCampaignStatus(campaign) === "active";

        return (
            <div
                key={campaign.id}
                className={`relative bg-white relative  card-campaign border-2 rounded-3xl px-8 pb-8 flex flex-col  space-y-3 transition-colors ${isActive
                        ? "border-primary shadow-primary"
                        : "border-primary "
                    }`}
            >
                {renderRibbon(campaign.categories)}

                <span className="inline-block text-xs text-fredoka font-medium w-fit text-primary bg-muted/50 px-3 py-1 rounded-full">
                    {campaign.date ? formatDate(campaign.date) : ""} - {campaign.expired ? formatDate(campaign.expired) : ""}
                </span>

                <h3 className="text-4xl text-lilita font-extrabold text-primary leading-tight">
                    {campaign.title}
                </h3>

           
                    <div className=" text-primary text-fredoka " dangerouslySetInnerHTML={{ __html: campaign.description || "" }} />

                <div className="flex items-center text-fredoka justify-between pt-2">
                    <div className="flex items-center gap-3 text-primary text-sm font-medium">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatCount(campaign.views)}
                        </span>
                        <span className="flex items-center gap-1">
                            <MousePointerClick className="w-4 h-4" />
                            {formatCount(campaign.click)}
                        </span>
                    </div>

                    <Button
                        onClick={() => router.push(`/campaign/${campaign.id}`)}
                        className="rounded-xl bg-primary text-fredoka hover:bg-primary/90 text-white font-semibold px-6"
                    >
                        Detail
                    </Button>
                </div>
            </div>
        );
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

    return (
        <div className="relative z-10 w-full px-15 mx-auto  py-8">

               <h1 className="text-4xl sm:text-6xl  w-full text-primary leading-5 mb-10" >EVENT <span className='text-5xl sm:text-7xl bg-title'> CAMPAIGN</span></h1>
            {/* Search + Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search everything..."
                        className="rounded-full text-fredoka border-2 border-primary pl-11 py-5 "
                    />
                </div>

                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full text-primary fredoka-bold sm:w-48 rounded-full border-2 border-primary/40 py-5">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-primary ">
                        <SelectItem className="fredoka-bold" value="all">All Category</SelectItem>
                        {categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat} className="fredoka-bold">
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="relative">
                <div className="w-full h-0.5 bg-secondary/80 absolute top-15"></div>
                {/* Tabs: Active / Upcoming / Past Event */}
                <div className="grid grid-cols-3 gap-4 mb-8">

                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-4  text-left text-fredoka font-semibold text-lg transition-colors ${activeTab === tab.key
                                    ? "bg-muted text-primary"
                                    : "bg-muted/50 text-primary hover:bg-muted/80"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* Grid Campaign */}
            {filteredCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-5">
                    {filteredCampaigns.map(renderCampaignCard)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">
                        No campaigns found
                    </h3>
                    <p className="text-primary text-center max-w-md">
                        {activeTab === "active" && "There are no active campaigns right now."}
                        {activeTab === "upcoming" && "No upcoming campaigns scheduled."}
                        {activeTab === "past" && "No past campaigns to show."}
                    </p>
                </div>
            )}
        </div>
    );
}
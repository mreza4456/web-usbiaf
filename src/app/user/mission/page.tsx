"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Gift, LogIn, CheckCircle2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { IMissionWithProgress, MISSION_TYPE_LABEL, REWARD_TYPE_LABEL } from "@/interface";
import { claimMissionReward, getActiveMissionsForUser } from "@/action/mission";
import { BadgeCard } from "@/components/card-dashed";
import { Card } from "@/components/ui/card";

// Sesuai desain: hanya 2 tab. "Completed" sudah mencakup COMPLETED + CLAIMED.
type TabFilter = "ongoing" | "completed";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "ongoing", label: "On Going" },
    { key: "completed", label: "Completed" },
];

const MAX_STEPS = 5;
;

export default function MissionsPage() {
    const [missions, setMissions] = useState<IMissionWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<TabFilter>("ongoing");
    const [search, setSearch] = useState("");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<IMissionWithProgress | null>(null);
    const router = useRouter();

    const fetchMissions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getActiveMissionsForUser();

            if (!response?.success) {
                setUnauthorized(true);
                setMissions([]);
                return;
            }

            setUnauthorized(false);
            setMissions(response.data);
        } catch (error: any) {
            console.error("❌ Error:", error);
            toast.error(error.message || "Failed to load missions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    const getTab = useCallback((mission: IMissionWithProgress): TabFilter => {
        if (mission.status === "CLAIMED" || mission.status === "COMPLETED") return "completed";
        return "ongoing"; // NOT_STARTED & IN_PROGRESS
    }, []);

    const filteredMissions = useMemo(() => {
        const q = search.trim().toLowerCase();
        return missions.filter((m) => {
            if (getTab(m) !== activeTab) return false;
            if (!q) return true;
            return (
                m.title.toLowerCase().includes(q) ||
                (m.description ?? "").toLowerCase().includes(q)
            );
        });
    }, [missions, activeTab, search, getTab]);

    const formatDaysLeft = (endDate?: string | null) => {
        if (!endDate) return "Unlimited";
        const diff = new Date(endDate).getTime() - Date.now();
        if (diff <= 0) return "Expired";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        if (days > 0) return `${days} Days Left`;
        return `${hours} Hours Left`;
    };

    const formatReward = (mission: IMissionWithProgress) => {
        const reward = mission.reward;
        if (!reward) return "-";
        if (reward.type === "ITEM") return `${reward.name ?? "Item"}`;
        if (reward.type === "VOUCHER") return `Voucher ${reward.voucher_value ?? ""}`;
        const amount = reward.value?.amount;
        return `+${amount ?? ""} ${REWARD_TYPE_LABEL[reward.type]}`.trim();
    };

    // Ubah progress/target menjadi maksimal 5 lingkaran langkah
    const getSteps = (mission: IMissionWithProgress) => {
        const target = Math.max(1, mission.target);
        const total = Math.min(target, MAX_STEPS);
        const ratio = Math.min(1, mission.progress / target);
        const filled = target <= MAX_STEPS ? Math.min(mission.progress, total) : Math.floor(ratio * total);
        return { total, filled };
    };

    const handleClaim = async (mission: IMissionWithProgress) => {
        if (!mission.user_mission?.id) return;
        try {
            setClaimingId(mission.id);
            const response = await claimMissionReward(mission.user_mission.id);
            if (!response.success) throw new Error(response.message);

            if (response.data?.voucher_code) {
                toast.success(`Reward diklaim! Kode voucher: ${response.data.voucher_code}`);
            } else {
                toast.success("Reward berhasil diklaim!");
            }
            setSelected(null);
            fetchMissions();
        } catch (error: any) {
            toast.error(error.message || "Gagal klaim reward");
        } finally {
            setClaimingId(null);
        }
    };

    const renderMissionCard = (mission: IMissionWithProgress) => {
        const { total, filled } = getSteps(mission);
        const canClaim = mission.status === "COMPLETED";
        const claimed = mission.status === "CLAIMED";

        return (
            <div key={mission.id} className="relative card-campaign border-3 border-primary px-7 pb-5 flex flex-col gap-3 justify-between rounded-4xl">
                {/* Ribbon tipe mission */}
            
              
                     <BadgeCard className="absolute w-fit -top-4 left-[70%] text-2xl -rotate-5 "
                >
                    RAFFLE
                </BadgeCard>
                    <span className="w-fit bg-[#e6dcff] text-primary text-fredoka text-xs font-bold px-3 py-1 rounded-full">
                        {formatDaysLeft(mission.end_date)}
                    </span>

                    <h3 className="text-3xl sm:text-4xl text-lilita font-extrabold text-primary leading-tight">
                        {mission.title}
                    </h3>

                    <p className="text-primary text-fredoka text-xs line-clamp-2">
                        {mission.description}
                    </p>

                    {/* Lingkaran langkah 1..N */}
                    <div className="flex items-center gap-3 mt-1" aria-label={`Progress ${mission.progress} dari ${mission.target}`}>
                        {Array.from({ length: total }).map((_, i) => {
                            const done = i < filled;
                            return (
                                <span
                                    key={i}
                                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-lilita text-xl ${done
                                        ? "bg-[#c9b8ff] border-primary text-primary"
                                        : "bg-[#efe8ff] border-[#c9b8ff] text-[#c9b8ff]"
                                        }`}
                                >
                                    {i + 1}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                        {canClaim && (
                            <Button
                                onClick={() => handleClaim(mission)}
                                disabled={claimingId === mission.id}
                                className="rounded-full bg-[#dccbff] hover:bg-[#cdb7ff] text-primary text-fredoka font-bold px-5"
                            >
                                <Sparkles className="w-4 h-4 mr-1" />
                                {claimingId === mission.id ? "Claiming..." : "Claim"}
                            </Button>
                        )}
                        {claimed && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium mr-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Claimed
                            </span>
                        )}
                        <Button
                            onClick={() => setSelected(mission)}
                            className="rounded-full bg-primary text-white text-fredoka font-bold text-white px-6"
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
                    <div className="h-14 bg-primary/10 rounded-full w-full max-w-md"></div>
                    <div className="flex justify-between gap-4">
                        <div className="h-12 bg-primary/10 rounded-full w-full max-w-sm"></div>
                        <div className="h-12 bg-primary/10 rounded-full w-64"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-72 bg-primary/10 rounded-3xl"></div>
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
                <h3 className="text-xl font-bold text-primary">Login untuk melihat mission kamu</h3>
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
        <div className="relative z-10 w-full px-6 sm:px-15 mx-auto py-8">
            {/* Judul */}
            <h1 className="text-4xl sm:text-6xl text-lilita text-primary uppercase mb-8">
                Mission <span className="bg-title px-2">FOR YOU</span>
            </h1>

            {/* Search + toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
                <label className="flex items-center gap-3 w-full sm:max-w-md h-12 rounded-full border-2 border-primary bg-white px-4 focus-within:ring-2 focus-within:ring-primary/30">
                    <Search className="w-6 h-6 text-primary shrink-0" strokeWidth={3} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search everything..."
                        className="w-full bg-transparent outline-none text-fredoka text-sm text-primary placeholder:text-primary/50"
                    />
                </label>

                <div className="flex h-12 w-full sm:w-80 rounded-full border-2 border-primary overflow-hidden bg-white">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 text-fredoka font-bold text-sm text-primary transition-colors ${i > 0 ? "border-l-2 border-primary" : ""} ${activeTab === tab.key ? "bg-[#dccbff]" : "bg-white hover:bg-[#f3edff]"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Daftar kartu */}
            {filteredMissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-12 pb-8">
                    {filteredMissions.map(renderMissionCard)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Belum ada mission di sini</h3>
                    <p className="text-primary text-center max-w-md">
                        {search
                            ? "Tidak ada mission yang cocok dengan pencarianmu."
                            : activeTab === "ongoing"
                                ? "Belum ada mission yang sedang berjalan. Coba lakukan aktivitas seperti login atau order!"
                                : "Belum ada mission yang selesai."}
                    </p>
                </div>
            )}

            {/* Modal Detail */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-lg bg-white border-2 border-primary rounded-3xl p-7 flex flex-col gap-4"
                     
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute top-4 right-4 text-primary"
                            aria-label="Tutup"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <span className="w-fit bg-[#e6dcff] text-primary text-fredoka text-xs font-bold px-3 py-1 rounded-full">
                            {MISSION_TYPE_LABEL[selected.mission_type]} · {formatDaysLeft(selected.end_date)}
                        </span>
                        <h3 className="text-3xl text-lilita font-extrabold text-primary leading-tight pr-8">
                            {selected.title}
                        </h3>
                        <p className="text-primary text-fredoka text-sm">{selected.description}</p>

                        <div className="flex justify-between text-fredoka text-primary text-sm">
                            <span>Progress</span>
                            <span className="font-semibold">{selected.progress} / {selected.target}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-[#e6dcff] rounded-2xl px-3 py-2 text-sm text-primary w-fit">
                            <Gift className="w-4 h-4 shrink-0" />
                            <span>{formatReward(selected)}</span>
                        </div>

                        {selected.status === "COMPLETED" && (
                            <Button
                                onClick={() => handleClaim(selected)}
                                disabled={claimingId === selected.id}
                                className="rounded-full bg-primary text-white font-bold w-full"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {claimingId === selected.id ? "Claiming..." : "Claim Reward"}
                            </Button>
                        )}
                        {selected.status === "CLAIMED" && (
                            <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Reward Already Claimed
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
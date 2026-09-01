"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Gift, Clock, LogIn, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IMissionWithProgress, MISSION_TYPE_LABEL, REWARD_TYPE_LABEL } from "@/interface";
import { claimMissionReward, getActiveMissionsForUser } from "@/action/mission";

type TabFilter = "in_progress" | "completed" | "claimed";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "claimed", label: "Claimed" },
];

export default function MissionsPage() {
    const [missions, setMissions] = useState<IMissionWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<TabFilter>("in_progress");
    const [claimingId, setClaimingId] = useState<string | null>(null);
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

    const getTabStatus = useCallback((mission: IMissionWithProgress): TabFilter => {
        if (mission.status === "CLAIMED") return "claimed";
        if (mission.status === "COMPLETED") return "completed";
        return "in_progress"; // NOT_STARTED & IN_PROGRESS digabung
    }, []);

    const filteredMissions = useMemo(() => {
        return missions.filter((m) => getTabStatus(m) === activeTab);
    }, [missions, activeTab, getTabStatus]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatCountdown = (endDate?: string | null) => {
        if (!endDate) return "Tidak terbatas";
        const diff = new Date(endDate).getTime() - Date.now();
        if (diff <= 0) return "Berakhir";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        if (days > 0) return `${days} hari ${hours} jam lagi`;
        return `${hours} jam lagi`;
    };

    const formatReward = (mission: IMissionWithProgress) => {
        const reward = mission.reward;
        if (!reward) return "-";
        const amount = reward.value?.amount;
        return `+${amount ?? ""} ${REWARD_TYPE_LABEL[reward.type]}`.trim();
    };

    const handleClaim = async (mission: IMissionWithProgress) => {
        if (!mission.user_mission?.id) return;
        try {
            setClaimingId(mission.id);
            const response = await claimMissionReward(mission.user_mission.id);
            if (!response.success) throw new Error(response.message);
            toast.success("Reward berhasil diklaim!");
            fetchMissions();
        } catch (error: any) {
            toast.error(error.message || "Gagal klaim reward");
        } finally {
            setClaimingId(null);
        }
    };

    const statusBadge = (status: IMissionWithProgress["status"]) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-700";
            case "CLAIMED":
                return "bg-gray-100 text-gray-600";
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-blue-100 text-blue-700";
        }
    };

    const statusLabel: Record<string, string> = {
        NOT_STARTED: "Belum Dimulai",
        IN_PROGRESS: "In Progress",
        COMPLETED: "Selesai",
        CLAIMED: "Diklaim",
        EXPIRED: "Berakhir",
    };

    const renderMissionCard = (mission: IMissionWithProgress) => {
        const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
        const canClaim = mission.status === "COMPLETED";

        return (
            <div
                key={mission.id}
                className="relative bg-white p-5 card-campaign border-2 border-primary rounded-3xl flex flex-col space-y-3"
            >
                <div className="flex w-full justify-between items-center">
                    <span className="inline-block text-xs text-fredoka font-medium w-fit text-primary bg-muted/50 px-3 py-1 rounded-full">
                        {MISSION_TYPE_LABEL[mission.mission_type]}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${statusBadge(mission.status)}`}>
                        <Clock className="w-4 h-4" />
                        {statusLabel[mission.status] ?? mission.status}
                    </span>
                </div>

                <h3 className="text-2xl text-lilita font-extrabold text-primary leading-tight">
                    {mission.title}
                </h3>

                <p className="text-primary text-fredoka line-clamp-2">
                    {mission.description}
                </p>

                {/* Progress bar */}
                <div>
                    <div className="flex justify-between text-sm text-fredoka text-primary mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{mission.progress} / {mission.target}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 bg-[#e6dcff] rounded-2xl px-3 py-2 text-sm text-primary">
                        <Gift className="w-4 h-4 shrink-0" />
                        <span>{formatReward(mission)}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatCountdown(mission.end_date)}</span>
                </div>

                {canClaim && (
                    <Button
                        onClick={() => handleClaim(mission)}
                        disabled={claimingId === mission.id}
                        className="rounded-full bg-primary text-white font-bold w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {claimingId === mission.id ? "Mengklaim..." : "Claim Reward"}
                    </Button>
                )}

                {mission.status === "CLAIMED" && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Reward sudah diklaim
                    </div>
                )}
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
        <div className="relative z-10 w-full px-15 mx-auto py-8">
            <h1 className="text-4xl sm:text-6xl w-full text-primary leading-5 uppercase mb-10">
                Mission <span className="text-5xl sm:text-7xl bg-title">CENTER</span>
            </h1>

            <div className="relative">
                <div className="w-full h-0.5 bg-secondary/80 absolute top-15"></div>
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

            {filteredMissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-5">
                    {filteredMissions.map(renderMissionCard)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Belum ada mission di sini</h3>
                    <p className="text-primary text-center max-w-md">
                        {activeTab === "in_progress" && "Belum ada mission yang sedang berjalan. Coba lakukan aktivitas seperti login atau order!"}
                        {activeTab === "completed" && "Belum ada mission yang selesai dan siap diklaim."}
                        {activeTab === "claimed" && "Belum ada reward yang sudah diklaim."}
                    </p>
                </div>
            )}
        </div>
    );
}
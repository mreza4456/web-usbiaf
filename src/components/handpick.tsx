"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Flame } from "lucide-react";
import { getHandpickCategories } from "@/action/categories";
import { getAllClasses } from "@/action/badge"; // BARU: fetch badges
import { ICategory, IImageCategories, IClassService, IBadge } from "@/interface";
import CardDashed, { BadgeCard } from "@/components/card-dashed";
import SkeletonService from "@/components/skeleton-card";

type HandpickCategory = ICategory & {
    images: IImageCategories[];
    classServices: IClassService[];
};

export default function HandpickDisplay() {
    const [categories, setCategories] = useState<HandpickCategory[]>([]);
    const [badges, setBadges] = useState<IBadge[]>([]); // BARU
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHandpick = async () => {
            try {
                const res = await getHandpickCategories();
                if (res.success && Array.isArray(res.data)) {
                    setCategories(res.data as HandpickCategory[]);
                } else {
                    setCategories([]);
                    setError(res.message || "Gagal memuat data handpick");
                }
            } catch (err) {
                console.error("Failed to fetch handpick categories:", err);
                setCategories([]);
                setError("Gagal memuat data handpick");
            } finally {
                setLoading(false);
            }
        };

        // BARU: fetch badges untuk lookup nama badge
        const fetchBadges = async () => {
            try {
                const res = await getAllClasses();
                if (res.success && Array.isArray(res.data)) {
                    setBadges(res.data);
                } else {
                    setBadges([]);
                }
            } catch (err) {
                console.error("Failed to fetch badges:", err);
                setBadges([]);
            }
        };

        fetchHandpick();
        fetchBadges();
    }, []);

    // BARU: map badge_id -> nama badge
    const badgeMap = useMemo(() => {
        const map = new Map<string, string>();
        badges.forEach((b) => map.set(String(b.id), b.name));
        return map;
    }, [badges]);

    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount || 0);
    };


    if (loading) {
        return (
            <div className="max-w-7xl ">
                <SkeletonService height={90} className="grid grid-cols-1 sm:grid-cols-3" count={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-red-400">
                {error}
            </div>
        );
    }



    return (
        <div className="max-w-7xl ">


            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                    const primaryImage = category.images?.[0]?.image_url || "";
                    const badgeName = badgeMap.get(String((category as any).badge_id)); // BARU

                    return (
                        <Link key={category.id} href={`/service/detail/${category.id}`}>
                            <div className="relative h-full hover:scale-[1.05] transition cursor-pointer">
                                <CardDashed>
                                    <div className="relative aspect-square">
                                        {primaryImage ? (
                                            <Image
                                                className="object-cover rounded rounded-[14%]"
                                                src={primaryImage}
                                                alt={category.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = "/placeholder-image.svg";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <ImageIcon className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}

                                        {/* BARU: ambil dari badge_id, bukan teks statis */}
                                        {badgeName && (
                                            <BadgeCard className="inline-flex absolute top-[-12px] -rotate-4 left-4 z-10 items-center rounded-full text-[10px] sm:text-sm">
                                                {badgeName}
                                            </BadgeCard>
                                        )}
                                    </div>
                                </CardDashed>

                                <div className="p-3 text-lilita">
                                    <h3 className="sm:text-2xl text-lg text-primary line-clamp-2">
                                        {category.name?.split(" ").slice(0, 4).join(" ")}
                                    </h3>
                                    <h4 className="text-primary bg-title w-fit text-2xl md:text-3xl">
                                        {formatCurrency(category.start_price as any)}
                                    </h4>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
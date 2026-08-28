"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { getCategoriesGroupedByBadge } from "@/action/categories";
import { ICategory, IImageCategories, IClassService, IClass, IBadge } from "@/interface";
import CardDashed, { BadgeCard, CardSecondary } from "@/components/card-dashed";
import SkeletonService from "@/components/skeleton-card";
import { useRouter } from "next/navigation";

type GroupedCategory = ICategory & {
    images: IImageCategories[];
    classServices: IClassService[];
};

interface BadgeGroup {
    badge: IBadge;
    categories: GroupedCategory[];
    classes: IClass[];
}

export default function BadgeDisplay() {
    const [groups, setGroups] = useState<BadgeGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

const router = useRouter();
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await getCategoriesGroupedByBadge();
                if (res.success && Array.isArray(res.data)) {
                    setGroups(res.data as BadgeGroup[]);
                } else {
                    setGroups([]);
                    setError(res.message || "Gagal memuat data badge");
                }
            } catch (err) {
                console.error("Failed to fetch grouped categories:", err);
                setGroups([]);
                setError("Gagal memuat data badge");
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount || 0);
    };

//  const handleclass = () => {
//   router.push(`service?classes=${class.id}`);
// };
    if (loading) {
        return (
            <div className="max-w-7xl w-full">
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

    if (groups.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-gray-500">
                Belum ada badge dengan minimal 3 kategori.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto   py-12 space-y-16">
            {groups.map(({ badge, categories, classes }) => (
                <section key={badge.id}>
                    {/* Header Badge */}
                    <div className="flex flex-col gap-2 mb-10">

                        <div className="lg:grid-cols-5 grid-cols-1  grid  items-center lg:gap-10">
                            <div className="inline-block mb-5 lg:col-span-2">
                                <div className='relative  w-fit'>
                                    <h1 className="text-6xl sm:text-7xl w-full text-primary mb-4" >{badge.name}</h1>
                                    <div className='w-[70%] float-end -mt-5 h-3 bg-muted rounded-xs text-accent'></div>
                                </div>
                            </div>

                            <div className="lg:col-span-3">
                                {/* BARU: daftar class unik dalam badge ini */}
                                {classes.length > 0 && (
                                    <div className="md:grid-cols-4 grid-cols-2 grid gap-5">
                                        {classes.map((c) => (
                                            <CardSecondary
                                                key={c.id}
                                                className={` relative  cursor-pointer transition `}
                                               onClick={() => router.push(`/service?classes=${c.id}`)}
                                            >
                                                <div className={` p-5 text-xs md:text-lg pb-3 px-3   text-lilita text-primary `}>
                                                    {c.class_name}
                                                </div>
                                            </CardSecondary>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid kategori (max 3) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {categories.map((category) => {
                            const primaryImage = category.images?.[0]?.image_url || "";
                            //  const className = classMap.get(String((category as any).badge_id));

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

                                             
                                                    <BadgeCard className="inline-flex absolute top-[-12px] -rotate-4 left-4 z-10 items-center rounded-full text-[10px] sm:text-sm">
                                                      {badge.name}
                                                    </BadgeCard>
                                                
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
                    <Link href={`/service?badge=${badge.id}`} className="text-primary float-end mt-5"><p>{"<"}Show More{">"}</p></Link>
                </section>
            ))}
        </div>
    );
}
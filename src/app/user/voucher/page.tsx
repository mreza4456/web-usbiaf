"use client";
import React, { useState, useEffect } from 'react';
import { Ticket, Gift, Copy, Check, Sparkles, Calendar, Tag, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { getUserVouchers } from '@/action/vouchers';
import { useAuthStore } from '@/store/auth';
import { IVoucher } from '@/interface';
import Link from 'next/link';
import { supabase } from '@/config/supabase';
import { redirect } from 'next/dist/server/api-utils';
import { useRouter } from 'next/navigation';
import VoucherEventsList from '@/components/voucher-events-list';

export default function VoucherPage() {
    const [vouchers, setVouchers] = useState<IVoucher[]>([]);
    const [copiedCode, setCopiedCode] = useState('');
    const [activeTab, setActiveTab] = useState('available');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const [isLoadingVouchers, setIsLoadingVouchers] = React.useState(false)
    const user = useAuthStore((s) => s.user);

    React.useEffect(() => {
        if (user?.id) {
            fetchVouchers()
        }
    }, [user?.id])

    const fetchVouchers = async () => {
        if (!user?.id) return

        setIsLoadingVouchers(true)
        try {
            const { data, error } = await supabase
                .from("vouchers")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching vouchers:", error)
            } else {
                setVouchers(data || [])
            }
        } catch (err) {
            console.error("Unexpected error:", err)
        } finally {
            setIsLoadingVouchers(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    const availableVouchers = vouchers.filter(v => !v.is_used && new Date(v.expired_at) > new Date());
    const usedVouchers = vouchers.filter(v => v.is_used);
    const expiredVouchers = vouchers.filter(v => !v.is_used && new Date(v.expired_at) <= new Date());

    const getDaysRemaining = (expiredAt: string) => {
        const today = new Date();
        const expiryDate = new Date(expiredAt);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };


    // Loading state
    if (isLoadingVouchers) {
        return (
             <div className="min-h-screen max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/50 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-white/50 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-20 bg-white/50 rounded"></div>
            <div className="h-20 bg-white/50 rounded"></div>
            <div className="h-20 bg-white/50 rounded"></div>
          </div>
        </div>
      </div>
        );
    }

    return (
        <div className="relative z-10 w-full max-w-7xl mx-auto text-primary px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="relative overflow-hidden  ">



                <div className="max-w-7xl mx-auto px-4 relative">
                        <h1 className="text-3xl font-bold text-primary mb-6">My Vouchers</h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 mb-5">
                        <div className="bg-white shadow-lg rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Ticket className="w-8 h-8 text-green-400" />
                                <span className="text-3xl font-bold text-green-400">{availableVouchers.length}</span>
                            </div>
                            <p className="text-gray-300 font-medium">Voucher Tersedia</p>
                            <p className="text-gray-500 text-sm mt-1">Siap digunakan</p>
                        </div>

                        <div className="bg-white shadow-lg rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Check className="w-8 h-8 text-gray-400" />
                                <span className="text-3xl font-bold text-gray-400">{usedVouchers.length}</span>
                            </div>
                            <p className="text-gray-300 font-medium">Voucher Terpakai</p>
                            <p className="text-gray-500 text-sm mt-1">Sudah digunakan</p>
                        </div>

                        <div className="bg-white shadow-lg rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                                <span className="text-3xl font-bold text-red-400">{expiredVouchers.length}</span>
                            </div>
                            <p className="text-gray-300 font-medium">Voucher Kadaluarsa</p>
                            <p className="text-gray-500 text-sm mt-1">Sudah tidak berlaku</p>
                        </div>
                    </div>
                </div>
            </div>

            <VoucherEventsList />
            {/* Error Message */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'available'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Tersedia ({availableVouchers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('used')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'used'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Terpakai ({usedVouchers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('expired')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'expired'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Kadaluarsa ({expiredVouchers.length})
                    </button>
                </div>

                {/* Vouchers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Available Vouchers */}
                    {activeTab === 'available' && availableVouchers.length > 0 && availableVouchers.map((voucher) => {
                        const daysLeft = getDaysRemaining(voucher.expired_at);
                        return (
                            <div
                                key={voucher.id}
                                className="relative bg-white border-secondary  border-2 rounded-2xl p-6 hover:border-primary  transition-all group"
                            >
                              

                                {/* Discount Value */}
                                <div className="mb-4">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-5xl font-bold text-primary">{voucher.value}</span>
                                        <span className="text-2xl text-gray-700">OFF</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>From {voucher.milestone_order}th Orders</span>
                                    </div>
                                </div>


                                {/* Expiry Info */}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>Expired At {formatDate(voucher.expired_at)}</span>
                                </div>
                                {daysLeft <= 7 && daysLeft > 0 && (
                                    <div className="mt-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2">
                                        <p className="text-yellow-400 text-xs font-semibold">
                                            ⚠️ is Over After {daysLeft} Days!
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Used Vouchers */}
                    {activeTab === 'used' && usedVouchers.map((voucher) => (
                        <div
                            key={voucher.id}
                            className="relative bg-gradient-to-br from-gray-800/20 to-gray-700/10 border-2 border-gray-700/50 rounded-2xl p-6 opacity-70"
                        >
                            <div className="absolute top-4 right-4 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                TERPAKAI
                            </div>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-5xl font-bold text-gray-400">{voucher.value}</span>
                                    <span className="text-2xl text-gray-500">OFF</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Tag className="w-4 h-4" />
                                    <span>From {voucher.milestone_order}th Orders</span>
                                </div>
                            </div>

                            <div className="bg-black/30 border border-gray-700 rounded-lg p-4 mb-4">
                                <span className="text-gray-500 font-mono text-lg break-all">{voucher.code}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Sudah digunakan</span>
                            </div>
                        </div>
                    ))}

                    {/* Expired Vouchers */}
                    {activeTab === 'expired' && expiredVouchers.map((voucher) => (
                        <div
                            key={voucher.id}
                            className="relative bg-gradient-to-br from-red-900/20 to-red-800/10 border-2 border-red-700/50 rounded-2xl p-6 opacity-60"
                        >
                            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                EXPIRED
                            </div>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-5xl font-bold text-red-400">{voucher.value}</span>
                                    <span className="text-2xl text-gray-500">OFF</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Tag className="w-4 h-4" />
                                    <span>The {voucher.milestone_order}th Orders</span>
                                </div>
                            </div>

                            <div className="bg-black/30 border border-red-700/50 rounded-lg p-4 mb-4">
                                <span className="text-gray-500 font-mono text-lg break-all">{voucher.code}</span>
                            </div>

                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Expired: {formatDate(voucher.expired_at)}</span>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {((activeTab === 'available' && availableVouchers.length === 0) ||
                        (activeTab === 'used' && usedVouchers.length === 0) ||
                        (activeTab === 'expired' && expiredVouchers.length === 0)) && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6">
                                    <Ticket className="w-12 h-12 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-400 mb-2">
                                    Tidak ada voucher
                                </h3>
                                <p className="text-gray-500 text-center max-w-md mb-6">
                                    {activeTab === 'available' && 'Belum ada voucher yang tersedia. Selesaikan pesanan untuk mendapatkan voucher.'}
                                    {activeTab === 'used' && 'Belum ada voucher yang digunakan.'}
                                    {activeTab === 'expired' && 'Tidak ada voucher yang kadaluarsa.'}
                                </p>
                                {activeTab === 'available' && (
                                    <Link
                                        href="/order"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D78FEE] to-[#8B5CF6] text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Mulai Order Sekarang
                                    </Link>
                                )}
                            </div>
                        )}
                </div>

                {/* Info Section */}
            </div>
        </div>
    );
}
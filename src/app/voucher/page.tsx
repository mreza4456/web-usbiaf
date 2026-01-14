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
            <div className="min-h-screen  text-primary flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#D78FEE] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Memuat voucher...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full max-w-7xl mx-auto text-primary mt-10">
            {/* Header Section */}
            <div className="relative overflow-hidden ">



                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Ticket className="w-8 h-8 text-secondary" />
                            <h1 className="text-4xl font-bold text-primary">
                                My Voucher
                            </h1>
                        </div>
                        <p className="text-gray-500">Track and manage your commission orders</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-6 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-2">
                                <Gift className="w-8 h-8 text-green-400" />
                                <span className="text-3xl font-bold text-green-400">{availableVouchers.length}</span>
                            </div>
                            <p className="text-gray-300 font-medium">Voucher Tersedia</p>
                            <p className="text-gray-500 text-sm mt-1">Siap digunakan</p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/30 to-gray-700/20 border border-gray-700/50 rounded-xl p-6 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-2">
                                <Check className="w-8 h-8 text-gray-400" />
                                <span className="text-3xl font-bold text-gray-400">{usedVouchers.length}</span>
                            </div>
                            <p className="text-gray-300 font-medium">Voucher Terpakai</p>
                            <p className="text-gray-500 text-sm mt-1">Sudah digunakan</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/50 rounded-xl p-6 hover:scale-105 transition-transform">
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
                                className="relative bg-muted/50 border-secondary  border-2 rounded-2xl p-6 hover:border-primary  transition-all group"
                            >
                                {/* Corner Badge */}
                                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    ACTIVE
                                </div>

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

                                {/* Voucher Code */}
                                <div
                                    onClick={() => copyToClipboard(voucher.code)}
                                    className="relative  border-2 border-dashed border-secondary rounded-lg p-4 mb-4 cursor-pointer  transition-all group-hover:border-primary"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-black font-mono text-lg font-bold break-all">{voucher.code}</span>
                                        {copiedCode === voucher.code ? (
                                            <Check className="w-5 h-5 text-black flex-shrink-0 ml-2" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0 ml-2" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Klik untuk menyalin kode</p>
                                </div>

                                {/* Expiry Info */}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>Berlaku hingga {formatDate(voucher.expired_at)}</span>
                                </div>
                                {daysLeft <= 7 && daysLeft > 0 && (
                                    <div className="mt-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2">
                                        <p className="text-yellow-400 text-xs font-semibold">
                                            ⚠️ Segera berakhir dalam {daysLeft} hari!
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
                <div className="mt-12 bg-muted/50  rounded-2xl p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#D78FEE] to-[#8B5CF6] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-primary mb-2">How To Use</h3>
                            <ul className="space-y-2 text-gray-500">
                                <li>• Pilih voucher yang ingin digunakan</li>
                                <li>• Klik pada kode voucher untuk menyalin</li>
                                <li>• Tempelkan kode voucher saat checkout</li>
                                <li>• Diskon akan otomatis diterapkan ke pesanan Anda</li>
                            </ul>
                            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    💡 <strong>Tips:</strong> Voucher dengan milestone lebih tinggi memberikan diskon lebih besar. Selesaikan lebih banyak pesanan untuk mendapatkan voucher premium!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// components/VoucherEventsList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Tag, Loader2, CheckCircle } from 'lucide-react';
import { getActiveVoucherEvents } from '@/action/voucher-events';
import { claimVoucherEvent, checkVoucherEventClaimed } from '@/action/vouchers';
import { useAuthStore } from '@/store/auth';
import { IVoucherEvents } from '@/interface';

export default function VoucherEventsList() {
  const [voucherEvents, setVoucherEvents] = useState<IVoucherEvents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedVouchers, setClaimedVouchers] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchVoucherEvents();
  }, [user?.id]);

  const fetchVoucherEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getActiveVoucherEvents({ search: '' });
      if (result.success && result.data) {
        setVoucherEvents(result.data);
        
        // Check which vouchers user has already claimed
        if (user?.id) {
          const claimed = new Set<string>();
          for (const event of result.data) {
            const check = await checkVoucherEventClaimed(user.id, event.id);
            if (check.claimed) {
              claimed.add(event.id);
            }
          }
          setClaimedVouchers(claimed);
        }
      }
    } catch (error) {
      console.error('Error fetching voucher events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimVoucher = async (voucherEventId: string) => {
    if (!user?.id) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setClaimingId(voucherEventId);
    try {
      const result = await claimVoucherEvent(user.id, voucherEventId);
      
      if (result.success) {
        alert(result.message);
        setClaimedVouchers(prev => new Set([...prev, voucherEventId]));
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengklaim voucher');
    } finally {
      setClaimingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#D78FEE] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Voucher Events</h2>
        <p className="text-gray-500">Ambil voucher spesial yang tersedia untuk waktu terbatas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voucherEvents.map((event) => {
          const isClaimed = claimedVouchers.has(event.id);
          const isClaiming = claimingId === event.id;
          const isExpired = new Date(event.expired_at) < new Date();

          return (
            <div
              key={event.id}
              className="relative bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-2 border-purple-700/50 rounded-2xl p-6 hover:scale-105 transition-transform"
            >
              {/* Type Badge */}
           

              {/* Event Name */}
              <h3 className="text-xl font-bold text-primary mb-4 pr-16">
                {event.name}
              </h3>

              {/* Discount Value */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-[#D78FEE]">{event.value}</span>
                  <span className="text-2xl text-gray-400">OFF</span>
                </div>
              </div>

              {/* Code Preview */}
              <div className="bg-black/30 border border-purple-700/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Tag className="w-4 h-4" />
                  <span>Kode Voucher</span>
                </div>
                <span className="text-purple-300 font-mono text-sm">{event.code}-XXXX</span>
              </div>

              {/* Expiry Date */}
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <Calendar className="w-4 h-4" />
                <span>Berlaku hingga {formatDate(event.expired_at)}</span>
              </div>

              {/* Claim Button */}
              <button
                onClick={() => handleClaimVoucher(event.id)}
                disabled={isClaimed || isClaiming || isExpired || !user}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isClaimed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed'
                    : isExpired
                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D78FEE] to-[#8B5CF6] text-white hover:scale-105'
                }`}
              >
                {isClaiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengklaim...
                  </span>
                ) : isClaimed ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Sudah Diklaim
                  </span>
                ) : isExpired ? (
                  'Sudah Berakhir'
                ) : !user ? (
                  'Login untuk Klaim'
                ) : (
                  'Klaim Voucher'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {voucherEvents.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada voucher event yang tersedia</p>
        </div>
      )}
    </div>
  );
}
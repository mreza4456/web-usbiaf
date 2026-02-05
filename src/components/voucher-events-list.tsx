// components/VoucherEventsList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Tag, Loader2, CheckCircle } from 'lucide-react';
import { getActiveVoucherEvents } from '@/action/voucher-events';
import { claimVoucherEvent, checkVoucherEventClaimed } from '@/action/vouchers';
import { useAuthStore } from '@/store/auth';
import { IVoucherEvents } from '@/interface';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { toast } from 'sonner';

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
      toast('Silakan login terlebih dahulu');
      return;
    }

    setClaimingId(voucherEventId);
    try {
      const result = await claimVoucherEvent(user.id, voucherEventId);
      
      if (result.success) {
        toast(result.message);
        setClaimedVouchers(prev => new Set([...prev, voucherEventId]));
      } else {
        toast(result.message);
      }
    } catch (error) {
      toast('Terjadi kesalahan saat mengklaim voucher');
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

  if (voucherEvents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada voucher event yang tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 ">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mt-5">Claim Vouchers Now</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4 py-5">
          {voucherEvents.map((event) => {
            const isClaimed = claimedVouchers.has(event.id);
            const isClaiming = claimingId === event.id;
            const isExpired = new Date(event.expired_at) < new Date();

            return (
              <CarouselItem key={event.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="relative bg-muted/30 p-6 rounded-lg shadow-lg h-full flex flex-col">
                  {/* Event Name */}
                  <h3 className="text-xl font-bold text-primary mb-4">
                    {event.name}
                  </h3>

                  {/* Discount Value */}
                  <div className="mb-4 flex-grow">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-[#D78FEE]">{event.value}</span>
                      <span className="text-2xl text-gray-400">OFF</span>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>Expired: {formatDate(event.expired_at)}</span>
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
                        : 'bg-primary cursor-pointer text-white hover:scale-105'
                    }`}
                  >
                    {isClaiming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </span>
                    ) : isClaimed ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Claimed
                      </span>
                    ) : isExpired ? (
                      'Is Over'
                    ) : !user ? (
                      'Login For Claim'
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Gift, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { getAllOrdersWithItems } from '@/action/order';
import { getMilestoneRewards } from '@/action/vouchers';
import { IOrder } from '@/interface';
import Link from 'next/link';

export default function MilestonePage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [milestoneRewards, setMilestoneRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserOrders();
      loadMilestoneRewards();
    }
  }, [user?.id]);

  const loadUserOrders = async () => {
    try {
      const result = await getAllOrdersWithItems();
      if (result.success && result.data) {
        const userOrders = result.data.filter(order => order.user_id === user?.id);
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestoneRewards = async () => {
    try {
      const result = await getMilestoneRewards();
      if (result.success && result.data) {
        setMilestoneRewards(result.data);
      }
    } catch (error) {
      console.error('Error loading milestone rewards:', error);
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    return { total, completed };
  };

  const getVoucherValueForStep = (stepNumber: number) => {
    const reward = milestoneRewards.find(r => r.milestone_step === stepNumber && r.is_active);
    return reward?.voucher_value || '';
  };

  const stats = getOrderStats();

  if (loading) {
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto ">
        {/* Header */}
        <div className="mb-5">
        
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Stamp Journey</h1>
            </div>
            <Badge className="bg-primary text px-4 py-2">
              {stats.completed} Completed Orders
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Progress Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 shadow-sm mb-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Your Progress</h3>
              <span className="text-sm text-gray-600">Next reward at {Math.ceil(stats.completed / 3) * 3} orders</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${((stats.completed % 3) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Stamps Display - Show up to next milestone (groups of 12) */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3 mb-8">
              {[...Array(12)].map((_, index) => {
                const stepNumber = index + 1;
                const isCompleted = stats.completed >= stepNumber;
                const isGoal = (stepNumber % 3 === 0);
                const voucherValue = getVoucherValueForStep(stepNumber);

                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 flex items-center justify-center transition-all relative ${
                        isCompleted
                          ? isGoal
                            ? 'border-yellow-500 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg'
                            : 'border-purple-500 bg-purple-100'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {isCompleted ? (
                        <div className="text-center">
                          {isGoal ? (
                            <div className="text-2xl">🎁</div>
                          ) : (
                            <div className="text-xl text-purple-600">✓</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-400">{stepNumber}</span>
                      )}

                      {isGoal && voucherValue && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-yellow-400 text-yellow-900 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow">
                            {voucherValue}
                          </div>
                        </div>
                      )}
                    </div>

                    <span className={`text-xs font-medium text-center ${isCompleted ? 'text-purple-600' : 'text-gray-400'}`}>
                      {stepNumber}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Milestone Goals */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <span>🎯</span>
                Milestone Rewards
              </h4>

              {milestoneRewards
                .filter(r => r.is_active)
                .sort((a, b) => a.milestone_step - b.milestone_step)
                .map((reward) => {
                  const isAchieved = stats.completed >= reward.milestone_step;

                  return (
                    <div
                      key={reward.milestone_step}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isAchieved
                          ? 'bg-green-50 border-green-500 shadow-md'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{isAchieved ? '🏆' : '🎯'}</div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">Step {reward.milestone_step}</p>
                          <p className="text-sm text-gray-600">Voucher {reward.voucher_value} Discount</p>
                        </div>
                      </div>
                      {isAchieved ? (
                        <Badge className="bg-green-500 text-base px-4 py-2">Achieved!</Badge>
                      ) : (
                        <Badge variant="outline" className="text-base px-4 py-2">{stats.completed}/{reward.milestone_step}</Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <Alert className="border-purple-300 bg-purple-50">
            <Award className="h-5 w-5 text-purple-600" />
            <AlertDescription className="text-sm text-gray-700">
              Complete orders to collect stamps! Reach milestones to unlock exclusive voucher rewards. Keep ordering to earn more discounts! 🎁
            </AlertDescription>
          </Alert>

         
        </div>
      </div>
    </div>
  );
}
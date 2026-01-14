// components/checkout-success.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

interface CheckoutSuccessProps {
  orderRef: string;
  orderId: string;
  clearedItems: number;
  message: string;
}

export default function CheckoutSuccess({ 
  orderRef, 
  orderId, 
  clearedItems,
  message 
}: CheckoutSuccessProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white">
      <Card className="w-full max-w-md bg-white border-2 border-green-200 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto relative animate-bounce" />
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Order Placed!</h2>
              <p className="text-gray-600">{message}</p>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Reference:</span>
                <span className="font-mono font-semibold text-purple-600">{orderRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Items Ordered:</span>
                <span className="font-semibold">{clearedItems} {clearedItems === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cart Status:</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">✓ Cleared</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
              <p className="font-semibold text-blue-900 mb-2">What's Next?</p>
              <ul className="space-y-1 text-blue-800">
                <li>• We'll review your order details</li>
                <li>• You'll receive a Discord message shortly</li>
                <li>• We'll discuss your project requirements</li>
                <li>• Timeline and payment will be confirmed</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/orders')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                View My Orders
              </Button>

              <Button
                onClick={() => router.push('/service')}
                variant="outline"
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 py-6 text-lg"
              >
                Continue Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Auto Redirect Notice */}
            <p className="text-xs text-gray-500">
              Redirecting to orders in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
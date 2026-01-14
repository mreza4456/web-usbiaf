// ============================================
// FILE: /components/cart/CartSkeleton.tsx
// Skeleton loader untuk cart items
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function CartItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Image Skeleton */}
          <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse" />

          {/* Content Skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </div>

          {/* Remove Button Skeleton */}
          <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Quantity Controls Skeleton */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-9 h-9 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto" />
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-10 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <CartItemSkeleton />
            <CartItemSkeleton />
          </div>

          {/* Summary Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-px bg-gray-200" />
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: /components/cart/EmptyCart.tsx
// Empty cart component
// ============================================

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCartProps {
  onBrowseServices: () => void;
}

export function EmptyCart({ onBrowseServices }: EmptyCartProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 float-animation">
          <ShoppingCart className="w-16 h-16 text-purple-300" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-8">
          Add some amazing services to get started!
        </p>
        <Button
          onClick={onBrowseServices}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Browse Services
        </Button>
      </div>
    </div>
  );
}

// ============================================
// FILE: /components/cart/CartNotification.tsx
// Notification component
// ============================================

import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface CartNotificationProps {
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export function CartNotification({ 
  message, 
  type = 'success',
  onClose 
}: CartNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <Alert 
        className={`${
          type === 'success' 
            ? 'bg-green-500 border-green-600' 
            : 'bg-red-500 border-red-600'
        } text-white shadow-lg min-w-[300px]`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <AlertDescription className="font-medium">
              {message}
            </AlertDescription>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Alert>
    </div>
  );
}
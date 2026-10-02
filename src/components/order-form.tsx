"use client";
// components/order-form.tsx
// Brief (discord, purpose, dst.) sudah diisi di modal service dan tersimpan di cart,
// jadi halaman ini tinggal review + bayar. Tidak ada lagi step 1-3.

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Package, Tag, User, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import type { ICartItemDetail } from '@/interface';
import { BriefDetails, hasBrief } from '@/components/cart-brief-dialog';

import CustomPayPalDialog from '@/components/checkout-form';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface CheckoutPageProps {
  cartItems: ICartItemDetail[];
  userId: string;
  onSubmitCheckout: (data: any) => Promise<{
    success: boolean;
    message?: string;
    order_id?: string;
  }>;
}

const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n || 0);
};

export default function CheckoutPage({ cartItems: allCartItems = [], userId, onSubmitCheckout }: CheckoutPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const voucherId = searchParams.get('voucher_id');
  const voucherCode = searchParams.get('voucher_code');
  const voucherValue = searchParams.get('voucher_value');
  const cartIdsParam = searchParams.get('cart_ids');

  // Hanya item yang dipilih di halaman cart (?cart_ids=a,b,c).
  // Tanpa parameter itu, semua item cart ikut diproses.
  const cartItems = useMemo(() => {
    if (!cartIdsParam) return allCartItems;
    const ids = new Set(cartIdsParam.split(',').filter(Boolean));
    return allCartItems.filter((item) => ids.has(String(item.id)));
  }, [allCartItems, cartIdsParam]);

  const displayName = user?.full_name || user?.email?.split('@')[0] || '';

  const subtotal = cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0);

  const discount = useMemo(() => {
    if (!voucherValue) return 0;
    const pct = voucherValue.match(/(\d+)%/);
    if (pct) return (subtotal * parseInt(pct[1])) / 100;
    const nominal = parseFloat(voucherValue.replace(/[^\d.]/g, ''));
    return isNaN(nominal) ? 0 : Math.min(nominal, subtotal);
  }, [voucherValue, subtotal]);

  const total = subtotal - discount;

  const incompleteItems = cartItems.filter((i) => !hasBrief(i));
  const canPay = cartItems.length > 0 && incompleteItems.length === 0;

  const handleSubmit = () => {
    if (!canPay) {
      setError('Some items have no request details. Go back to the cart and re-add them.');
      return;
    }
    setError('');
    // Order PayPal dibuat lazily di CustomPayPalDialog saat tombol PayPal diklik.
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async (paymentResult: { paypalOrderId: string; captureId: string | null }) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Brief TIDAK dikirim dari client: processCheckout membacanya dari tabel carts
      // dan menyalinnya ke order_items.
      const orderData = {
        user_id: userId,
        total,
        voucher_id: voucherId || undefined,
        paypal_order_id: paymentResult.paypalOrderId,
        payment_id: paymentResult.captureId || paymentResult.paypalOrderId,
        cart_items: cartItems.map((item) => ({
          cart_id: item.id,
          categories_id: item.categories_id,
          package_id: item.package_id,
          package_name_id: item.package_name_id,
          quantity: item.quantity,
          price: item.package_price,
          total: item.item_total,
          category_name: item.category_name,
          package_title: item.package_title,
        })),
      };

      const result = await onSubmitCheckout(orderData);

      if (result.success && result.order_id) {
        router.push(`/success?order_id=${result.order_id}`);
        // isSubmitting sengaja tidak di-reset sampai navigasi selesai.
      } else {
        setError(result.message || 'Failed to place order. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 mt-15 sm:mt-15">
      <div className="max-w-7xl mx-auto">
        <div className="w-full mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-5xl font-bold text-primary text-borsok">Checkout</h1>
          <p className="text-gray-600 text-sm sm:text-base arial">Review your order and pay</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {voucherCode && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Tag className="w-4 h-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between text-green-700">
              <div>
                <strong>Voucher Applied:</strong> {voucherCode} ({voucherValue} discount)
              </div>
              <Button
                onClick={() => router.push('/cart')}
                variant="ghost"
                size="sm"
                className="text-green-700 hover:text-green-800"
                aria-label="Change voucher in cart"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {incompleteItems.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              {incompleteItems.length} {incompleteItems.length === 1 ? 'item has' : 'items have'} no request
              details. Remove and re-add {incompleteItems.length === 1 ? 'it' : 'them'} from the service page.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 grid grid-cols-2 gap-5">
          {/* Akun */}

          {/* Item + brief masing-masing */}
          <Card className="rounded-2xl overflow-hidden border-2 shadow-lg p-0">
            <CardHeader className="bg-secondary pt-5 pb-3">
              <CardTitle className="flex items-center text-xl text-white">
                <Package className="w-6 h-6 mr-2" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-primary">{item.category_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {item.package_name?.name && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">{item.package_name.name}</Badge>
                        )}
                        <span className="text-sm text-gray-600">{item.package_title}</span>
                        <span className="text-sm text-gray-500">· Qty {item.quantity}</span>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold">{formatCurrency(item.item_total || 0)}</p>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    {hasBrief(item) ? (
                      <BriefDetails item={item} />
                    ) : (
                      <p className="text-sm text-amber-700">Request details are missing for this item.</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className='space-y-5'>
            <Card className="rounded-2xl overflow-hidden border-2 shadow-lg p-0">
              <CardHeader className="bg-secondary pt-5 pb-3">
                <CardTitle className="flex items-center text-xl text-white">
                  <User className="w-6 h-6 mr-2" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-1 text-sm sm:grid-cols-2">
                <p><span className="text-gray-500">Name: </span><span className="font-medium">{displayName}</span></p>
                <p><span className="text-gray-500">Email: </span><span className="font-medium">{user?.email}</span></p>
              </CardContent>
            </Card>



            {/* Ringkasan harga */}
            <Card className="rounded-2xl overflow-hidden border-2 shadow-lg p-0">
              <CardHeader className="bg-secondary pt-5 pb-3">
                <CardTitle className="flex items-center text-xl text-white">
                  <CreditCard className="w-6 h-6 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                {voucherCode && discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Discount ({voucherValue})
                    </span>
                    <span className="font-semibold">-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-3 text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>

                <p className="pt-2 text-center text-sm text-gray-500">
                  By placing this order, you agree to our Terms of Service
                </p>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                  <Button onClick={() => router.push('/cart')} variant="outline" className="bg-muted/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to cart
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canPay}
                    className="bg-primary hover:bg-primary/90 py-6 text-base font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: 'USD' }}>
          <CustomPayPalDialog
            open={showPaymentDialog}
            setOpen={setShowPaymentDialog}
            amount={total}
            cartIds={cartItems.map((item) => item.id)}
            voucherId={voucherId || undefined}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}
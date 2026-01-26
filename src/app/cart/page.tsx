"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Package,
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import {
  getCartItems,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '@/action/cart';
import { getUserVouchers } from '@/action/vouchers';
import type { ICartItemDetail, IVoucher } from '@/interface';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [cartItems, setCartItems] = useState<ICartItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Voucher states
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<IVoucher | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  useEffect(() => {
    fetchCartData();
    loadVouchers();
  }, [user]);

  const fetchCartData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getCartItems(user.id);

      if (result.success && result.data) {
        setCartItems(result.data);
      } else {
        setError(result.message || 'Failed to load cart');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('User:', user);
    fetchCartData();
  }, [user]);

  const loadVouchers = async () => {
    if (!user?.id) return;

    setLoadingVouchers(true);
    try {
      const result = await getUserVouchers(user.id);
      if (result.success && result.data) {
        const validVouchers = result.data.filter(v =>
          !v.is_used && new Date(v.expired_at) > new Date()
        );
        setVouchers(validVouchers);
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleUpdateQuantity = async (cartId: string, newQuantity: number) => {
    if (!user?.id || newQuantity < 1) return;

    setUpdatingItems(prev => new Set(prev).add(cartId));
    try {
      const result = await updateCartQuantity(cartId, newQuantity, user.id);

      if (result.success) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === cartId
              ? { ...item, quantity: newQuantity, item_total: item.package_price! * newQuantity }
              : item
          )
        );
      } else {
        setError(result.message || 'Failed to update quantity');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartId: string) => {
    if (!user?.id) return;

    if (!confirm('Remove this item from cart?')) return;

    setUpdatingItems(prev => new Set(prev).add(cartId));
    try {
      const result = await removeFromCart(cartId, user.id);

      if (result.success) {
        setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));
      } else {
        setError(result.message || 'Failed to remove item');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (!user?.id) return;

    if (!confirm('Clear all items from cart?')) return;

    setLoading(true);
    try {
      const result = await clearCart(user.id);

      if (result.success) {
        setCartItems([]);
        setSelectedVoucher(null);
      } else {
        setError(result.message || 'Failed to clear cart');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherSelect = (voucher: IVoucher) => {
    if (selectedVoucher?.id === voucher.id) {
      setSelectedVoucher(null);
      setVoucherCode('');
    } else {
      setSelectedVoucher(voucher);
      setVoucherCode(voucher.code);
      setTimeout(() => {
        setIsVoucherOpen(false);
      }, 300);
    }
  };
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};
  const calculateSubtotal = () => {
  return cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0);
};

const calculateDiscount = () => {
  if (!selectedVoucher) return 0;

  const subtotal = calculateSubtotal();
  const percentageMatch = selectedVoucher.value.match(/(\d+)%/);

  if (percentageMatch) {
    // Jika ada %, hitung persentase discount
    const percentage = parseInt(percentageMatch[1]);
    return (subtotal * percentage) / 100;
  } else {
    // Jika tidak ada %, anggap sebagai nilai nominal langsung
    const nominalValue = parseFloat(selectedVoucher.value.replace(/[^\d.]/g, ''));
    return isNaN(nominalValue) ? 0 : nominalValue;
  }
};

const calculateTotal = () => {
  return calculateSubtotal() - calculateDiscount();
};

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const queryParams = new URLSearchParams();
    if (selectedVoucher) {
      queryParams.set('voucher_id', selectedVoucher.id);
      queryParams.set('voucher_code', selectedVoucher.code);
      queryParams.set('voucher_value', selectedVoucher.value);

      console.log('🛒 CART PAGE - Passing voucher to checkout:', {
        voucher_id: selectedVoucher.id,
        voucher_code: selectedVoucher.code,
        voucher_value: selectedVoucher.value,
        full_url: `/order?${queryParams.toString()}`
      });
    } else {
      console.log('🛒 CART PAGE - No voucher selected');
    }

    const urlParams = queryParams.toString();
    const checkoutUrl = `/order${urlParams ? `?${urlParams}` : ''}`;

    console.log('🛒 CART PAGE - Navigating to:', checkoutUrl);
    router.push(checkoutUrl);
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center max-w-7xl">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Your Order is empty</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Add some amazing services to get started!</p>
          <Button
            onClick={() => router.push('/service')}
            size="lg"
            className="bg-primary text-white w-full sm:w-auto"
          >
            Browse Our Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12 px-4 mt-16 sm:mt-20">
      <div className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className='w-full'>
            <h1 className="text-2xl sm:text-4xl font-bold text-primary mb-1">Order Summary</h1>
            <div className="flex justify-between items-start sm:items-center gap-2 sm:gap-0">
              <p className="text-gray-600 text-sm sm:text-base">{getTotalItems()} items in your cart</p>
              {cartItems.length > 0 && (
                <Button
                  onClick={handleClearCart}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 cursor-pointer p-0 sm:p-2 h-auto"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-sm">Clear All</span>
                </Button>
              )}
            </div>
            <div className='w-full h-1 bg-primary mt-2'></div>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 sm:mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item) => {
              const isUpdating = updatingItems.has(item.id!);

              return (
                <Card key={item.id} className={`${isUpdating ? 'opacity-50' : ''} transition-opacity bg-white relative`}>
                  <CardContent className="p-3 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
                          <Package className="w-8 h-8 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                            {item.category_name}
                          </h3>
                          <Badge className="bg-purple-100 text-purple-700 text-xs mb-1">
                            {item.package_type}
                          </Badge>
                          <p className="text-xs text-primary truncate">{item.package_name}</p>
                        </div>
                        <Button
                          onClick={() => handleRemoveItem(item.id!)}
                          disabled={isUpdating}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            size="icon"
                            className="h-8 w-8 bg-primary text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                            disabled={isUpdating}
                            size="icon"
                            className="h-8 w-8 bg-primary text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          ${item.item_total?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:grid grid-cols-4 items-center gap-4">
                      <div className="flex col-span-2 gap-5 items-center">
                        <div className="w-20 lg:w-24 h-20 lg:h-24 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
                          <Package className="w-10 lg:w-12 h-10 lg:h-12 text-secondary" />
                        </div>
                        <div className="min-w-0"> 
                          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1 truncate">
                            {item.category_name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              {item.package_type}
                            </Badge>
                            <span className="text-sm text-primary truncate">- {item.package_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          size="icon"
                          className="h-8 lg:h-9 w-8 lg:w-9 bg-primary text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 lg:w-12 text-center font-semibold text-base lg:text-lg">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                          disabled={isUpdating}
                          size="icon"
                          className="h-8 lg:h-9 w-8 lg:w-9 bg-primary text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-center">
                        <div className="text-xl lg:text-2xl font-bold text-gray-900">
                          {formatCurrency(item.item_total?.toLocaleString())}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveItem(item.id!)}
                        disabled={isUpdating}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
             <Link href="/service" className="text-sm float-end text-secondary">Add More</Link>
          </div>
         

          {/* Order Summary - Sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="bg-white">
              <CardContent className="space-y-4 ">
                <Card className='bg-muted/30'>
                  <CardHeader
                    className="cursor-pointer transition-colors "
                    onClick={() => setIsVoucherOpen(!isVoucherOpen)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Apply Voucher</span>
                        {selectedVoucher && (
                          <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                            Applied
                          </Badge>
                        )}
                      </CardTitle>
                      {isVoucherOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    {selectedVoucher && !isVoucherOpen && (
                      <CardDescription className="mt-2 text-secondary text-sm">
                        {selectedVoucher.code} - {selectedVoucher.value} discount
                      </CardDescription>
                    )}
                  </CardHeader>

                  {isVoucherOpen && (
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {loadingVouchers ? (
                        <div className="text-sm text-gray-500">Loading vouchers...</div>
                      ) : vouchers.length === 0 ? (
                        <Alert>
                          <AlertDescription className="text-xs sm:text-sm">
                            No available vouchers. Complete orders to earn discount vouchers!
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          {vouchers.map((voucher) => (
                            <div
                              key={voucher.id}
                              onClick={() => handleVoucherSelect(voucher)}
                              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedVoucher?.id === voucher.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                      {voucher.code}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600">
                                      Discount: {voucher.value}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Expires: {new Date(voucher.expired_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                {selectedVoucher?.id === voucher.id && (
                                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                <div className="flex justify-between text-gray-700 mt-4 sm:mt-8 text-sm sm:text-base">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal().toLocaleString())}</span>
                </div>

                {selectedVoucher && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="truncate">Discount ({selectedVoucher.value})</span>
                    </span>
                    <span className="font-semibold flex-shrink-0 ml-2">
                      -${calculateDiscount().toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t border-primary pt-4">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold text-secondary">
                      {formatCurrency(calculateTotal().toLocaleString())}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    className="w-full bg-primary text-white py-4 sm:py-6 font-semibold text-sm sm:text-base"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
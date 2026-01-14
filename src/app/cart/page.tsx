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
  ChevronUp
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
      // Close collapse after selection
      setTimeout(() => {
        setIsVoucherOpen(false);
      }, 300);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0);
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;

    const subtotal = calculateSubtotal();
    const percentageMatch = selectedVoucher.value.match(/(\d+)%/);

    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1]);
      return (subtotal * percentage) / 100;
    }

    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    const queryParams = selectedVoucher 
      ? `?voucher=${selectedVoucher.id}` 
      : '';
    router.push(`/order${queryParams}`);
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-muted/50 p-6 flex items-center justify-center">
        <div className="text-center max-w-7xl">
          <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-16 h-16 text-purple-300" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Order is empty</h2>
          <p className="text-gray-600 mb-8">Add some amazing services to get started!</p>
          <Button
            onClick={() => router.push('/service')}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">{getTotalItems()} items in your cart</p>
          </div>
         
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleClearCart}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            )}

            {cartItems.map((item) => {
              const isUpdating = updatingItems.has(item.id!);
              
              return (
                <Card key={item.id} className={`${isUpdating ? 'opacity-50' : ''} transition-opacity`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-12 h-12 text-purple-500" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {item.category_name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-700">
                            {item.package_type}
                          </Badge>
                          <span className="text-gray-600">- {item.package_name}</span>
                        </div>
                        {item.package_description && (
                          <p className="text-sm text-gray-500 mb-3">
                            {item.package_description}
                          </p>
                        )}
                        <div className="text-2xl font-bold text-purple-600">
                          ${item.package_price}
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            per item
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRemoveItem(item.id!)}
                        disabled={isUpdating}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="flex items-center gap-3">
                        <Label className="text-gray-700">Quantity:</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold text-lg">
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                            disabled={isUpdating}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Item Total</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${item.item_total?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="">
            <div className="sticky top-6 space-y-6">
              {/* Voucher Section - Collapsible */}
              

              {/* Order Summary */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setIsVoucherOpen(!isVoucherOpen)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Apply Voucher
                      {selectedVoucher && (
                        <Badge className="ml-2 bg-green-100 text-green-700">
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
                    <CardDescription className="mt-2">
                      {selectedVoucher.code} - {selectedVoucher.value} discount
                    </CardDescription>
                  )}
                </CardHeader>
                
                {isVoucherOpen && (
                  <CardContent>
                    {loadingVouchers ? (
                      <div className="text-sm text-gray-500">Loading vouchers...</div>
                    ) : vouchers.length === 0 ? (
                      <Alert>
                        <AlertDescription className="text-sm">
                          No available vouchers. Complete orders to earn discount vouchers!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        {vouchers.map((voucher) => (
                          <div
                            key={voucher.id}
                            onClick={() => handleVoucherSelect(voucher)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedVoucher?.id === voucher.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <Tag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {voucher.code}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Discount: {voucher.value}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Expires: {new Date(voucher.expired_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              {selectedVoucher?.id === voucher.id && (
                                <CheckCircle2 className="w-6 h-6 text-purple-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span className="font-semibold">${calculateSubtotal().toLocaleString()}</span>
                  </div>

                  {selectedVoucher && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Discount ({selectedVoucher.value})
                      </span>
                      <span className="font-semibold">
                        -${calculateDiscount().toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-3xl font-bold text-purple-600">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      size="lg"
                      className="w-full bg-primary text-white font-semibold"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
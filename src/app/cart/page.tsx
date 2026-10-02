"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package,
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Check,
  FileText,
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
import { SkeletonCarts } from '@/components/skeleton-card';
import { CardCart, CardOutline, CardSecondary } from '@/components/card-dashed';
import CartBriefDialog, { hasBrief } from '@/components/cart-brief-dialog';

function isVoucherApplicable(
  voucher: IVoucher,
  cartItems: ICartItemDetail[]
): boolean {
  if (!voucher.applicable_categories_id) return true;
  return cartItems.some(
    (item) => item.categories_id === voucher.applicable_categories_id
  );
}

function calculateVoucherDiscount(
  voucher: IVoucher,
  cartItems: ICartItemDetail[]
): number {
  const eligibleItems = voucher.applicable_categories_id
    ? cartItems.filter((i) => i.categories_id === voucher.applicable_categories_id)
    : cartItems;
  const eligibleSubtotal = eligibleItems.reduce(
    (sum, i) => sum + (i.item_total || 0),
    0
  );
  const percentageMatch = voucher.value.match(/(\d+)%/);
  if (percentageMatch) {
    const percentage = parseInt(percentageMatch[1]);
    return (eligibleSubtotal * percentage) / 100;
  }
  const nominalValue = parseFloat(voucher.value.replace(/[^\d.]/g, ""));
  return isNaN(nominalValue) ? 0 : Math.min(nominalValue, eligibleSubtotal);
}

// Sesuaikan ini kalau field gambar kategori kamu namanya beda
function getItemImage(item: any): string {
  return (
    item.category_image ||
    item.image_url ||
    item.category_images?.[0]?.image_url ||
    item.images?.[0]?.image_url ||
    ''
  );
}

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
  const [briefItem, setBriefItem] = useState<ICartItemDetail | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  // ── Select item states ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCartData();
    loadVouchers();
  }, [user]);

  // Saat cart pertama kali dimuat, default: semua item terpilih
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedIds((prev) => {
        if (prev.size > 0) return prev; // jangan reset kalau user sudah pilih2
        return new Set(cartItems.map((i) => i.id!));
      });
    }
  }, [cartItems]);

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
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(cartId);
          return newSet;
        });
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
        setSelectedIds(new Set());
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
    const applicable = isVoucherApplicable(voucher, cartItems);
    if (!applicable) return;

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

  // ── Select item helpers ──
  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map(i => i.id!)));
    }
  };

  const selectedItems = useMemo(
    () => cartItems.filter(i => selectedIds.has(i.id!)),
    [cartItems, selectedIds]
  );
  const incompleteSelected = useMemo(
    () => selectedItems.filter((i) => !hasBrief(i)),
    [selectedItems]
  );

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // ── Semua kalkulasi sekarang berbasis item yang dipilih (selectedItems) ──
  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.item_total || 0), 0);
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    return calculateVoucherDiscount(selectedVoucher, selectedItems);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const getTotalItems = () => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user?.id) {
      router.push(`/auth/login`);
      return;
    }
    if (selectedItems.length === 0) return;
    if (incompleteSelected.length > 0) return;
    const queryParams = new URLSearchParams();
    if (selectedVoucher) {
      queryParams.set('voucher_id', selectedVoucher.id);
      queryParams.set('voucher_code', selectedVoucher.code);
      queryParams.set('voucher_value', selectedVoucher.value);
    }
    queryParams.set('cart_ids', selectedItems.map(i => i.id).join(','));

    const urlParams = queryParams.toString();
    const checkoutUrl = `/order${urlParams ? `?${urlParams}` : ''}`;
    router.push(checkoutUrl);
  };

  useEffect(() => {
    if (!user?.id) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const usableVouchers = useMemo(
    () => vouchers.filter((voucher) => isVoucherApplicable(voucher, selectedItems)),
    [vouchers, selectedItems]
  );

  useEffect(() => {
    if (selectedVoucher && !usableVouchers.find(v => v.id === selectedVoucher.id)) {
      setSelectedVoucher(null);
      setVoucherCode('');
    }
  }, [usableVouchers, selectedVoucher]);

  return (
    <div className="min-h-screen  py-6 sm:py-12 px-4 mt-16 sm:mt-20">
      <div className="max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className='w-full'>
            <h1 className="text-4xl sm:text-5xl text-primary">ORDER <span className='bg-title text-5xl sm:text-6xl'> CHECKOUT</span></h1>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 sm:mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600 text-sm">{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div>
            <SkeletonCarts />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="  mt-10 p-4 sm:p-6 flex items-center justify-center">
            <div className="text-center max-w-7xl">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 arial">Your Order is empty</h2>
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div>
                {/* ── Header tabel (desktop): kolom disamakan persis dengan grid-cols-5 pada tiap card item ── */}
                <div className="hidden sm:flex items-center gap-5 my-6">
                  <div className="flex-1 grid grid-cols-5 items-center gap-4 px-3 sm:px-6">
                    <h3 className="col-span-2 text-primary text-fredoka font-bold text-lg">
                      Services Listing
                    </h3>
                    <h3 className="text-center text-primary text-fredoka font-bold text-lg">
                      Quantity
                    </h3>
                    <h3 className="text-center text-primary text-fredoka font-bold text-lg">
                      Total Price
                    </h3>
                    <h3 className="text-center text-primary text-fredoka font-bold text-lg">

                    </h3>
                  </div>
                  {/* Placeholder ini melebar sama seperti tombol checkbox di tiap baris item, supaya kolom tetap sejajar */}
                  <button
                    onClick={toggleSelectAll}
                    className="w-8 flex-shrink-0 flex items-center justify-center text-xs text-primary font-semibold"
                    title="Select all"
                  >
                    {selectedIds.size}/{cartItems.length}
                  </button>
                </div>

                {/* ── Header ringkas (mobile) ── */}
                <div className="sm:hidden flex items-center justify-between my-6">
                  <h3 className="text-primary text-fredoka font-bold text-lg">Services Listing</h3>
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-primary font-semibold"
                  >
                    {selectedIds.size}/{cartItems.length}
                  </button>
                </div>

                <div className='w-full h-1 bg-primary mb-6'></div>

                {cartItems.map((item) => {
                  const isUpdating = updatingItems.has(item.id!);
                  const isSelected = selectedIds.has(item.id!);
                  const imageUrl = getItemImage(item);

                  return (
                    <div key={item.id} className='flex gap-5'>
                      <CardCart className={`${isUpdating ? 'opacity-50' : ''} transition-opacity flex-1 relative mb-5`}>
                        <CardContent className="p-3 sm:p-6">
                          <div className="block sm:hidden">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-purple-50">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.category_name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                                  />
                                ) : (
                                  <Package className="w-8 h-8 text-secondary" />
                                )}
                              </div>
                              <div className="flex min-w-0">
                                <h3 className="text-base font-bold text-gray-900 mb-1 truncate text-arial">
                                  {item.category_name}
                                </h3>
                                <Badge className="bg-purple-100 text-purple-700 text-xs mb-1">
                                  {item.package_name?.name ?? 'Package'}
                                </Badge>
                                <p className="text-xs text-primary truncate">{item.package_title}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Button
                                  onClick={() => setBriefItem(item)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 px-2 text-xs text-primary text-fredoka"
                                >
                                  <FileText className="w-4 h-4" />
                                  Detail
                                  {!hasBrief(item) && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                                </Button>
                                <Button
                                  onClick={() => handleRemoveItem(item.id!)}
                                  disabled={isUpdating}
                                  variant="ghost"
                                  size="icon"
                                >
                                  <img src="/icon/SVG/trashicon.svg" className="w-5 h-5" alt="" />
                                </Button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setBriefItem(item)}
                              className="mb-3 flex items-center gap-1 text-xs font-semibold text-primary underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View request details
                              {!hasBrief(item) && (
                                <Badge className="ml-1 bg-amber-100 text-amber-700 text-[10px]">Incomplete</Badge>
                              )}
                            </button>
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
                                  className="h-8 w-8 bg-primary rounded-full text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-xl font-bold text-primary text-fredoka ">
                                  {formatCurrency(item.item_total || 0)}
                                </div>
                                <button onClick={() => toggleSelectItem(item.id!)}>
                                  {isSelected ? (
                                    <CheckCircle2 className="w-6 h-6 text-white bg-primary " />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="hidden sm:grid grid-cols-5 items-center gap-4">
                            <div className="flex col-span-2 gap-5 items-center">
                              <div className="relative w-20 lg:w-24 h-20 lg:h-24 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-purple-50">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.category_name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                                  />
                                ) : (
                                  <Package className="w-10 lg:w-12 h-10 lg:h-12 text-secondary" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm text-primary truncate text-fredoka">{item.package_title}</span>
                                <h3 className="text-lg lg:text-xl fredoka-bold text-primary mb-1 truncate">
                                  {item.category_name}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge className="bg-purple-100 text-fredoka text-purple-700 text-xs">
                                    {item.package_name.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                              <Button
                                onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                                size="icon"
                                className="h-6 lg:h-7 w-6 lg:w-7 bg-primary rounded-lg text-white"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-10 lg:w-12 text-center text-fredoka font-semibold text-base lg:text-lg">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                                disabled={isUpdating}
                                size="icon"
                                className="h-6 lg:h-7 w-6 lg:w-7 bg-primary rounded-lg text-white font-bold"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-center">
                              <div className="text-xl lg:text-2xl font-bold text-primary text-fredoka">
                                {formatCurrency(item.item_total?.toLocaleString())}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                onClick={() => setBriefItem(item)}
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 px-2 text-xs text-primary text-fredoka"
                              >
                                <FileText className="w-4 h-4" />
                                Detail
                                {!hasBrief(item) && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                              </Button>
                              <Button
                                onClick={() => handleRemoveItem(item.id!)}
                                disabled={isUpdating}
                                variant="ghost"
                                size="icon"
                              >
                                <img src="/icon/SVG/trashicon.svg" className="w-5 h-5" alt="" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CardCart>
                      <button
                        onClick={() => toggleSelectItem(item.id!)}
                        className="w-8 flex-shrink-0 flex items-center justify-center self-start mt-6"
                      >
                        {isSelected ? (
                          <div className="bg-primary rounded-full">
                            <Check className="w-5 h-5 p-1.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-primary" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <Link href="/service" className="text-sm float-end text-secondary">Add More</Link>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="border-3 rounded-4xl shadow-setting bg-white border-primary relative">
                <Image src={"/images/receiptbadge@3x.webp"} alt='' width={180} height={80} className='absolute -top-8 right-10' />
                <CardContent className="space-y-4 ">
                  {/* ── Coupons ── */}
                  <h3 className="text-fredoka font-semibold text-2xl text-primary">Coupons</h3>
                  <CardOutline className={` p-2 pt-4`}>
                    <CardHeader
                      className="cursor-pointer transition-colors  "
                      onClick={() => setIsVoucherOpen(!isVoucherOpen)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-fredoka text-primary text-base sm:text-lg">
                          <img src="/icon/SVG/labelicon.svg" className='w-6 h6' alt="" />
                          <span className='text-fredoka'>Apply Voucher</span>
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
                      <CardContent className="p-5">
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
                            {vouchers.map((voucher) => {
                              const isApplicable = isVoucherApplicable(voucher, selectedItems);
                              const isSelected = selectedVoucher?.id === voucher.id;

                              return (
                                <div
                                  key={voucher.id}
                                  onClick={() => handleVoucherSelect(voucher)}
                                  className={`
        px-3 py-3 border-2 rounded-lg transition-all
        ${!isApplicable
                                      ? 'border-gray-200 bg-gray-50 opacity-70 '
                                      : isSelected
                                        ? 'border-purple-500 bg-purple-50 cursor-pointer'
                                        : 'border-gray-300 hover:border-primary cursor-pointer'
                                    }
      `}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                      <div
                                        className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-lg
              flex items-center justify-center flex-shrink-0
              ${isApplicable ? 'bg-primary' : 'bg-gray-300'}
            `}
                                      >
                                        <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                            {voucher.code}
                                          </div>
                                          {isApplicable && isSelected && (
                                            <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs">
                                              Applied
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600">
                                          Discount: {voucher.value}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Expires: {new Date(voucher.expired_at).toLocaleDateString()}
                                        </div>
                                        {!isApplicable && voucher.applicable_categories_id && (
                                          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600">
                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            <span>
                                              This voucher can only be used for eligible products.
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && isApplicable && (
                                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </CardOutline>

                  {/* ── Price Details (receipt) ── */}
                  <div className="mt-4 sm:mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-semibold text-fredoka text-primary">Price Details</h3>
                      <Badge className="bg-primary text-white text-xs text-fredoka text-white">
                        {selectedItems.length} {selectedItems.length === 1 ? 'Items' : 'Items'}
                      </Badge>
                    </div>

                    {selectedItems.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No items selected yet.</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {selectedItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-fredoka text-sm text-primary">
                            <span className="truncate pr-2">
                              {item.quantity}x {item.category_name}
                            </span>
                            <span className="font-semibold flex-shrink-0">
                              {formatCurrency(item.item_total || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}




                    {selectedVoucher && (
                      <div className="flex justify-between text-green-600 text-sm sm:text-base">
                        <span className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span className="truncate">Discount ({selectedVoucher.value})</span>
                        </span>
                        <span className="font-semibold flex-shrink-0 ml-2">
                          -{formatCurrency(calculateDiscount())}
                        </span>
                      </div>
                    )}
                  </div>



                  <div className="border-t border-primary pt-4">
                    <div className="flex justify-between text-fredoka items-center mb-4 sm:mb-6">
                      <span className="text-lg sm:text-xl font-bold text-primary">Total</span>
                      <span className="text-xl sm:text-xl font-bold text-primary">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                    {incompleteSelected.length > 0 && (
                      <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {incompleteSelected.length} selected {incompleteSelected.length === 1 ? 'item has' : 'items have'} no
                        request details. Remove and re-add {incompleteSelected.length === 1 ? 'it' : 'them'} from the service page.
                      </p>
                    )}
                    <Button
                      onClick={handleCheckout}
                      size="lg"
                      disabled={selectedItems.length === 0 || incompleteSelected.length > 0}
                      className="w-full bg-primary text-white py-4 cursor-pointer sm:py-6 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
        <CartBriefDialog item={briefItem} onClose={() => setBriefItem(null)} />
    </div>
  );
}
"use client";
// app/user/user-order/[id]/page.tsx
// Menggantikan Order Detail Dialog di user-orders-page.tsx dengan halaman tersendiri.
// Route diasumsikan: /user/user-order/[id] — sesuaikan path folder kalau struktur project beda.

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { getUserOrders, updateOrderStatus } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import { IOrderWithItems } from '@/interface';
import { BriefDetails, hasBrief } from '@/components/cart-brief-dialog';

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [order, setOrder] = useState<IOrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchOrder = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            // Belum ada action khusus "get order by id", jadi sementara pakai
            // getUserOrders + filter. Kalau nanti ada action getOrderById,
            // tinggal ganti panggilan di sini.
            const res = await getUserOrders(user.id);
            if (!res?.success) throw new Error(res?.message || 'Failed to fetch order');

            const data = res.data as IOrderWithItems[];
            const found = data.find((o) => o.id === id);

            if (!found) {
                toast.error('Order not found');
                router.push('/user/user-order');
                return;
            }
            setOrder(found);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, id]);

    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount);
    };

    const handleCancel = async () => {
        if (!order) return;
        try {
            setCancelling(true);
            const res = await updateOrderStatus(order.id, { status: 'cancelled' });
            if (!res.success) throw new Error(res.message);

            toast.success('Order cancelled successfully');
            setCancelOpen(false);
            fetchOrder();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen px-6 py-8 mx-auto max-w-3xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-primary/10 rounded-xl w-1/3" />
                    <div className="h-40 bg-primary/10 rounded-2xl" />
                    <div className="h-40 bg-primary/10 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!order) return null;

    const canEdit = order.status === 'pending' || order.status === 'processing';

    return (
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-0 py-8 text-primary">
            <button
                onClick={() => router.push('/user/user-order')}
                className="flex items-center gap-1 text-sm font-medium text-primary/70 hover:text-primary mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to orders
            </button>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-lilita mb-1">Order Details</h1>
            <p className="text-sm text-muted-foreground mb-8">Order #{order.code_order}</p>

            <div className="space-y-4">
                {order.order_items?.map((item) => {
                    const brief = hasBrief(item) ? item : hasBrief(order) ? order : null;

                    return (
                        <div key={item.id} className="rounded-2xl border-2 border-primary/15 p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-primary truncate">{item.category_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.package_title}
                                        {item.package_name?.name ? ` • ${item.package_name.name}` : ''} • Qty: {item.quantity}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(item.price)} × {item.quantity}
                                    </p>
                                    <p className="font-semibold text-sm">{formatCurrency(item.total)}</p>
                                </div>
                            </div>

                            <div className="border-t border-primary/10 pt-3">
                                {brief ? (
                                    <BriefDetails item={brief} />
                                ) : (
                                    <p className="text-sm text-muted-foreground">No request details saved for this item.</p>
                                )}
                            </div>

                            {canEdit && (
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={() => router.push(`/user/user-order/edit/${item.id}`)}
                                        className="bg-primary text-white hover:bg-primary/90"
                                    >
                                        <Edit className="w-3.5 h-3.5 mr-1" />
                                        Edit details
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span className="text-sm">Total:</span>
                    <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>

                {order.status === 'pending' && (
                    <div className="flex justify-end pt-3 border-t">
                        <Button
                            size="sm"
                            onClick={() => setCancelOpen(true)}
                            className="bg-red-100 text-red-600 border-red-600 hover:bg-red-100"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancel order
                        </Button>
                    </div>
                )}
            </div>

            {/* Cancel confirmation tetap dialog kecil — bukan bagian dari "detail/edit" yang diminta jadi page */}
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Your order will be cancelled permanently.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
                            No, keep order
                        </Button>
                        <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                            {cancelling ? 'Cancelling...' : 'Yes, cancel order'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
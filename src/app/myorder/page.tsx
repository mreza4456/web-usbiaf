"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Package,
    Edit,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Eye
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IOrderWithItems } from '@/interface';
import { updateOrder, updateOrderStatus } from '@/action/order';
import { getUserOrders } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function UserOrdersPage() {
    const user = useAuthStore((s) => s.user);
    const [orders, setOrders] = useState<IOrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<IOrderWithItems | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const router = useRouter();
    const [open, setOpen] = useState(false);


    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            console.log('🔍 Fetching orders for user:', user.id);

            const response = await getUserOrders(user.id);
            console.log('📦 Orders response:', response);

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch orders');
            }

            console.log('✅ Orders loaded:', response.data);
            setOrders(response.data as IOrderWithItems[]);
        } catch (error: any) {
            console.error('❌ Error:', error);
            toast.error(error.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { icon: any, className: string, label: string }> = {
            pending: {
                icon: Clock,
                className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                label: "Pending"
            },
            in_progress: {
                icon: Loader2,
                className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
                label: "In Progress"
            },
            completed: {
                icon: CheckCircle2,
                className: "bg-green-500/10 text-green-600 border-green-500/30",
                label: "Completed"
            },
            cancelled: {
                icon: XCircle,
                className: "bg-red-500/10 text-red-600 border-red-500/30",
                label: "Cancelled"
            },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge className={`${config.className} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleCancel = async () => {
        if (!selectedOrder) return;

        try {
            setLoading(true);
            const response = await updateOrderStatus(selectedOrder.id, {
                status: 'cancelled',
            });

            if (!response.success) throw new Error(response.message);

            toast.success('Order cancelled successfully');
            fetchOrders();
            setOpen(false);
            setSelectedOrder(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };


    const viewOrderDetails = (order: IOrderWithItems) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#D78FEE] animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Your order will be cancelled permanently.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            No, keep order
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {loading ? 'Cancelling...' : 'Yes, cancel order'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="relative z-10 w-full max-w-7xl mx-auto mt-25">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="w-8 h-8 text-secondary" />
                        <h1 className="text-4xl font-bold text-primary">
                            My Orders
                        </h1>
                    </div>
                    <p className="text-gray-500">Track and manage your commission orders</p>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <Card className="bg-muted/50 shadow hover:border-[#D78FEE]/50 col-span-2">
                        <CardContent className="py-16 text-center">
                            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
                            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                            <Button
                                onClick={() => router.push('/order')}
                                className="bg-primary text-white"
                            >
                                Place Your First Order
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6 col-span-2">
                        {orders.map((order) => (
                            <Card key={order.id} className="bg-muted/50 shadow hover:border-[#D78FEE]/50 transition-all">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-xl text-primary">
                                                    Order #{order.code_order}
                                                </CardTitle>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <CardDescription className="text-gray-600">
                                                Ordered on {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewOrderDetails(order)}
                                                className="bg-white/5 border-[#9B5DE0]/30 hover:bg-[#9B5DE0]/20"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View Details
                                            </Button>
                                            {(order.status === 'pending' || order.status === 'in_progress') && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/myorder/edit/${order.id}`)}
                                                        className="bg-white/5 border-[#9B5DE0]/30 hover:bg-[#9B5DE0]/20"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    {order.status === 'pending' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setOpen(true);
                                                            }}
                                                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" />
                                                            Cancel
                                                        </Button>


                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Order Items Summary */}
                                    <div className="mb-4">
                                        <Label className="text-gray-600 text-sm mb-2 block">Order Items</Label>
                                        <div className="space-y-2">
                                            {order.order_items?.slice(0, 2).map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{item.category_name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.package_name} ({item.package_type}) × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-primary">
                                                        {formatCurrency(item.total)}
                                                    </p>
                                                </div>
                                            ))}
                                            {order.order_items && order.order_items.length > 2 && (
                                                <p className="text-xs text-gray-500 text-center">
                                                    +{order.order_items.length - 2} more item(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                                        <div>
                                            <Label className="text-gray-600 text-sm">Purpose</Label>
                                            <p className="text-primary capitalize">{order.purpose.replace(/_/g, ' ').replace(/-/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-600 text-sm">Usage Type</Label>
                                            <p className="text-primary capitalize">{order.usage_type}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-600 text-sm">Platforms</Label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {(order.platform && Array.isArray(order.platform) ? order.platform : []).map((plat, idx) => (
                                                    <Badge key={idx} className="bg-[#9B5DE0] text-white border-[#D78FEE]/30">
                                                        {plat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-600 text-sm">Total Amount</Label>
                                            <p className="text-xl font-bold text-primary">{formatCurrency(order.total)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Order Details Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6">
                                {/* Order Info */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg">Order Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Order Code:</span>
                                            <p className="font-mono font-medium">{selectedOrder.code_order}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Order Date:</span>
                                            <p className="font-medium">
                                                {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {selectedOrder.discord && (
                                            <div>
                                                <span className="text-gray-500">Discord:</span>
                                                <p className="font-medium">{selectedOrder.discord}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Project Details */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Project Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Purpose:</span>
                                            <p className="font-medium capitalize">
                                                {selectedOrder.purpose.replace(/_/g, ' ').replace(/-/g, ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Project Overview:</span>
                                            <p className="mt-1 text-gray-700">{selectedOrder.project_overview}</p>
                                        </div>
                                        {selectedOrder.references_link && (
                                            <div>
                                                <span className="text-gray-500">References:</span>
                                                <a
                                                    href={selectedOrder.references_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline block mt-1"
                                                >
                                                    {selectedOrder.references_link}
                                                </a>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500">Platform:</span>
                                            <p className="mt-1">{selectedOrder.platform.join(", ")}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Usage Type:</span>
                                            <p className="mt-1 capitalize">{selectedOrder.usage_type.replace(/_/g, ' ')}</p>
                                        </div>
                                        {selectedOrder.additional_notes && (
                                            <div>
                                                <span className="text-gray-500">Additional Notes:</span>
                                                <p className="mt-1 text-gray-700">{selectedOrder.additional_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Order Items</h3>
                                    <div className="space-y-2">
                                        {selectedOrder.order_items?.map((item) => (
                                            <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                                <div className="space-y-1">
                                                    <p className="font-medium">{item.category_name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {item.package_name} ({item.package_type})
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        {formatCurrency(item.price)} × {item.quantity}
                                                    </p>
                                                    <p className="font-semibold">
                                                        {formatCurrency(item.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t font-semibold text-lg">
                                        <span>Total:</span>
                                        <span>{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
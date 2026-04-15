"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Package,
    Edit,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    Star,
    MessageSquare
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
import { updateOrderStatus, getUserOrders } from '@/action/order';
import { createComment } from '@/action/comment';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';

export default function UserOrdersPage() {
    const user = useAuthStore((s) => s.user);
    const [orders, setOrders] = useState<IOrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<IOrderWithItems | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Comment form state
    const [selectedOrderItemId, setSelectedOrderItemId] = useState<string>('');
    const [selectedItemName, setSelectedItemName] = useState<string>('');
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [message, setMessage] = useState<string>('');

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await getUserOrders(user.id);

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch orders');
            }

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

    // Filter orders based on active tab
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const processingOrders = orders.filter(order => order.status === 'processing');
    const completedOrders = orders.filter(order => order.status === 'completed');
    const cancelledOrders = orders.filter(order => order.status === 'cancelled');

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { icon: any, className: string, label: string }> = {
            pending: {
                icon: Clock,
                className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                label: "Pending"
            },
            processing: {
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
            <Badge className={`${config.className} flex items-center gap-1 px-3 py-1`}>
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
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

    const openCommentDialog = (order: IOrderWithItems, orderItemId: string, itemName: string) => {
        if (!order || !orderItemId || !user?.id) {
            toast.error('Unable to open review form. Please try again.');
            return;
        }

        setSelectedOrder(order);
        setSelectedOrderItemId(orderItemId);
        setSelectedItemName(itemName);
        setRating(0);
        setMessage('');
        setCommentOpen(true);
    };

    const handleSubmitComment = async () => {
        if (!selectedOrder || !user?.id || !selectedOrderItemId) {
            toast.error('Missing required information');
            return;
        }

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (!message.trim()) {
            toast.error('Please write a comment');
            return;
        }

        try {
            setSubmittingComment(true);

            const commentData = {
                user_id: user.id,
                order_items_id: selectedOrderItemId,
                message: message.trim(),
                rating: rating.toString(),
            };

            const response = await createComment(commentData);

            if (!response.success) {
                throw new Error(response.message || 'Failed to submit comment');
            }

            toast.success('Thank you for your feedback!');
            setCommentOpen(false);
            setRating(0);
            setMessage('');
            setSelectedOrderItemId('');
            setSelectedItemName('');
            setSelectedOrder(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const viewOrderDetails = (order: IOrderWithItems) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    const renderStars = (isInteractive: boolean = true) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!isInteractive}
                        onClick={() => isInteractive && setRating(star)}
                        onMouseEnter={() => isInteractive && setHoverRating(star)}
                        onMouseLeave={() => isInteractive && setHoverRating(0)}
                        className={`transition-all ${isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    >
                        <Star
                            className={`w-8 h-8 ${star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    const renderOrderCard = (order: IOrderWithItems) => (
        <Card key={order.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <CardContent className="p-4">
                {/* Status Badge & Order Info Header */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b">
                    <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}

                        <div className="mb-1">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })} {new Date(order.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })} am
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-3 col-span-2 md:col-span-2">
                        {order.order_items?.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-4">
                                {/* Product Image Placeholder */}
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-8 h-8 text-primary" />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        OrderID: {order.code_order}
                                    </h4>
                                    <h4 className="font-medium text-gray-500 truncate">
                                        {item.category_name}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {formatCurrency(item.price)} × {item.quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="float-right text-center col-span-2 md:col-span-1">
                        <div className="text-sm text-gray-500">Total:</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</div>
                    </div>
                </div>
                {/* Action Buttons - Bottom Right */}
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                    {order.status === 'completed' && order.order_items && order.order_items.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const firstItem = order.order_items![0];
                                const itemName = `${firstItem.category_name} - ${firstItem.package_name}`;
                                openCommentDialog(order, firstItem.id, itemName);
                            }}
                            className="bg-white/5 cursor-pointer border-primary border-2 text-black hover:bg-white/10"
                        >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Leave Review
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => viewOrderDetails(order)}
                        className="bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
                    >
                        Order Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

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
        <div className="relative z-10 w-full max-w-7xl mx-auto text-primary">
            {/* Cancel Order Dialog */}
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

            {/* Comment Dialog */}
            <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Rate & Review Product
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItemName ? (
                                <>Share your experience with <strong>{selectedItemName}</strong></>
                            ) : (
                                'Share your experience with this product'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Rating */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Rating <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex justify-center py-2">
                                {renderStars(true)}
                            </div>
                            {rating > 0 && (
                                <p className="text-center text-sm text-gray-500">
                                    {rating === 1 && "Poor"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Very Good"}
                                    {rating === 5 && "Excellent"}
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="comment-message" className="text-sm font-medium">
                                Your Review <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="comment-message"
                                placeholder="Tell us about your experience with this product..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                className="resize-none"
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500">
                                {message.length}/500 characters
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCommentOpen(false);
                                setRating(0);
                                setMessage('');
                            }}
                            disabled={submittingComment}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitComment}
                            disabled={submittingComment || rating === 0 || !message.trim()}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {submittingComment ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 relative">
                    <h1 className="text-3xl font-bold text-primary mb-6 px-4 sm:px-6 lg:px-8">My Orders</h1>

                   
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
                <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'all'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'pending'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Pending ({pendingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('processing')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'processing'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        In Progress ({processingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'completed'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Completed ({completedOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'cancelled'
                            ? 'text-[#D78FEE] border-b-2 border-[#D78FEE]'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Cancelled ({cancelledOrders.length})
                    </button>
                </div>

                {/* Orders Grid */}
                <div className="space-y-4">
                    {/* All Orders */}
                    {activeTab === 'all' && orders.length > 0 && orders.map(renderOrderCard)}

                    {/* Pending Orders */}
                    {activeTab === 'pending' && pendingOrders.length > 0 && pendingOrders.map(renderOrderCard)}

                    {/* Processing Orders */}
                    {activeTab === 'processing' && processingOrders.length > 0 && processingOrders.map(renderOrderCard)}

                    {/* Completed Orders */}
                    {activeTab === 'completed' && completedOrders.length > 0 && completedOrders.map(renderOrderCard)}

                    {/* Cancelled Orders */}
                    {activeTab === 'cancelled' && cancelledOrders.length > 0 && cancelledOrders.map(renderOrderCard)}

                    {/* Empty State */}
                    {((activeTab === 'all' && orders.length === 0) ||
                        (activeTab === 'pending' && pendingOrders.length === 0) ||
                        (activeTab === 'processing' && processingOrders.length === 0) ||
                        (activeTab === 'completed' && completedOrders.length === 0) ||
                        (activeTab === 'cancelled' && cancelledOrders.length === 0)) && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6">
                                    <Package className="w-12 h-12 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-400 mb-2">
                                    No orders found
                                </h3>
                                <p className="text-gray-500 text-center max-w-md mb-6">
                                    {activeTab === 'all' && "You haven't placed any orders yet. Start shopping now!"}
                                    {activeTab === 'pending' && 'No pending orders at the moment.'}
                                    {activeTab === 'processing' && 'No orders are currently being processed.'}
                                    {activeTab === 'completed' && 'No completed orders yet.'}
                                    {activeTab === 'cancelled' && 'No cancelled orders.'}
                                </p>
                                {activeTab === 'all' && (
                                    <Button
                                        onClick={() => router.push('/order')}
                                        className="bg-gradient-to-r from-[#D78FEE] to-[#8B5CF6] text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                                    >
                                        <Package className="w-5 h-5 mr-2" />
                                        Place Your First Order
                                    </Button>
                                )}
                            </div>
                        )}
                </div>
            </div>

            {/* Order Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Additional Order Information</DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.code_order}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-3">
                            {/* Project Details - Compact Grid Layout */}
                            {(selectedOrder.discord || selectedOrder.project_overview || selectedOrder.references_link ||
                                selectedOrder.platform?.length > 0 || selectedOrder.purpose || selectedOrder.usage_type ||
                                selectedOrder.additional_notes) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {selectedOrder.discord && (
                                            <div className="p-2 rounded">
                                                <span className="text-xs text-gray-600 font-medium">Discord:</span>
                                                <p className="text-sm text-gray-900 truncate">{selectedOrder.discord}</p>
                                            </div>
                                        )}

                                        {selectedOrder.purpose && (
                                            <div className="p-2 rounded">
                                                <span className="text-xs text-gray-600 font-medium">Purpose:</span>
                                                <p className="text-sm text-gray-900 capitalize truncate">
                                                    {selectedOrder.purpose.replace(/_/g, ' ').replace(/-/g, ' ')}
                                                </p>
                                            </div>
                                        )}

                                        {selectedOrder.usage_type && (
                                            <div className="p-2 rounded">
                                                <span className="text-xs text-gray-600 font-medium">Usage Type:</span>
                                                <p className="text-sm text-gray-900 capitalize truncate">
                                                    {selectedOrder.usage_type.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        )}

                                        {selectedOrder.platform && selectedOrder.platform.length > 0 && (
                                            <div className="p-2 rounded">
                                                <span className="text-xs text-gray-600 font-medium block mb-1">Platform(s):</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedOrder.platform.map((plat, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs py-0 px-2">
                                                            {plat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.references_link && (
                                            <div className="p-4 rounded-lg">
                                                <span className="text-sm text-gray-600 font-medium block mb-1">Reference Links:</span>
                                                <a
                                                    href={selectedOrder.references_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all"
                                                >
                                                    {selectedOrder.references_link}
                                                </a>
                                            </div>
                                        )}

                                        {selectedOrder.project_overview && (
                                            <div className="p-2 rounded col-span-full">
                                                <span className="text-xs text-gray-600 font-medium block mb-1">Project Overview:</span>
                                                <p className="text-sm text-gray-900 line-clamp-3">{selectedOrder.project_overview}</p>
                                            </div>
                                        )}

                                        {selectedOrder.additional_notes && (
                                            <div className="p-2 rounded col-span-full">
                                                <span className="text-xs text-gray-600 font-medium block mb-1">Additional Notes:</span>
                                                <p className="text-sm text-gray-900 line-clamp-3">{selectedOrder.additional_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                            {/* Complete Item Details - Compact */}
                            <div className="border-t pt-3">
                                <h3 className="font-semibold text-base text-gray-900 mb-2">Order Items</h3>
                                <div className="space-y-1.5">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 truncate">{item.category_name}</p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {item.package_name} • {item.package_type} • Qty: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right ml-2 flex-shrink-0">
                                                <p className="text-xs text-gray-600">
                                                    {formatCurrency(item.price)} × {item.quantity}
                                                </p>
                                                <p className="font-semibold text-sm text-gray-900">
                                                    {formatCurrency(item.total)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t mt-2 font-semibold">
                                    <span className="text-sm">Total:</span>
                                    <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                                </div>
                            </div>

                            {/* Action Buttons - Compact */}
                            {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setDetailOpen(false);
                                            router.push(`/user/user-order/edit/${selectedOrder.id}`);
                                        }}
                                        className="bg-primary text-white border-primary hover:bg-primary/90"
                                    >
                                        <Edit className="w-3.5 h-3.5 mr-1" />
                                        Edit
                                    </Button>
                                    {selectedOrder.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setDetailOpen(false);
                                                setOpen(true);
                                            }}
                                            className="bg-red-100 text-red-600 border-red-600 hover:bg-red-100"
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
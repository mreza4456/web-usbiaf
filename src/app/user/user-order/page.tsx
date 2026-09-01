"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Package,
    Edit,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Star,
    MessageSquare,
    Search,
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

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';
type ViewMode = 'board' | 'status';

// Konfigurasi tahapan pipeline untuk progress bar di Board View.
// Kalau nanti tabel order punya kolom stage sendiri (mis. `stage_label`,
// `stage_step`), tinggal baca dari situ — fallback di bawah dipakai
// selama field itu belum ada.
const STAGE_CONFIG: Record<string, { label: string; step: number; total: number }> = {
    pending: { label: 'Brief Discussion', step: 1, total: 5 },
    processing: { label: 'In Progress', step: 2, total: 5 },
    completed: { label: 'Completed', step: 5, total: 5 },
    cancelled: { label: 'Cancelled', step: 0, total: 5 },
};

export default function UserOrdersPage() {
    const user = useAuthStore((s) => s.user);
    const [orders, setOrders] = useState<IOrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<IOrderWithItems | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [search, setSearch] = useState('');
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

    // Filter pencarian: cari berdasarkan kode order atau nama kategori item
    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return orders;

        return orders.filter((order) => {
            const inCode = order.code_order?.toLowerCase().includes(q);
            const inItems = order.order_items?.some((item) =>
                item.category_name?.toLowerCase().includes(q) ||
                item.package_title?.toLowerCase().includes(q)
            );
            return inCode || inItems;
        });
    }, [orders, search]);

    // Filter orders based on active tab (Status View)
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
    const processingOrders = filteredOrders.filter(order => order.status === 'processing');
    const completedOrders = filteredOrders.filter(order => order.status === 'completed');
    const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled');

    // Pengelompokan untuk Board View.
    // "In Revisions" saat ini akan selalu kosong sampai ada field/flag di skema
    // order yang menandai order sedang direvisi (mis. `revision_requested`).
    const boardColumns = useMemo(() => {
        return {
            needAttention: filteredOrders.filter((o) => o.status === 'pending'),
            workInProgress: filteredOrders.filter(
                (o) => o.status === 'processing' && !(o as any).revision_requested
            ),
            inRevisions: filteredOrders.filter(
                (o) => (o as any).revision_requested === true
            ),
            completed: filteredOrders.filter((o) => o.status === 'completed'),
        };
    }, [filteredOrders]);

    const getStageInfo = (order: IOrderWithItems) => {
        const override = order as any;
        const base = STAGE_CONFIG[order.status] || STAGE_CONFIG.pending;
        return {
            label: override.stage_label || base.label,
            step: override.stage_step ?? base.step,
            total: override.stage_total ?? base.total,
        };
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
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

    // ------- BOARD VIEW CARD (sesuai mockup Order Tracking) -------
    const renderBoardCard = (order: IOrderWithItems) => {
        const firstItem = order.order_items?.[0];
        const title = firstItem?.category_name?.toUpperCase() || 'CUSTOM ORDER';
        const subtitle = firstItem?.package_title || '';
        const stage = getStageInfo(order);
        const dueDate = (order as any).due_date;

        return (
            <div
                key={order.id}
                className="bg-white border-2 border-primary/20 rounded-2xl p-4 space-y-3 hover:border-primary/40 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-primary/70">
                        {dueDate ? `Due: ${formatDate(dueDate)}` : `Ordered: ${formatDate(order.created_at)}`}
                    </span>
                </div>

                <div>
                    <h3 className="text-lg font-extrabold text-primary text-lilita leading-tight uppercase truncate">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex gap-1">
                        {Array.from({ length: stage.total }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${i < stage.step ? 'bg-primary' : 'bg-primary/15'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-wide">
                            {stage.label}
                        </span>
                        <span className="text-[11px] font-semibold text-primary/70">
                            {stage.step}/{stage.total}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={() => viewOrderDetails(order)}
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs tracking-wide"
                >
                    Order Detail
                </Button>
            </div>
        );
    };

    const BOARD_COLUMNS: { key: keyof typeof boardColumns; title: string }[] = [
        { key: 'needAttention', title: 'Need Attention' },
        { key: 'workInProgress', title: 'Work in Progress' },
        { key: 'inRevisions', title: 'In Revisions' },
        { key: 'completed', title: 'Order Completed!' },
    ];

    // ------- STATUS VIEW CARD (list, tetap seperti sebelumnya) -------
    const renderOrderCard = (order: IOrderWithItems) => (
        <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow border border-primary/15">
            <CardContent className="">
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}

                        <div className="mb-1 text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })} {new Date(order.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-3 col-span-2 md:col-span-2">
                        {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-8 h-8 text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-primary truncate">
                                        OrderID: {order.code_order}
                                    </h4>
                                    <h4 className="font-medium text-muted-foreground truncate">
                                        {item.category_name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {formatCurrency(item.price)} × {item.quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center col-span-2 md:col-span-1">
                        <div className="text-sm text-muted-foreground">Total:</div>
                        <div className="text-lg font-bold text-primary">{formatCurrency(order.total)}</div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-primary/10">
                    {order.status === 'completed' && order.order_items && order.order_items.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const firstItem = order.order_items![0];
                                const itemName = `${firstItem.category_name} - ${firstItem.package_title}`;
                                openCommentDialog(order, firstItem.id, itemName);
                            }}
                            className="border-primary border-2 text-primary hover:bg-primary/5"
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
            <div className="min-h-screen px-5 mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-10 bg-primary/10 rounded-2xl w-1/3 mb-8"></div>
                    <div className="h-12 bg-primary/10 rounded-full w-full max-w-md mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="h-40 bg-primary/10 rounded-2xl"></div>
                        <div className="h-40 bg-primary/10 rounded-2xl"></div>
                        <div className="h-40 bg-primary/10 rounded-2xl"></div>
                        <div className="h-40 bg-primary/10 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full mx-auto text-primary w-full px-6 sm:px-15 mx-auto sm:py-8">
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
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            No, keep order
                        </Button>
                        <Button variant="destructive" onClick={handleCancel} disabled={loading}>
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

                            <div className="border-t pt-3">
                                <h3 className="font-semibold text-base text-gray-900 mb-2">Order Items</h3>
                                <div className="space-y-1.5">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                    {item.category_name
                                                        ?.split(" ")
                                                        .slice(0, 4)
                                                        .join(" ")}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {item.package_title}{item.package_name?.name ? ` • ${item.package_name.name}` : ''} • Qty: {item.quantity}
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

            {/* Header, sesuai mockup: judul + search + toggle Board/Status */}
            <div className="mb-8 space-y-6 ">
           
                    <h1 className="text-4xl sm:text-6xl  w-full text-primary leading-5 mb-10" >ORDER <span className='text-5xl sm:text-7xl bg-title'>TRACKING</span></h1>
             
             

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Order.."
                            className="rounded-full border-2 border-primary/40 pl-11 py-5 focus-visible:ring-primary"
                        />
                    </div>

                    <div className="inline-flex items-center gap-1 border-2 border-primary rounded-full  self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('board')}
                            className={`px-5 py-2 rounded-l-full text-sm font-semibold text-lilita transition-colors ${viewMode === 'board' ? 'bg-muted/80 border-r-1 border-primary text-primary' : 'text-primary'
                                }`}
                        >
                            <p>Board View</p>
                        </button>
                        <button
                            onClick={() => setViewMode('status')}
                            className={`px-5 py-2 rounded-r-full text-sm font-semibold text-lilita transition-colors ${viewMode === 'status' ? 'bg-muted/80 border-l-1 border-primary text-primary' : 'text-primary'
                                }`}
                        >
                            <p>Status View</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* BOARD VIEW */}
            {viewMode === 'board' && (
                <div className="grid grid-cols-1 relative md:grid-cols-2 xl:grid-cols-4 gap-4 ">
                    <div className="w-full h-0.5 bg-secondary/80 absolute top-12"></div>
                    {BOARD_COLUMNS.map((col) => {
                        const items = boardColumns[col.key];
                        return (
                            <div key={col.key} className="space-y-4">
                                <div className="bg-muted/80   px-4 py-3">
                                    <h2 className="font-bold text-primary text-lilita">{col.title}</h2>
                                </div>
                                <div className="space-y-4">
                                    {items.length > 0 ? (
                                        items.map(renderBoardCard)
                                    ) : (
                                        <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center text-sm text-muted-foreground">
                                            No orders here yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* STATUS VIEW (list + tabs, seperti sebelumnya) */}
            {viewMode === 'status' && (
                <>
                    <div className="flex gap-4 mb-8 border-b border-primary/10 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary/70'
                                }`}
                        >
                            All Orders ({filteredOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary/70'
                                }`}
                        >
                            Pending ({pendingOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('processing')}
                            className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'processing' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary/70'
                                }`}
                        >
                            In Progress ({processingOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'completed' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary/70'
                                }`}
                        >
                            Completed ({completedOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`pb-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === 'cancelled' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary/70'
                                }`}
                        >
                            Cancelled ({cancelledOrders.length})
                        </button>
                    </div>

                    <div className="space-y-4">
                        {activeTab === 'all' && filteredOrders.length > 0 && filteredOrders.map(renderOrderCard)}
                        {activeTab === 'pending' && pendingOrders.length > 0 && pendingOrders.map(renderOrderCard)}
                        {activeTab === 'processing' && processingOrders.length > 0 && processingOrders.map(renderOrderCard)}
                        {activeTab === 'completed' && completedOrders.length > 0 && completedOrders.map(renderOrderCard)}
                        {activeTab === 'cancelled' && cancelledOrders.length > 0 && cancelledOrders.map(renderOrderCard)}

                        {((activeTab === 'all' && filteredOrders.length === 0) ||
                            (activeTab === 'pending' && pendingOrders.length === 0) ||
                            (activeTab === 'processing' && processingOrders.length === 0) ||
                            (activeTab === 'completed' && completedOrders.length === 0) ||
                            (activeTab === 'cancelled' && cancelledOrders.length === 0)) && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16">
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                        <Package className="w-12 h-12 text-primary/40" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-muted-foreground mb-2">
                                        No orders found
                                    </h3>
                                    <p className="text-muted-foreground text-center max-w-md mb-6">
                                        {activeTab === 'all' && "You haven't placed any orders yet. Start shopping now!"}
                                        {activeTab === 'pending' && 'No pending orders at the moment.'}
                                        {activeTab === 'processing' && 'No orders are currently being processed.'}
                                        {activeTab === 'completed' && 'No completed orders yet.'}
                                        {activeTab === 'cancelled' && 'No cancelled orders.'}
                                    </p>
                                    {activeTab === 'all' && (
                                        <Button
                                            onClick={() => router.push('/order')}
                                            className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            <Package className="w-5 h-5 mr-2" />
                                            Place Your First Order
                                        </Button>
                                    )}
                                </div>
                            )}
                    </div>
                </>
            )}
        </div>
    );
}
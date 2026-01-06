"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Package,
    Edit,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { IOrder, ICategory } from '@/interface';
import { getAllOrder, updateOrder, deleteOrder } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface UserOrdersPageProps {
    categories: ICategory[];
}

export default function UserOrdersPage({ categories }: UserOrdersPageProps) {
    const user = useAuthStore((s) => s.user);
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState<IOrder | null>(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        discord: '',
        categories_id: '',
        purpose: '',
        project_overview: '',
        hasReferences: '',
        references_link: '',
        platforms: [] as string[],
        usage_type: '',
        additional_notes: ''
    });

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await getAllOrder();

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch orders');
            }

            // Filter orders by current user
            const userOrders = response.data.filter((order: IOrder) => order.user_id === user.id);
            setOrders(userOrders);
        } catch (error: any) {
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
            rejected: {
                icon: AlertCircle,
                className: "bg-gray-500/10 text-gray-600 border-gray-500/30",
                label: "Rejected"
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

    const handleEdit = (order: IOrder) => {
        setEditingOrder(order);
        setFormData({
            discord: order.discord || '',
            categories_id: order.categories_id,
            purpose: order.purpose,
            project_overview: order.project_overview,
            hasReferences: order.references_link ? 'yes' : 'no',
            references_link: order.references_link || '',
            platforms: order.platform || [],
            usage_type: order.usage_type,
            additional_notes: order.additional_notes || ''
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (!editingOrder) return;

        setError('');
        setIsSubmitting(true);

        try {
            const orderData = {
                discord: formData.discord || '',
                categories_id: formData.categories_id,
                purpose: formData.purpose,
                project_overview: formData.project_overview,
                references_link: formData.references_link || '',
                platform: formData.platforms,
                usage_type: formData.usage_type,
                additional_notes: formData.additional_notes || ''
            };

            const result = await updateOrder(editingOrder.id, orderData);

            if (result.success) {
                toast.success('Order updated successfully!');
                setOpen(false);
                setEditingOrder(null);
                fetchOrders();
            } else {
                setError(result.message || 'Failed to update order');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update order');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleCancel = async (order: IOrder) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            const response = await updateOrder(order.id, { status: 'cancelled' });
            if (!response.success) throw new Error(response.message);
            toast.success('Order cancelled successfully');
            fetchOrders();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const togglePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#D78FEE] animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div>


            <div className="relative z-10 w-full max-w-7xl mx-auto  mt-25">
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
                                onClick={() => window.location.href = '/order'}
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
                                                    {order.categories?.name || 'Service'}
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
                                            {order.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCancel(order)}
                                                    className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Cancel Order
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/myorder/edit/${order.id}`)}
                                                className="bg-white/5 border-[#9B5DE0]/30 hover:bg-[#9B5DE0]/20"
                                                disabled={order.status === 'completed' || order.status === 'cancelled'}
                                            >
                                                <Edit className="w-4 h-4 text-primary" />
                                            </Button>

                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-600 text-sm">Purpose</Label>
                                            <p className="text-primary capitalize">{order.purpose.replace('_', ' ').replace('-', ' ')}</p>
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
                                        {order.discord && (
                                            <div>
                                                <Label className="text-gray-600 text-sm">Discord</Label>
                                                <p className="text-primary">{order.discord}</p>
                                            </div>
                                        )}
                                        <div className="md:col-span-2">
                                            <Label className="text-gray-600 text-sm">Project Overview</Label>
                                            <p className="text-primary mt-1">{order.project_overview}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Edit Dialog */}

            </div>
        </div>
    );
}
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { IOrderWithItems, ICategory } from '@/interface';
import { updateOrder } from '@/action/order';
import { getOrderWithItems } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import { useRouter, useParams } from 'next/navigation';

interface OrderEditPageProps {
    categories: ICategory[];
}

export default function OrderEditPage({ categories }: OrderEditPageProps) {
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;

    const [editingOrder, setEditingOrder] = useState<IOrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        discord: '',
        purpose: '',
        project_overview: '',
        hasReferences: '',
        references_link: '',
        platforms: [] as string[],
        usage_type: '',
        additional_notes: ''
    });

    const getDisplayName = () => {
        if (!user) return null;
        if (user.full_name) return user.full_name;
        return user.email?.split("@")[0];
    };

    const displayName = getDisplayName()

    useEffect(() => {
        const fetchOrder = async () => {
            console.log('🔍 Fetching order...', { userId: user?.id, orderId });

            if (!user?.id) {
                console.log('❌ No user ID');
                setLoading(false);
                return;
            }

            if (!orderId) {
                console.log('❌ No order ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const response = await getOrderWithItems(orderId, user.id);
                console.log('📦 Order response:', response);

                if (!response?.success || !response.data) {
                    console.log('❌ Order not found or error');
                    toast.error(response?.message || 'Order not found');
                    router.push('/myorder');
                    return;
                }

                const order = response.data;
                console.log('✅ Order loaded:', order);

                if (order.user_id !== user.id) {
                    console.log('❌ User does not own this order');
                    toast.error('You do not have permission to edit this order');
                    router.push('/myorder');
                    return;
                }

                if (order.status === 'completed' || order.status === 'cancelled') {
                    console.log('⚠️ Order cannot be edited, status:', order.status);
                    toast.warning('This order cannot be edited');
                    router.push('/myorder');
                    return;
                }

                setEditingOrder(order);
                setFormData({
                    discord: order.discord || '',
                    purpose: order.purpose,
                    project_overview: order.project_overview,
                    hasReferences: order.references_link ? 'yes' : 'no',
                    references_link: order.references_link || '',
                    platforms: order.platform || [],
                    usage_type: order.usage_type,
                    additional_notes: order.additional_notes || ''
                });

                console.log('✅ Form data initialized');
            } catch (error: any) {
                console.error('❌ Error fetching order:', error);
                toast.error(error.message || 'Failed to load order');
                router.push('/myorder');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [user?.id, orderId, router]);

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
            <Badge className={`${config.className} flex items-center gap-1 text-xs`}>
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

    const handleSubmit = async () => {
        if (!editingOrder) return;

        if (!formData.purpose || !formData.project_overview ||
            !formData.usage_type || formData.platforms.length === 0) {
            setError('Please fill in all required fields');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const orderData = {
                discord: formData.discord || '',
                purpose: formData.purpose,
                project_overview: formData.project_overview,
                references_link: formData.references_link || '',
                platform: formData.platforms,
                usage_type: formData.usage_type,
                additional_notes: formData.additional_notes || ''
            };

            console.log('💾 Saving order:', orderData);
            const result = await updateOrder(editingOrder.id, orderData as any);
            console.log('📨 Update result:', result);

            if (result.success) {
                toast.success('Order updated successfully!');
                router.push('/myorder');
            } else {
                setError(result.message || 'Failed to update order');
            }
        } catch (err: any) {
            console.error('❌ Error updating order:', err);
            setError(err.message || 'Failed to update order');
        } finally {
            setIsSubmitting(false);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#D78FEE] animate-spin mx-auto mb-3" />
                    <p className="text-primary text-sm">Loading order...</p>
                </div>
            </div>
        );
    }

    if (!editingOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-3">Order not found or you don't have permission</p>
                    <Button
                        onClick={() => router.push('/myorder')}
                        size="sm"
                        className="bg-primary text-black rounded-full"
                    >
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-black ">
            <div className="relative z-10 w-full max-w-5xl mx-auto">


                {/* Order Items Summary - Compact */}
                <div className="mb-4 bg-white shadow rounded-lg p-4">
                    <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/user/user-order/')}
                        className=" text-gray-500 hover:text-black hover:bg-white/5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 " />

                    </Button>
                    <h3 className="font-semibold text-base ">Edit Order Items</h3>
                    </div>
                    <div className="space-y-2">
                        {editingOrder.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                                <div className="space-y-0.5 flex-1 min-w-0">
                                    <p className="font-medium text-primary text-sm truncate">{item.category_name}</p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {item.package_name} • {item.package_type} • Qty: {item.quantity}
                                    </p>
                                </div>
                                <div className="text-right ml-2 flex-shrink-0">
                                    <p className="text-xs text-gray-600">
                                        {formatCurrency(item.price)} × {item.quantity}
                                    </p>
                                    <p className="font-semibold text-sm text-primary">
                                        {formatCurrency(item.total)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                        <span className="font-semibold text-sm">Total:</span>
                        <span className="font-bold text-lg text-primary">
                            {formatCurrency(editingOrder.total)}
                        </span>
                    </div>
                </div>
                {error && (
                    <Alert className="mb-4 bg-red-500/10 border-red-500/30 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Edit Form - Compact */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="space-y-4">
                        {/* Read-only fields - Compact Grid */}
                        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg ">
                            <div>
                                <Label className="text-gray-500 text-xs">Status</Label>
                                <div className="mt-1">{getStatusBadge(editingOrder.status)}</div>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-xs">Email</Label>
                                <p className="text-black text-sm mt-1 truncate">{editingOrder.users?.email}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-xs">Name</Label>
                                <p className="text-black text-sm mt-1 truncate">{editingOrder.users?.full_name || displayName}</p>
                            </div>
                        </div>

                        {/* Editable fields - Compact Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-primary text-sm">Discord Username</Label>
                                <Input
                                    placeholder="username#0000"
                                    value={formData.discord}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                                    className="bg-white/5 border-[#9B5DE0]/30 text-black placeholder-gray-500 h-9 text-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-primary text-sm">Purpose *</Label>
                                <Select
                                    value={formData.purpose}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-[#9B5DE0]/30">
                                        <SelectGroup>
                                            <SelectItem value="vtuber-debut" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">VTuber debut</SelectItem>
                                            <SelectItem value="rebrand" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">Rebrand / upgrade</SelectItem>
                                            <SelectItem value="event" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">Event / campaign</SelectItem>
                                            <SelectItem value="personal" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">Personal project</SelectItem>
                                            <SelectItem value="other" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">Other</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-primary text-sm">Usage Type *</Label>
                                <Select
                                    value={formData.usage_type}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, usage_type: value }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-[#9B5DE0]/30">
                                        <SelectGroup>
                                            <SelectItem value="personal" className="text-black text-sm">Personal use</SelectItem>
                                            <SelectItem value="commercial" className="text-black text-sm">Commercial use</SelectItem>
                                            <SelectItem value="brand" className="text-black text-sm">Brand / agency use</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-primary text-sm">Have references?</Label>
                                <Select
                                    value={formData.hasReferences}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, hasReferences: value }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-[#9B5DE0]/30">
                                        <SelectItem value="yes" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">Yes</SelectItem>
                                        <SelectItem value="no" className="text-primary focus:bg-[#9B5DE0]/20 text-sm">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-primary text-sm">Project Overview *</Label>
                            <Textarea
                                rows={3}
                                value={formData.project_overview}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_overview: e.target.value }))}
                                className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none text-sm"
                            />
                        </div>

                        {formData.hasReferences === 'yes' && (
                            <div className="space-y-1">
                                <Label className="text-primary text-sm">Reference Links</Label>
                                <Textarea
                                    rows={2}
                                    value={formData.references_link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, references_link: e.target.value }))}
                                    className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none text-sm"
                                    placeholder="Add links to reference images"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-primary text-sm">Platforms *</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'].map((platform) => (
                                    <div key={platform} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={formData.platforms.includes(platform.toLowerCase())}
                                            onCheckedChange={() => togglePlatform(platform.toLowerCase())}
                                            className="border-[#9B5DE0]/30 h-4 w-4"
                                        />
                                        <Label className="text-primary cursor-pointer text-sm">{platform}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-primary text-sm">Additional Notes</Label>
                            <Textarea
                                rows={2}
                                value={formData.additional_notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                                className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none text-sm"
                                placeholder="Any additional information"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                            <Button
                                onClick={() => router.push('/myorder')}
                                variant="outline"
                                
                                className=" bg-white/5  cursor-pointer border-primary border-2 text-black hover:bg-white/10"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                
                                className=" bg-primary  cursor-pointer border-primary border-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
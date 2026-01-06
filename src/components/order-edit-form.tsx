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
import { IOrder, ICategory } from '@/interface';
import { getAllOrder, updateOrder } from '@/action/order';
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

    const [editingOrder, setEditingOrder] = useState<IOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
      const getDisplayName = () => {
        if (!user) return null
        if (user.user_metadata?.full_name) return user.user_metadata.full_name
        if (user.user_metadata?.name) return user.user_metadata.name
        return user.email?.split("@")[0]
    }

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
                const response = await getAllOrder();
                console.log('📦 All orders response:', response);
                console.log('📋 All order IDs:', response.data?.map((o: IOrder) => ({ id: o.id, type: typeof o.id })));
                console.log('🔑 Looking for orderId:', orderId, 'type:', typeof orderId);

                if (!response?.success) {
                    throw new Error(response?.message || 'Failed to fetch orders');
                }

                // Find the specific order - try both string and direct comparison
                const order = response.data.find((o: IOrder) => {
                    console.log('Comparing:', o.id, '===', orderId, '?', o.id === orderId);
                    console.log('String compare:', String(o.id), '===', String(orderId), '?', String(o.id) === String(orderId));
                    return String(o.id) === String(orderId);
                });
                console.log('🎯 Found order:', order);
                
                if (!order) {
                    console.log('❌ Order not found');
                    toast.error('Order not found');
                    router.push('/myorder');
                    return;
                }

                // Check if user owns this order
                if (order.user_id !== user.id) {
                    console.log('❌ User does not own this order');
                    toast.error('You do not have permission to edit this order');
                    router.push('/myorder');
                    return;
                }

                // Check if order can be edited (removed the status check for testing)
                console.log('✅ Order can be edited, status:', order.status);

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
                
                console.log('✅ Order loaded successfully');
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

    const handleSubmit = async () => {
        if (!editingOrder) return;

        // Validation
        if (!formData.categories_id || !formData.purpose || !formData.project_overview || 
            !formData.usage_type || formData.platforms.length === 0) {
            setError('Please fill in all required fields');
            return;
        }

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

            console.log('💾 Saving order:', orderData);
            const result = await updateOrder(editingOrder.id, orderData);
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
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#D78FEE] animate-spin mx-auto mb-4" />
                    <p className="text-primary">Loading order...</p>
                   
                </div>
            </div>
        );
    }

    if (!editingOrder) {
        return (
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-500">Order not found or you don't have permission</p>
                    <Button 
                        onClick={() => router.push('/myorder')}
                        className="mt-4 bg-primaery text-black rounded-full flex items-center justify-center"
                    >
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  text-black py-12 px-4 mt-30">
       

            <div className="relative z-10 w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/myorder')}
                        className="mb-4 text-gray-500 hover:text-black hover:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                    </Button>
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="w-8 h-8 text-secondary" />
                        <h1 className="text-4xl font-bold text-primary">
                            Edit Order
                        </h1>
                    </div>
                    <p className="text-gray-500">Update your commission order details</p>
                    <p className="text-gray-600 text-sm mt-1">Order ID: {editingOrder.id}</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert className="mb-6 bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Edit Form */}
                <div className="bg-muted/10 border border-[#9B5DE0]/30 rounded-lg p-6">
                    <div className="space-y-6">
                        {/* Read-only fields */}
                        <div className="space-y-4 p-4  rounded-lg bg-muted/50">
                            <div>
                                <Label className="text-gray-500 text-sm">Status </Label>
                                <div className="mt-2">{getStatusBadge(editingOrder.status)}</div>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-sm">Email </Label>
                                <p className="text-black mt-1">{editingOrder.users?.email}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-sm">Name </Label>
                                <p className="text-black mt-1">{editingOrder.users?.full_name || displayName}</p>
                            </div>
                        </div>

                        {/* Editable fields */}
                        <div className="space-y-2">
                            <Label className="text-primary">Discord Username</Label>
                            <Input
                                placeholder="username#0000"
                                value={formData.discord}
                                onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                                className="bg-white/5 border-[#9B5DE0]/30 text-black placeholder-gray-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Service Type *</Label>
                            <Select
                                value={String(formData.categories_id)}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, categories_id: value }))}
                            >
                                <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-[#9B5DE0]/30">
                                    <SelectGroup>
                                        {Array.isArray(categories) && categories.length > 0 ? (
                                            categories.map((cat) => (
                                                <SelectItem key={cat.id} value={String(cat.id)} className="text-primary focus:bg-[#9B5DE0]/20">
                                                    {cat.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="loading" disabled className="text-gray-500">
                                                Loading categories...
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Purpose *</Label>
                            <Select
                                value={formData.purpose}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                            >
                                <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-[#9B5DE0]/30">
                                    <SelectGroup>
                                        <SelectItem value="vtuber-debut" className="text-primary focus:bg-[#9B5DE0]/20">VTuber debut</SelectItem>
                                        <SelectItem value="rebrand" className="text-primary focus:bg-[#9B5DE0]/20">Rebrand / upgrade</SelectItem>
                                        <SelectItem value="event" className="text-primary focus:bg-[#9B5DE0]/20">Event / campaign</SelectItem>
                                        <SelectItem value="personal" className="text-primary focus:bg-[#9B5DE0]/20">Personal project</SelectItem>
                                        <SelectItem value="other" className="text-primary focus:bg-[#9B5DE0]/20">Other</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Project Overview *</Label>
                            <Textarea
                                rows={4}
                                value={formData.project_overview}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_overview: e.target.value }))}
                                className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Do you have references?</Label>
                            <Select
                                value={formData.hasReferences}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, hasReferences: value }))}
                            >
                                <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-[#9B5DE0]/30">
                                    <SelectItem value="yes" className="text-primary focus:bg-[#9B5DE0]/20">Yes</SelectItem>
                                    <SelectItem value="no" className="text-primary focus:bg-[#9B5DE0]/20">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.hasReferences === 'yes' && (
                            <div className="space-y-2">
                                <Label className="text-primary">Reference Links</Label>
                                <Textarea
                                    rows={3}
                                    value={formData.references_link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, references_link: e.target.value }))}
                                    className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none"
                                    placeholder="Add links to reference images or examples"
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-primary">Platforms *</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'].map((platform) => (
                                    <div key={platform} className="flex items-center gap-3">
                                        <Checkbox
                                            checked={formData.platforms.includes(platform.toLowerCase())}
                                            onCheckedChange={() => togglePlatform(platform.toLowerCase())}
                                            className="border-[#9B5DE0]/30"
                                        />
                                        <Label className="text-primary cursor-pointer">{platform}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Usage Type *</Label>
                            <Select
                                value={formData.usage_type}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, usage_type: value }))}
                            >
                                <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-[#9B5DE0]/30">
                                    <SelectGroup>
                                        <SelectItem value="personal" className="text-black">Personal use</SelectItem>
                                        <SelectItem value="commercial" className="text-black">Commercial use</SelectItem>
                                        <SelectItem value="brand" className="text-black">Brand / agency use</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary">Additional Notes</Label>
                            <Textarea
                                rows={3}
                                value={formData.additional_notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                                className="bg-white/5 border-[#9B5DE0]/30 text-black resize-none"
                                placeholder="Any additional information or requirements"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={() => router.push('/myorder')}
                                variant="outline"
                                className="flex-1 bg-white/5 rounded-full cursor-pointer border-primary border-2 text-black hover:bg-white/10 p-6"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 bg-primary rounded-full cursor-pointer border-primary border-2 p-6"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
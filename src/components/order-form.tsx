"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  ShoppingCart, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Package,
  CreditCard
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth';
import type { ICartItemDetail } from '@/interface';

interface CheckoutPageProps {
  cartItems: ICartItemDetail[];
  userId: string;
  onSubmitCheckout: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export default function CheckoutPage({ cartItems = [], userId, onSubmitCheckout }: CheckoutPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useAuthStore((s) => s.user);

  const getDisplayName = () => {
    if (!user) return null;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    return user.email?.split("@")[0];
  };

  const displayName = getDisplayName();

  const [formData, setFormData] = useState({
    name: displayName ?? '',
    email: user?.email ?? '',
    discord: '',
    purpose: '',
    project_overview: '',
    hasReferences: '',
    references_link: '',
    platforms: [] as string[],
    usage_type: '',
    additional_notes: ''
  });

  // Calculate totals - with safety check
  const subtotal = Array.isArray(cartItems) 
    ? cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0)
    : 0;
  const totalItems = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      name: displayName ?? '', 
      email: user?.email ?? '' 
    }));
  }, [displayName, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.discord) newErrors.discord = 'Discord username is required for communication';
    if (!formData.purpose) newErrors.purpose = 'Project purpose is required';
    if (!formData.project_overview) newErrors.project_overview = 'Project description is required';
    if (!formData.hasReferences) newErrors.hasReferences = 'Please select an option';
    if (formData.hasReferences === 'yes' && !formData.references_link) {
      newErrors.references_link = 'Please provide reference links';
    }
    if (!formData.usage_type) newErrors.usage_type = 'Usage type is required';
    if (formData.platforms.length === 0) newErrors.platforms = 'Please select at least one platform';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Prepare order data dengan cart_id dari setiap item
      const orderData = {
        user_id: userId,
        discord: formData.discord,
        purpose: formData.purpose,
        project_overview: formData.project_overview,
        references_link: formData.references_link || '',
        platform: formData.platforms,
        usage_type: formData.usage_type,
        additional_notes: formData.additional_notes || '',
        total: subtotal,
        // Include cart_id untuk relasi
        cart_items: cartItems.map(item => ({
          cart_id: item.id, // ✅ ID dari cart item untuk relasi
          categories_id: item.categories_id,
          package_id: item.package_id,
          quantity: item.quantity,
          price: item.package_price,
          total: item.item_total,
          category_name: item.category_name,
          package_name: item.package_name,
          package_type: item.package_type
        }))
      };

      const result = await onSubmitCheckout(orderData);

      if (result.success) {
        setSuccess('Order placed successfully! We will contact you shortly to discuss your project.');
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        setError(result.message || 'Failed to place order. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
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
    setErrors(prev => ({ ...prev, platforms: '' }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
            <Button onClick={() => router.push('/service')} className="w-full bg-purple-600 hover:bg-purple-700">
              Browse Services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-2 border-green-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
              <p className="text-gray-600">{success}</p>
              <Button
                onClick={() => router.push('/orders')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.push('/cart')}
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </Badge>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order details</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form - Left Side (2 columns) */}
          <div className=" space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formData.name} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formData.email} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discord Username *</Label>
                  <Input
                    placeholder="username#0000"
                    value={formData.discord}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, discord: e.target.value }));
                      setErrors(prev => ({ ...prev, discord: '' }));
                    }}
                    className={errors.discord ? 'border-red-500' : ''}
                  />
                  {errors.discord && <p className="text-sm text-red-500">{errors.discord}</p>}
                  <p className="text-sm text-gray-500">Required for project communication</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
        
            {/* Usage Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Usage Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Where will this be used? * (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'].map((platform) => (
                      <div key={platform} className="flex items-start gap-3">
                        <Checkbox
                          id={platform}
                          checked={formData.platforms.includes(platform.toLowerCase())}
                          onCheckedChange={() => togglePlatform(platform.toLowerCase())}
                        />
                        <Label htmlFor={platform} className="cursor-pointer font-normal">
                          {platform}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.platforms && <p className="text-sm text-red-500">{errors.platforms}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Usage type *</Label>
                  <Select
                    value={formData.usage_type}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, usage_type: value }));
                      setErrors(prev => ({ ...prev, usage_type: '' }));
                    }}
                  >
                    <SelectTrigger className={errors.usage_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select usage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Usage Type</SelectLabel>
                        <SelectItem value="personal">Personal use</SelectItem>
                        <SelectItem value="commercial">Commercial use</SelectItem>
                        <SelectItem value="brand">Brand / agency use</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.usage_type && <p className="text-sm text-red-500">{errors.usage_type}</p>}
                  <p className="text-sm text-gray-500">This affects pricing and licensing terms</p>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes (optional)</Label>
                  <Textarea
                    placeholder="Any special requests or additional information..."
                    rows={4}
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Side (1 column) */}
          <div className="lg:col-span-1">
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="w-5 h-5 mr-2" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Purpose of this project *</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, purpose: value }));
                      setErrors(prev => ({ ...prev, purpose: '' }));
                    }}
                  >
                    <SelectTrigger className={errors.purpose ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Project Purpose</SelectLabel>
                        <SelectItem value="vtuber-debut">VTuber debut</SelectItem>
                        <SelectItem value="rebrand">Rebrand / upgrade</SelectItem>
                        <SelectItem value="event">Event / campaign</SelectItem>
                        <SelectItem value="personal">Personal project</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.purpose && <p className="text-sm text-red-500">{errors.purpose}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Project Description *</Label>
                  <Textarea
                    placeholder="Describe your project, character, brand vibe, theme, or goal..."
                    rows={5}
                    value={formData.project_overview}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, project_overview: e.target.value }));
                      setErrors(prev => ({ ...prev, project_overview: '' }));
                    }}
                    className={errors.project_overview ? 'border-red-500' : ''}
                  />
                  {errors.project_overview && <p className="text-sm text-red-500">{errors.project_overview}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Do you have visual references? *</Label>
                  <Select
                    value={formData.hasReferences}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, hasReferences: value }));
                      setErrors(prev => ({ ...prev, hasReferences: '' }));
                    }}
                  >
                    <SelectTrigger className={errors.hasReferences ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="yes">Yes (I'll provide links)</SelectItem>
                        <SelectItem value="no">No, I'd like help developing the concept</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.hasReferences && <p className="text-sm text-red-500">{errors.hasReferences}</p>}
                </div>

                {formData.hasReferences === 'yes' && (
                  <div className="space-y-2">
                    <Label>Reference Links *</Label>
                    <Textarea
                      placeholder="Paste links to your references (one per line)"
                      rows={4}
                      value={formData.references_link}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, references_link: e.target.value }));
                        setErrors(prev => ({ ...prev, references_link: '' }));
                      }}
                      className={errors.references_link ? 'border-red-500' : ''}
                    />
                    {errors.references_link && <p className="text-sm text-red-500">{errors.references_link}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.category_name}</p>
                        <p className="text-xs text-gray-600">{item.package_type} - {item.package_name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${item.item_total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-purple-600">${subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

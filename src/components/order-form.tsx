"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowRight,
  Package,
  CreditCard,
  Tag,
  X,
  ChevronRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth';
import type { ICartItemDetail } from '@/interface';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '@/components/checkout-form'; // sesuaikan path
import { getStripeClientSecret } from '@/action/payment'; // sesuaikan path
import CustomStripeDialog from '@/components/checkout-form';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
interface CheckoutPageProps {
  cartItems: ICartItemDetail[];
  userId: string;
  onSubmitCheckout: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export default function CheckoutPage({ cartItems = [], userId, onSubmitCheckout }: CheckoutPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useAuthStore((s) => s.user);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const voucherId = searchParams.get('voucher_id');
  const voucherCode = searchParams.get('voucher_code');
  const voucherValue = searchParams.get('voucher_value');

  const getDisplayName = () => {
    if (!user) return null;
    if (user.full_name) return user.full_name;
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

  const calculateDiscount = () => {
    if (!voucherValue) return 0;

    const subtotal = Array.isArray(cartItems)
      ? cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0)
      : 0;

    const percentageMatch = voucherValue.match(/(\d+)%/);

    if (percentageMatch) {
      // Jika ada %, hitung persentase discount
      const percentage = parseInt(percentageMatch[1]);
      return (subtotal * percentage) / 100;
    } else {
      // Jika tidak ada %, anggap sebagai nilai nominal langsung
      const nominalValue = parseFloat(voucherValue.replace(/[^\d.]/g, ''));
      return isNaN(nominalValue) ? 0 : nominalValue;
    }
  };

  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0)
    : 0;
  const discount = calculateDiscount();
  const total = subtotal - discount;

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: displayName ?? '',
      email: user?.email ?? ''
    }));
  }, [displayName, user]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.discord) newErrors.discord = 'Discord username is required';
    } else if (step === 2) {
      if (!formData.purpose) newErrors.purpose = 'Project purpose is required';
      if (!formData.project_overview) newErrors.project_overview = 'Project description is required';
      if (!formData.hasReferences) newErrors.hasReferences = 'Please select an option';
      if (formData.hasReferences === 'yes' && !formData.references_link) {
        newErrors.references_link = 'Please provide reference links';
      }
    } else if (step === 3) {
      if (formData.platforms.length === 0) newErrors.platforms = 'Please select at least one platform';
      if (!formData.usage_type) newErrors.usage_type = 'Usage type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setError('Please complete all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Get Stripe client secret
      const stripeResult = await getStripeClientSecret(total); // total sudah dalam USD

      if (!stripeResult.success || !stripeResult.data) {
        setError('Failed to initialize payment. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setClientSecret(stripeResult.data);
      setShowPaymentDialog(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setIsSubmitting(false);
    }
  };
  const handlePaymentSuccess = async (paymentId: string) => {
    setIsSubmitting(true);

    try {
      const orderData = {
        user_id: userId,
        discord: formData.discord,
        purpose: formData.purpose,
        project_overview: formData.project_overview,
        references_link: formData.references_link || '',
        platform: formData.platforms,
        usage_type: formData.usage_type,
        additional_notes: formData.additional_notes || '',
        total: total,
        voucher_id: voucherId || undefined,
        payment_id: paymentId, // Tambahkan payment ID dari Stripe
        cart_items: cartItems.map(item => ({
          cart_id: item.id,
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
          router.push('/myorder');
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

  const handleRemoveVoucher = () => {
    router.push('/cart');
  };

  const steps = [
    { number: 1, title: 'Contact', icon: User },
    { number: 2, title: 'Project', icon: Package },
    { number: 3, title: 'Usage', icon: MessageSquare },
    { number: 4, title: 'Review', icon: CreditCard }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-white">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
            <Button onClick={() => router.push('/service')} className="w-full bg-primary hover:bg-primary/90">
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
                onClick={() => router.push('/myorder')}
                className="w-full bg-primary hover:bg-primary/90"
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
    <div className="min-h-screen py-8 sm:py-12 px-4 mt-15 sm:mt-15">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className='w-full mb-8 sm:mb-10 text-center'>
          <h1 className="text-2xl sm:text-4xl font-bold text-primary mb-1">Checkout</h1>
          <p className="text-gray-600 text-sm sm:text-base">Complete Your Order Detail</p>

        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 max-w-3xl mx-auto">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {voucherCode && (
          <Alert className="mb-6 bg-green-50 border-green-200 max-w-3xl mx-auto">
            <Tag className="w-4 h-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between text-green-700">
              <div>
                <strong>Voucher Applied:</strong> {voucherCode} ({voucherValue} discount)
              </div>
              <Button
                onClick={handleRemoveVoucher}
                variant="ghost"
                size="sm"
                className="text-green-700 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                          w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all
                          ${isActive ? 'bg-primary text-white ring-4 ring-primary/20' : ''}
                          ${isCompleted ? 'bg-green-500 text-white' : ''}
                          ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                        `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <Card className='bg-white overflow-hidden border-2 shadow-lg mt-5 p-0'>

            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <>
                <CardHeader className='bg-secondary  pt-5 pb-3'>
                  <CardTitle className="flex items-center text-xl text-white">
                    <User className="w-6 h-6 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 sm:p-8">

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Name</Label>
                    <Input value={formData.name} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={formData.email} readOnly className="bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Discord Username *</Label>
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
                    <p className="text-xs text-gray-500">Required for project communication</p>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
              <>
                <CardHeader className='bg-secondary  pt-5 pb-3'>
                  <CardTitle className="flex items-center text-xl text-white">
                    <Package className="w-6 h-6 mr-2" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Purpose of this project *</Label>
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
                    <Label className="text-sm font-medium">Project Description *</Label>
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
                    <Label className="text-sm font-medium">Do you have visual references? *</Label>
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
                      <Label className="text-sm font-medium">Reference Links *</Label>
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
              </>
            )}

            {/* Step 3: Usage Information */}
            {currentStep === 3 && (
              <>
                <CardHeader className='bg-secondary  pt-5 pb-3'>
                  <CardTitle className="flex items-center text-xl text-white">
                    <MessageSquare className="w-6 h-6 mr-2" />
                    Usage Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Where will this be used? * (Select all that apply)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'].map((platform) => (
                        <div key={platform} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id={platform}
                            checked={formData.platforms.includes(platform.toLowerCase())}
                            onCheckedChange={() => togglePlatform(platform.toLowerCase())}
                          />
                          <Label htmlFor={platform} className="cursor-pointer font-normal text-sm">
                            {platform}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.platforms && <p className="text-sm text-red-500">{errors.platforms}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Usage type *</Label>
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
                    <p className="text-xs text-gray-500">This affects pricing and licensing terms</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Notes (optional)</Label>
                    <Textarea
                      placeholder="Any special requests or additional information..."
                      rows={4}
                      value={formData.additional_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <>
                <CardHeader className='bg-secondary  pt-5 pb-3'>
                  <CardTitle className="flex items-center text-xl text-white">
                    <CreditCard className="w-6 h-6 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Cart Items */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-700">Order Items</h3>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="font-semibold">{item.category_name}</p>
                              <p className="text-sm text-gray-600">{item.package_type} - {item.package_name}</p>
                              <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">${item.item_total.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details Summary */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 text-gray-700">Order Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discord:</span>
                        <span className="font-medium">{formData.discord}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="font-medium">{formData.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platforms:</span>
                        <span className="font-medium">{formData.platforms.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usage Type:</span>
                        <span className="font-medium">{formData.usage_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="border-t pt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${subtotal.toLocaleString()}</span>
                    </div>

                    {voucherCode && discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Discount ({voucherValue})
                        </span>
                        <span className="font-semibold">-${discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xl font-bold pt-3 border-t">
                      <span>Total</span>
                      <span className="text-primary">${total.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 text-center pt-4">
                    By placing this order, you agree to our Terms of Service
                  </p>
                </CardContent>
              </>
            )}

            {/* Navigation Buttons Inside Card */}
            <div className={`flex gap-4 p-6 border-t justify-between  w-full ${currentStep === 1 ? "justify-end" : "justify-between"} `}>
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="bg-muted/50 "
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className=" bg-primary hover:bg-primary/90 py-6 text-base font-semibold"
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
              )}
              {/* Stripe Payment Dialog */}
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CustomStripeDialog
                    open={showPaymentDialog}
                    setOpen={setShowPaymentDialog}
                    clientSecret={clientSecret}
                    amount={total}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
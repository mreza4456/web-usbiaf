"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Sparkles, User, Package, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addOrder } from '@/action/order';
import { ICategory } from '@/interface';
import { useAuthStore } from '@/store/auth';


interface NemunekoContactProps {
    categories: ICategory[];
    userId: string; // Current logged in user ID
}

export default function OrderForm({ categories, userId }: NemunekoContactProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const user = useAuthStore((s) => s.user)
    const isLoading = useAuthStore((s) => s.isLoading)

    const getDisplayName = () => {
        if (!user) return null
        if (user.user_metadata?.full_name) return user.user_metadata.full_name
        if (user.user_metadata?.name) return user.user_metadata.name
        return user.email?.split("@")[0]
    }

    const displayName = getDisplayName()

    useEffect(() => {
        setFormData(prev => ({ ...prev, name: displayName ?? '', email: user?.email ?? '' }));
    }, [displayName, user]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
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

    const totalSteps = 4;

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {

        } else if (step === 2) {
            if (!formData.categories_id) newErrors.categories_id = 'Service type is required';
            if (!formData.purpose) newErrors.purpose = 'Project purpose is required';
        } else if (step === 3) {
            if (!formData.project_overview) newErrors.project_overview = 'Project description is required';
            if (!formData.hasReferences) newErrors.hasReferences = 'Please select an option';
        } else if (step === 4) {
            if (!formData.usage_type) newErrors.usage_type = 'Usage type is required';
            if (formData.platforms.length === 0) newErrors.platforms = 'Please select at least one platform';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateStep(4)) return;

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            // Prepare data for database
            const orderData = {
                user_id: userId,
                discord: formData.discord || '',
                categories_id: formData.categories_id,
                purpose: formData.purpose,
                project_overview: formData.project_overview,
                references_link: formData.references_link || '',
                platform: formData.platforms, // Convert array to comma-separated string
                usage_type: formData.usage_type,
                additional_notes: formData.additional_notes || ''
            };

            const result = await addOrder(orderData);

            if (result.success) {
                setSuccess('Commission request submitted successfully! We will review your request and contact you if we can accept your project.');
                setFormData({
                    name: '',
                    email: '',
                    discord: '',
                    categories_id: '',
                    purpose: '',
                    project_overview: '',
                    hasReferences: '',
                    references_link: '',
                    platforms: [],
                    usage_type: '',
                    additional_notes: ''
                });
                setCurrentStep(1);
            } else {
                setError(result.message || 'Failed to submit request. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
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

    if (success) {
        return (
            <div className="min-h-screen  flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-primary">Request Submitted!</h2>
                        <p className="text-primary">{success}</p>
                        <Button
                            onClick={() => setSuccess('')}
                            className="w-full b text-primary py-3"
                        >
                            Submit Another Request
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-primary py-12 px-4">


            <div className="relative z-10 w-full max-w-5xl mx-auto mb-20">
                <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
                    <div className="container mx-auto text-center">
                      
                        <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
                            <span className="text-sm font-semibold text-[#50398e]">  💬 Thank you for interest</span>
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            Lets Work{' '}
                            <span className="relative">
                                Together
                               <div className="absolute -bottom-2 left-0 w-full h-3  opacity-50 -rotate-2 -z-5"><img src="curve.png" alt="" /></div>
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-black mb-8 max-w-3xl mx-auto">
                            Please read our Terms of Service before submitting.
                        </p>
                    </div>
                </section>

                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex flex-col items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step
                                    ? 'text-background bg-primary'
                                    : 'bg-primary/5 text-black'
                                    }`}>
                                    {step}
                                </div>
                                <span className="text-xs mt-2 text-gray-800">
                                    {step === 1 && 'Basic Info'}
                                    {step === 2 && 'Service'}
                                    {step === 3 && 'Project Details'}
                                    {step === 4 && 'Usage & Notes'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="relative h-2 bg-primary/5 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-muted transition-all duration-500"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                <Card className="bg-muted/5 border-primary">
                    <CardContent className="p-6 space-y-6">
                        {error && (
                            <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-8">
                            {/* Step 1: Basic Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <h3 className="text-xl font-semibold text-secondary flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Basic Information
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Name *</Label>
                                        <Input
                                            placeholder="Your full name"
                                            value={formData.name || ''}
                                            readOnly
                                            className="bg-muted/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50 "
                                        />
                                        {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Email Address *</Label>
                                        <Input
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email || ''}
                                            readOnly
                                            className="bg-white/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50 "
                                        />
                                        {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Discord Username (optional)</Label>
                                        <Input
                                            placeholder="username#0000"
                                            value={formData.discord}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                                            className="bg-white/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Service Request */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <h3 className="text-xl font-semibold text-secondary flex items-center">
                                        <Package className="w-5 h-5 mr-2" />
                                        Service Request
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="text-primary">What service would you like to order? *</Label>
                                        <Select
                                            value={formData.categories_id}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({ ...prev, categories_id: value }));
                                                setErrors(prev => ({ ...prev, categories_id: '' }));
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-primary focus:border-[#D78FEE]/50 w-full">
                                                <SelectValue placeholder="Select a service" />
                                            </SelectTrigger>
                                            <SelectContent className="background border-[#9B5DE0]/30">
                                                <SelectGroup>
                                                    <SelectLabel className="text-secondary">Services</SelectLabel>
                                                    {categories.map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id}
                                                            className="text-primary focus:bg-[#9B5DE0]/20"
                                                        >
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.categories_id && <p className="text-sm text-red-400">{errors.categories_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Purpose of this project *</Label>
                                        <Select
                                            value={formData.purpose}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({ ...prev, purpose: value }));
                                                setErrors(prev => ({ ...prev, purpose: '' }));
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-primary focus:border-[#D78FEE]/50 w-full">
                                                <SelectValue placeholder="Select purpose" />
                                            </SelectTrigger>
                                            <SelectContent className="background border-[#9B5DE0]/30">
                                                <SelectGroup>
                                                    <SelectLabel className="text-secondary">Project Purpose</SelectLabel>
                                                    <SelectItem value="vtuber-debut" className="text-primary focus:bg-[#9B5DE0]/20">VTuber debut</SelectItem>
                                                    <SelectItem value="rebrand" className="text-primary focus:bg-[#9B5DE0]/20">Rebrand / upgrade</SelectItem>
                                                    <SelectItem value="event" className="text-primary focus:bg-[#9B5DE0]/20">Event / campaign</SelectItem>
                                                    <SelectItem value="personal" className="text-primary focus:bg-[#9B5DE0]/20">Personal project</SelectItem>
                                                    <SelectItem value="other" className="text-primary focus:bg-[#9B5DE0]/20">Other</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.purpose && <p className="text-sm text-red-400">{errors.purpose}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Project Overview */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <h3 className="text-xl font-semibold text-secondary flex items-center">
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Project Overview
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Briefly describe your project *</Label>
                                        <Textarea
                                            placeholder="Character, brand vibe, theme, or goal..."
                                            rows={5}
                                            value={formData.project_overview}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, project_overview: e.target.value }));
                                                setErrors(prev => ({ ...prev, project_overview: '' }));
                                            }}
                                            className="bg-white/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50 resize-none"
                                        />
                                        <p className="text-sm text-gray-500">Help us understand your vision and requirements.</p>
                                        {errors.project_overview && <p className="text-sm text-red-400">{errors.project_overview}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Do you have visual references? *</Label>
                                        <Select
                                            value={formData.hasReferences}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({ ...prev, hasReferences: value }));
                                                setErrors(prev => ({ ...prev, hasReferences: '' }));
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-primary focus:border-[#D78FEE]/50 w-full">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent className="background border-[#9B5DE0]/30">
                                                <SelectGroup>
                                                    <SelectItem value="yes" className="text-primary focus:bg-[#9B5DE0]/20">Yes (I'll provide links)</SelectItem>
                                                    <SelectItem value="no" className="text-primary focus:bg-[#9B5DE0]/20">No, I'd like Nemuneko to help develop the concept</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.hasReferences && <p className="text-sm text-red-400">{errors.hasReferences}</p>}
                                    </div>

                                    {formData.hasReferences === 'yes' && (
                                        <div className="space-y-2">
                                            <Label className="text-primary">Reference Links</Label>
                                            <Textarea
                                                placeholder="Paste links to your references (one per line)"
                                                rows={4}
                                                value={formData.references_link}
                                                onChange={(e) => setFormData(prev => ({ ...prev, references_link: e.target.value }))}
                                                className="bg-white/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50 resize-none"
                                            />
                                            <p className="text-sm text-gray-500">Share Pinterest boards, images, or style references.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Usage & Scope */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <h3 className="text-xl font-semibold text-secondary flex items-center">
                                        <MessageSquare className="w-5 h-5 mr-2" />
                                        Usage & Scope
                                    </h3>

                                    <div className="space-y-3">
                                        <Label className="text-primary">Where will this be used? * (Select all that apply)</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'].map((platform) => (
                                                <div key={platform} className="flex items-start gap-3">
                                                    <Checkbox
                                                        id={platform}
                                                        checked={formData.platforms.includes(platform.toLowerCase())}
                                                        onCheckedChange={() => togglePlatform(platform.toLowerCase())}
                                                        className="border-[#9B5DE0]/30 data-[state=checked]:bg-[#9B5DE0] data-[state=checked]:border-[#9B5DE0]"
                                                    />
                                                    <Label
                                                        htmlFor={platform}
                                                        className="text-primary cursor-pointer font-normal"
                                                    >
                                                        {platform}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.platforms && <p className="text-sm text-red-400">{errors.platforms}</p>}
                                        <p className="text-sm text-gray-500">Select all platforms where you'll use this asset.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Usage type *</Label>
                                        <Select
                                            value={formData.usage_type}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({ ...prev, usage_type: value }));
                                                setErrors(prev => ({ ...prev, usage_type: '' }));
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#9B5DE0]/30 text-primary focus:border-[#D78FEE]/50 w-full">
                                                <SelectValue placeholder="Select usage type" />
                                            </SelectTrigger>
                                            <SelectContent className="background border-[#9B5DE0]/30">
                                                <SelectGroup>
                                                    <SelectLabel className="text-secondary">Usage Type</SelectLabel>
                                                    <SelectItem value="personal" className="text-primary focus:bg-[#9B5DE0]/20">Personal use</SelectItem>
                                                    <SelectItem value="commercial" className="text-primary focus:bg-[#9B5DE0]/20">Commercial use</SelectItem>
                                                    <SelectItem value="brand" className="text-primary focus:bg-[#9B5DE0]/20">Brand / agency use</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500">This affects pricing and licensing terms.</p>
                                        {errors.usage_type && <p className="text-sm text-red-400">{errors.usage_type}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Additional Notes (optional)</Label>
                                        <Textarea
                                            placeholder="Artist preference, special requests, expectations..."
                                            rows={4}
                                            value={formData.additional_notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                                            className="bg-white/5 border-[#9B5DE0]/30 text-primary placeholder-gray-500 focus:border-[#D78FEE]/50 resize-none"
                                        />
                                        <p className="text-sm text-gray-500">Any additional information that might help us with your project.</p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between pt-6">
                                {currentStep > 1 && (
                                    <Button
                                        onClick={prevStep}
                                        className="bg-white/5 hover:bg-white/10 text-primary border border-primary"
                                    >
                                        Previous
                                    </Button>
                                )}

                                {currentStep < totalSteps ? (
                                    <Button
                                        onClick={nextStep}
                                        className="ml-auto bg-secondary  text-white"
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="ml-auto bg-secondary  text-white py-6 px-8 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-gray-400 text-sm mt-6">
                    All fields marked with * are required
                </p>
            </div>
        </div>
    );
}
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Star,
    ShoppingCart,
    Eye,
    Check,
    Zap,
    Package,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { IProduct } from '@/interface';
import { getProductById } from '@/action/product';
import { Spinner } from '@/components/ui/spinner';
import { VerticalThumbnailCarousel } from '@/components/vertical-carousel';
import CategoryCarousel from '@/components/carousel-categories';

export default function ProjectDetail() {
    const [product, setProduct] = useState<IProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const productId = params?.id as string;

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;

            try {
                setLoading(true);
                const result = await getProductById(productId);
                console.log('Product Detail Result:', result);

                if (result.success && result.data) {
                    setProduct(result.data);
                } else {
                    console.error('Failed to fetch product');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef7ff] to-[#f5f0ff]">
                <Spinner className='w-10 h-10 text-primary' />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef7ff] to-[#f5f0ff]">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h3 className="text-2xl font-bold text-gray-600 mb-2">Product not found</h3>
                    <Link href="/projects">
                        <Button className="mt-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Prepare carousel images
    const carouselImages = [
        product.main_image?.image_url && { src: product.main_image.image_url, alt: product.name },
        ...(product.images?.map(img => ({ src: img.image_url, alt: product.name })) || [])
    ].filter(Boolean) as Array<{ src: string; alt: string }>;

    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(product.price || 0);

    const features = [
        { icon: Zap, text: "Instant Download" },
        { icon: Package, text: "Full Documentation" },
        { icon: Check, text: "Lifetime Updates" }
    ];

    return (
        <div className="min-h-screen mt-20">
            {/* Decorative Elements */}


            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
                {/* Back Button */}
                <Link href="/projects" className='flex mx-2 items-center'>

                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects

                </Link>

                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column - Carousel */}
                    <div className="lg:col-span-2">
                        {/* Header Info */}
                        <div className="mb-6">
                            {/* <Badge className="mb-4 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
                <span className="text-sm font-semibold text-[#50398e]">
                  {product.category?.name || 'Uncategorized'}
                </span>
              </Badge> */}


                        </div>

                        {/* Vertical Thumbnail Carousel */}
                        {carouselImages.length > 0 ? (
                            <VerticalThumbnailCarousel images={carouselImages} className="mb-8" />
                        ) : (
                            <Card className="overflow-hidden shadow-2xl border-0 bg-white mb-8">
                                <CardContent className="p-0">
                                    <div className="relative aspect-video bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1e] flex items-center justify-center">
                                        <Sparkles className="w-16 h-16 text-white/30" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* Right Column - Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="mt-6">

                            <Card className="bg-white border-2 border-[#dbc8fb] shadow-lg mb-6" >
                                <CardContent className="p-6 sm:p-8">
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#50398e] leading-tight">
                                        {product.name}
                                    </h1>
                                    {/* Rating & Price */}
                                    <div className="flex flex-wrap items-center gap-6 mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-600">(4.9/5)</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                                        {product.description || 'No description available for this product.'}
                                    </p>


                                    {/* Trust Badges */}
                                    <div className="py-4  border-b mb-5 border-gray-200 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>Secure payment</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>Instant delivery</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>30-day money-back guarantee</span>
                                        </div>
                                    </div>
                                    <Link href={`/service/detail/${product.categories_id}`}>
                                        <Button
                                            size="lg"
                                            className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
                                        >
                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                            Order Now
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>


                        </div>
                    </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 mb-6 mt-10">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="bg-gradient-to-br from-white to-[#fef7ff] border-2 border-[#dbc8fb] shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            <CardContent className="p-5 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <span className="font-semibold text-[#50398e]">
                                    {feature.text}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* What's Included */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-[#dbc8fb] shadow-lg">
                    <CardContent className="p-6 sm:p-8">
                        <h4 className="text-xl font-bold text-[#50398e] mb-4">What's Included:</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700">High-quality source files ready to use</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700">Complete documentation & setup guide</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700">Lifetime updates & improvements</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700">Priority support via Discord</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
                {/* Related Products Section */}
                <section className="mt-16 sm:mt-20">



                    <CategoryCarousel />

                </section>
            </div>
        </div>
    );
}
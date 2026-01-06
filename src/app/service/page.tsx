"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2, Star, Zap, Shield, Clock } from 'lucide-react';
import { getAllCategories } from '@/action/categories';
import type { ICategory } from '@/interface';

export default function NemunekoServices() {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await getAllCategories();

                if (result.success && Array.isArray(result.data)) {
                    setCategories(result.data);
                } else {
                    console.error('Failed to fetch categories:', result.message);
                    setCategories([]);
                    setError(result.message || 'Failed to load categories');
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                setCategories([]);
                setError('Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const benefits = [
        {
            icon: Zap,
            title: "Fast Delivery",
            description: "Project selesai tepat waktu dengan kualitas terbaik"
        },
        {
            icon: Shield,
            title: "Quality Guarantee",
            description: "2x revisi gratis untuk kepuasan maksimal"
        },
        {
            icon: Star,
            title: "Premium Assets",
            description: "Desain eksklusif dan high-quality animations"
        },
        {
            icon: Clock,
            title: "24/7 Support",
            description: "Tim kami siap membantu kapan saja"
        }
    ];

    const features = [
        "Custom design sesuai brand identity",
        "Optimized untuk OBS & Streamlabs",
        "Full HD & 4K ready",
        "Source files included",
        "Commercial license",
        "Free updates & support"
    ];

    return (
        <div className="min-h-screen ">
            {/* Hero Section */}
            <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
                <div className="container mx-auto text-center">
                    <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
                        <span className="text-sm font-semibold text-[#50398e]">✨ Premium Streaming Assets</span>
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight ">
                        Our <span className="text-primary relative">Services<div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-3 -z-5"></div></span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
                        Pilih kategori yang sesuai kebutuhan streaming Anda. Semua produk dirancang dengan detail dan kualitas premium.
                    </p>
                </div>
            </section>



            {/* Service Categories */}
            <section className="pb-12 sm:pb-16 px-4 sm:px-6">
                <div className="container mx-auto">

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-12 h-12 border-4 border-[#9B5DE0]/30 border-t-[#D78FEE] rounded-full animate-spin"></div>
                            <p className="text-gray-800 mt-4">Loading Service...</p>
                        </div>
                    ) : error ? (
                        <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                            <CardContent className="py-12 text-center">
                                <p className="text-red-400">{error}</p>
                            </CardContent>
                        </Card>
                    ) : categories.length === 0 ? (
                        <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                            <CardContent className="py-12 text-center">
                                <p className="text-gray-800">No categories available at the moment.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                            {categories.map((category) => (
                                <Card
                                    key={category.id}
                                    className={`bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer ${selectedCategory === category.id ? 'ring-2 ring-[#D78FEE]' : ''
                                        }`}
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl text-primary mb-2 flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-[#D78FEE]" />
                                                    {category.name}
                                                </CardTitle>
                                                {category.description && (
                                                    <CardDescription className="text-gray-700">
                                                        {category.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>

                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12 sm:pb-16 px-4 sm:px-6">
                <div className="container mx-auto">
                    <Card className="bg-muted/50 border-primary/30">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl text-primary mb-2">
                                What You Get
                            </CardTitle>
                            <CardDescription className="text-gray-700">
                                Setiap pembelian mencakup fitur-fitur premium berikut
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">

                                {benefits.map((benefit, i) => (
                                    <Card key={i} className="background backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105">
                                        <CardContent className="pt-6 text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <benefit.icon className="w-8 h-8 text-[#D78FEE]" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-primary mb-2">{benefit.title}</h3>
                                            <p className="text-sm text-gray-400">{benefit.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}

                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}

        </div>
    );
}
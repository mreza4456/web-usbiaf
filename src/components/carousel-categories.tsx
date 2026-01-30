"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost, ICategory, IImageCategories } from '@/interface';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { SkeletonBlog } from './skeleton-card';
import { getAllCategories } from '@/action/categories';
interface ICategoryWithImages extends ICategory {
    images?: IImageCategories[]
}
export default function CategoryCarousel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [blogPosts, setBlogPosts] = useState<IBlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
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

    return (
        <div>
            <div className="relative z-10">
                {/* Hero Section */}



                {/* Blog Posts Grid */}
                <section className="pb-20 px-4 sm:px-6">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#50398e] relative inline-block">
                                You May Also Like
                                <span className="absolute -top-6 -right-8 text-4xl">✦</span>
                            </h2>
                            <Link href="/projects">
                                <Button variant="outline" className="border-2 border-[#50398e] text-[#50398e] hover:bg-muted/30">
                                    View All
                                </Button>
                            </Link>
                        </div>

                        {loading ? (
                            <SkeletonBlog cardcount={3} />
                        ) : categories.length === 0 ? (
                            <div></div>
                        ) : (
                            <Carousel>
                                <CarouselContent>
                                    {categories.map((category) => {
                                        // Ambil gambar pertama saja
                                        const primaryImage = category.images?.[0]?.image_url || "";
                                        const imageCount = category.images?.length || 0
                                        return (
                                            <CarouselItem key={category.id} className="md:basis-1/2 lg:basis-1/3">
                                                <div >

                                                    <Card

                                                        className="bg-white border-primary/30 p-0 shadow-lg  hover:border-primary transition-all duration-300  overflow-hidden group"
                                                    >
                                                        <CardHeader className=" p-0">
                                                            <div className="relative h-60 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 overflow-hidden">
                                                                {primaryImage ? (
                                                                    <>
                                                                        <img
                                                                            className='w-full h-full object-cover hover:scale-105 transition-all duration-300'
                                                                            src={primaryImage}
                                                                            alt={category.name}
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = "/placeholder-image.svg"
                                                                            }}
                                                                        />


                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                        <ImageIcon className="w-16 h-16 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardHeader>

                                                        <CardContent className="p-3 h-full">
                                                            <CardTitle className="text-xl text-primary mb-3 line-clamp-2 group-hover:text-primary/80 transition-colors">
                                                                {category.name}
                                                            </CardTitle>
                                                            <CardDescription className="text-gray-800 text-sm line-clamp-3 mb-4">
                                                                {category.description || 'No description available'}
                                                            </CardDescription>


                                                        </CardContent>

                                                        <CardFooter className="p-3 pt-0 flex justify-end items-center">
                                                            <Link href={`/service/detail/${category.id}`}>
                                                                <Button

                                                                    size="lg"
                                                                    className="text-white cursor-pointer"
                                                                >
                                                                    View
                                                                    <ArrowRight className="w-4 h-4 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        </CardFooter>
                                                    </Card>

                                                </div>
                                            </CarouselItem>
                                        );
                                    })}

                                </CarouselContent>

                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        )}
                    </div>
                </section>

                {/* Newsletter CTA */}

            </div>
        </div>
    );
}
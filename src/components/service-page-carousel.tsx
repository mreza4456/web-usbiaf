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

export default function CategoryPageCarousel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [blogPosts, setBlogPosts] = useState<IBlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ICategoryWithImages | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await getAllCategories();

                if (result.success && Array.isArray(result.data)) {
                    setCategories(result.data);
                    // Set first category as default selected
                    if (result.data.length > 0) {
                        setSelectedCategory(result.data[0]);
                    }
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

    const handleCategoryClick = (category: ICategoryWithImages) => {
        setSelectedCategory(category);
    };

    return (
        <div className="pb-30">
            <div className="relative z-10">
                {/* Top Carousel - Categories */}
                <section className="pb-8 px-4 sm:px-6">
                    <div className="container mx-auto">
                        {loading ? (
                            <SkeletonBlog cardcount={6} />
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No categories available</div>
                        ) : (
                            <div className="flex gap-4 items-center">
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full max-w-[calc(100%-200px)]"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {categories.map((category) => {
                                            const isSelected = selectedCategory?.id === category.id;
                                            return (
                                                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-auto">
                                                    <button
                                                        onClick={() => handleCategoryClick(category)}
                                                        className={`flex items-center gap-2 px-4 py-2 h-16 rounded-full whitespace-nowrap ${
                                                            isSelected ? 'bg-gray-200' : ''
                                                        } transition-all duration-300 hover:bg-gray-100`}
                                                    >
                                                        <div
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300 ${
                                                                isSelected
                                                                    ? 'bg-primary shadow-lg'
                                                                    : 'bg-primary hover:bg-primary/80'
                                                            }`}
                                                        >
                                                            {/* Icon placeholder */}
                                                        </div>
                                                        <span className="text-sm font-medium arial">
                                                            {category.name}
                                                        </span>
                                                    </button>
                                                </CarouselItem>
                                            );
                                        })}
                                    </CarouselContent>
                                    {/* <CarouselPrevious className="left-0" />
                                    <CarouselNext className="right-0" /> */}
                                </Carousel>

                                <button className="rounded-full text-font-arial flex justify-center items-center gap-2 bg-primary h-14 px-6 text-white whitespace-nowrap flex-shrink-0 hover:bg-primary/90 transition-colors">
                                    Browse Commissions
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Bottom Carousel - Images with 3 visible, edges cropped */}
                <section className=" px-4 sm:px-6">
                    <div className="container mx-auto">
                        {loading ? (
                            <SkeletonBlog cardcount={3} />
                        ) : !selectedCategory ? (
                            <div className="text-center py-12 text-gray-500">Select a category to view images</div>
                        ) : selectedCategory.images && selectedCategory.images.length > 0 ? (
                            <Carousel
                                opts={{
                                    align: "center",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="w-[150%] -ml-[25%]">
                                    {selectedCategory.images.map((image, index) => (
                                        <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                            <div className="aspect-video rounded-3xl overflow-hidden bg-primary transition-all duration-300 ">
                                                <img
                                                    className="w-full h-full object-cover"
                                                    src={image.image_url}
                                                    alt={`${selectedCategory.name} - ${index + 1}`}
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/placeholder-image.svg"
                                                    }}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4" />
                                <CarouselNext className="right-4" />
                            </Carousel>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                No images available for this category 
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

// Dummy images for bottom carousel
const DUMMY_IMAGES = [
    {
        image_url: "https://picsum.photos/seed/art1/800/450",
        alt: "Commission artwork 1",
    },
    {
        image_url: "https://picsum.photos/seed/art2/800/450",
        alt: "Commission artwork 2",
    },
    {
        image_url: "https://picsum.photos/seed/art3/800/450",
        alt: "Commission artwork 3",
    },
    {
        image_url: "https://picsum.photos/seed/art4/800/450",
        alt: "Commission artwork 4",
    },
    {
        image_url: "https://picsum.photos/seed/art5/800/450",
        alt: "Commission artwork 5",
    },
    {
        image_url: "https://picsum.photos/seed/art6/800/450",
        alt: "Commission artwork 6",
    },
];

export default function CategoryPageCarousel() {
    const router = useRouter();
    const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
    const [blog, setBlog] = useState<IBlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     const fetchBlog = async () => {
            try {
                const result = await getAllBlogPosts();

                if (result.success && Array.isArray(result.data)) {
                    setBlog(result.data);
                } else {
                    console.error('Failed to fetch Blog:', result.message);
                    setBlog([]);
                    setError(result.message || 'Failed to load Blog');
                }
            } catch (error) {
                console.error('Failed to fetch Blog:', error);
                setBlog([]);
                setError('Failed to load Blog');
            } finally {
                setLoading(false);
            }
        };
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
    useEffect(() => {
          fetchBlog();
        fetchCategories();
    }, []);
 

    const handleCategoryClick = (categoryId: string) => {
        router.push(`/service/detail/${categoryId}`);
    };

    return (
        <div className="pb-10 sm:px-6">
            <div className="relative z-10">
                {/* Top Carousel - Categories */}
                <section className="">
                    <div className="w-full">
                        {loading ? (
                            <SkeletonBlog cardcount={6} />
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No categories available</div>
                        ) : (
                            <div className="sm:flex gap-4 md:items-center">
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {categories.map((category) => (
                                            <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-auto">
                                                <button
                                                    onClick={() => handleCategoryClick(category.id)}
                                                    className="flex items-center gap-2 px-4 py-2 h-16 rounded-full whitespace-nowrap transition-all duration-300 hover:bg-gray-100"
                                                >
                                                    <div
                                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300 bg-primary hover:bg-primary/80"
                                                    >
                                                        {/* Icon placeholder */}
                                                    </div>
                                                    <span className="text-sm font-medium arial">
                                                        {category.name}
                                                    </span>
                                                </button>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                                <Link href={"/service"} className='lg:block hidden'>
                                    <button className="rounded-full text-font-arial flex justify-center items-center gap-2 bg-primary h-14 px-6 text-white whitespace-nowrap flex-shrink-0 hover:bg-primary/90 transition-colors">
                                        Browse Commissions
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Bottom Carousel - Dummy Images (static, not dependent on selected category) */}
                <section className="py-10">
                    <div className="mb-10">
                        <Carousel
                            opts={{
                                align: "center",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="md:w-[150%] md:-ml-[25%]">
                                {blog.map((blog) => (
                                    <CarouselItem key={blog.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                        <div className="aspect-video rounded-3xl overflow-hidden bg-primary transition-all duration-300">
                                            <img
                                                className="w-full h-full object-cover"
                                                src={blog.image}
                                                alt={blog.title}
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
                    </div>
                    <Link href={"/service"} className='lg:hidden float-end px-6'>
                        <button className="rounded-full text-font-arial flex justify-center items-center gap-2 bg-primary h-14 px-6 text-white whitespace-nowrap flex-shrink-0 hover:bg-primary/90 transition-colors">
                            Browse Commissions
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </section>
            </div>
        </div>
    );
}
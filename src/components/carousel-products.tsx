"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost, ICategory, IImageCategories, IProduct } from '@/interface';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { SkeletonBlog } from './skeleton-card';
import { getAllCategories } from '@/action/categories';
import { getAllProducts } from '@/action/product';
interface ICategoryWithImages extends ICategory {
    images?: IImageCategories[]
}
export default function ProductsCarousel() {
 
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);
 const [products, setProducts] = useState<IProduct[]>([]);
 const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch products
                const productsResult = await getAllProducts();
                console.log('Products Result:', productsResult); // Debug log
                if (productsResult.success) {
                    setProducts(productsResult.data as any);
                }

               
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    return (
        <div>
            <div className="relative z-10">
                {/* Hero Section */}



                {/* Blog Posts Grid */}
                <section className="pb-20 sm:px-6">
                    <div className="container mx-auto">
                        
                        {loading ? (
                            <SkeletonBlog cardcount={3} />
                        ) : products.length === 0 ? (
                            <div></div>
                        ) : (
                            <Carousel>
                                <CarouselContent>.
                                    {products.map((product) => {
                                        // Ambil gambar pertama saja
                                        const primaryImage = product.images?.[0]?.image_url || "";
                                        const imageCount = product.images?.length || 0
                                        return (
                                            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                                                <div >

                                                    <div

                                                        className="border-primary/30 p-0   hover:border-primary transition-all duration-300  overflow-hidden group"
                                                    >
                                                        
                                                            <div className="relative aspect-square rounded-[50px] overflow-hidden">
                                                                {primaryImage ? (
                                                                    <>
                                                                        <img
                                                                            className='w-full h-full object-cover  transition-all duration-300'
                                                                            src={primaryImage}
                                                                            alt={product.name}
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
                                                                <div className="absolute top-0 right-10 h-18 rounded-b-full w-12 bg-primary/80 flex flex-col justify-end items-center">
                                                                    <div className="clip-stars h-6 w-6 bg-white mb-5"></div>
                                                                </div>
                                                            </div>
                                                       

                                                        <div className="p-3 h-full px-5">
                                                            <h3 className="text-xl text-borsok text-dark line-clamp-2 group-hover:text-primary/80 transition-colors">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-gray-400 text-arial text-sm line-clamp-3 ">
                                                                {product.description || 'No description available'}
                                                            </p>
                                                            <p className="text-borsok text-xl line-clamp-3 text-dark">
                                                                USD  {product.price ? formatCurrency(product.price) : 'No price available'}
                                                            </p>


                                                        </div>

                                                     
                                                    </div>

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
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
import { TextstyleEliane, TextstyleElianeGreen } from './font-design';
import { useRouter } from 'next/navigation';
interface ICategoryWithImages extends ICategory {
    images?: IImageCategories[]
}
export default function ProductsCarousel() {

    const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const router = useRouter();
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

      const handleClick = (productId:string) => {
    router.push(`/projects/${productId}`)
  };
    // Tambahkan ini SEBELUM return statement
const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
);
    return (
        <div>
            <div className="relative z-10">
                {/* Hero Section */}



                {/* Blog Posts Grid */}
                <section className="pb-20 sm:px-6">
                    <div className="container mx-auto">
                        <div className="md:flex  mb-12 md:justify-between items-center">

                            <div className="text-left flex flex-col">
                                <div className="inline-block ">
                                    <TextstyleEliane Title="READY TO USE" className='text-4xl sm:text-5xl w-full mb-4' color='text-purple' />

                                    <div className="flex gap-5">
                                        <TextstyleEliane Title="AND" className='text-4xl sm:text-5xl w-full' color='text-purple' />
                                        <TextstyleElianeGreen Title="ADOBTABLE" className='text-4xl sm:text-5xl w-full' color='text-green' />
                                    </div>
                                </div>
                            </div>
                            <div className=" md:w-[50%] w-full mt-5 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search For Items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-12 py-2 bg-white/5  border border-[#6F52B2] border-2 rounded-full text-primary placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonBlog cardcount={3} />
                        ) : filteredProducts.length === 0 ? (
                            <div className='flex justify-center itenms-center text-gray-300'>Not Found</div>
                        ) : (
                            <Carousel>
                                <CarouselContent>
                                    {filteredProducts.map((product) => {
                                        // Ambil gambar pertama saja
                                        const primaryImage = product.images?.[0]?.image_url || "";
                                        const imageCount = product.images?.length || 0
                                        return (
                                            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4" onClick={()=>handleClick(product.id)}>
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
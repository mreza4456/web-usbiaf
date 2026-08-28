"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost, IComment } from '@/interface';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { SkeletonBlog, SkeletonCard } from './skeleton-card';
import { getAllComments } from '@/action/comment';
import Image from 'next/image';
import { BadgeCard, CardReview, CardSecondary } from './card-dashed';

export default function CommmentsCarousel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [comment, setComment] = useState<IComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch blog posts
                const postsResult = await getAllComments();
                console.log('Blog Posts Result:', postsResult);
                if (postsResult.success) {
                    setComment(postsResult.data);
                }
            } catch (error) {
                console.error('Error fetching blog data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <section id="testimonials" className=" relative overflow-hidden">
         

                <div className="container mx-auto max-w-7xl">

                    {loading ? (
                        <SkeletonCard cardcount={3} />
                    ) : comment.length === 0 ? (
                        <div></div>
                    ) : (
                        <Carousel className="">
                            <CarouselContent className="-ml-4">
                                {comment.map((testimonial, i) => (
                                    <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3 p-10">
                                        <CardReview className="transition-all">
                                            {testimonial.order_items?.category_name && (
                                                <BadgeCard className=" w-fit absolute left-4 -top-3 -rotate-2 z-101 ">

                                                    {testimonial.order_items.category_name}
                                                </BadgeCard>
                                            )}
                                            <div className="p-3 text-lilita z-10 relative ">
                                                <div className=" items-center mb-3 ">


                                                    <div className="flex items-center gap-1 px-3  ">
                                                        {[...Array(Number(testimonial.rating))].map((_, j) => (
                                                            // <Star key={j} className="w-4 h-4 fill-[#FFE66D] text-[#FFE66D]" />
                                                            <Image key={j} src={"/images/SVG/stars.svg"} width={25} height={25} alt='' />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-gray-500 px-3   text-base italic leading-relaxed">
                                                    "{testimonial.message}"
                                                </div>


                                                <div className="flex items-center gap-2  mt-5">
                                                    <Image
                                                        src={testimonial.users?.avatar_url ?? "/default-avatar.png"}
                                                        width={50}
                                                        height={50}
                                                        alt={testimonial.users?.full_name ?? "User avatar"}
                                                        className="w-10 h-10 rounded-full border-2 border-white"
                                                    />
                                                    <div>
                                                        <div className="text-primary text-lilita">{testimonial.users?.full_name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardReview>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            <CarouselPrevious className="-left-20" />
                            <CarouselNext className="-right-20" />
                        </Carousel>
                    )}
                    <div className="text-center mt-8">

                       
                    </div>
                </div>
            </section>
        </div>
    );
}
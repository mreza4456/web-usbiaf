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
import { SkeletonBlog } from './skeleton-card';
import { getAllComments } from '@/action/comment';

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
            <section id="testimonials" className="py-30 px-6 relative overflow-hidden">
                <div className="absolute top-10 left-20 text-5xl text-primary opacity-10 rotate-12">★</div>
                <div className="absolute bottom-20 right-40 text-6xl text-primary opacity-10">✦</div>

                <div className="container mx-auto max-w-7xl">
                    <div className="text-left mb-12">
                        <div className="inline-block mb-4">
                            <span className="text-sm font-semibold text-primary bg-muted px-4 py-2 rounded-full">
                                Testimonials
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                            What Streamers Say
                        </h2>
                        <p className="text-gray-500 text-lg">Trusted by thousands of content creators</p>
                    </div>
                    {loading ? (
                        <SkeletonBlog cardcount={3} />
                    ) : comment.length === 0 ? (
                        <div></div>
                    ) : (
                        <Carousel className="">
                            <CarouselContent className="-ml-4">
                                {comment.map((testimonial, i) => (
                                    <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/4">
                                        <Card className="bg-muted/50 backdrop-blur-sm border-2 border-primary/20 transition-all rounded-3xl h-full">
                                            <CardHeader>
                                                <div className="flex justify-between items-center mb-3">
                                                    {testimonial.order_items?.category_name && (
                                                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                            <MessageSquare className="w-3 h-3 mr-1" />
                                                            {testimonial.order_items.category_name}
                                                        </Badge>
                                                    )}

                                                    <div className="flex items-center gap-1 ">
                                                        {[...Array(Number(testimonial.rating))].map((_, j) => (
                                                            <Star key={j} className="w-4 h-4 fill-[#FFE66D] text-[#FFE66D]" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <CardDescription className="text-gray-500 text-base italic leading-relaxed">
                                                    "{testimonial.message}"
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-3">
                                                    <img src={testimonial.users?.avatar_url} alt={testimonial.users?.full_name} className="w-12 h-12 rounded-full border-2 border-white" />
                                                    <div>
                                                        <div className="font-semibold text-primary">{testimonial.users?.full_name}</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            <CarouselPrevious className="-left-20" />
                            <CarouselNext className="-right-20" />
                        </Carousel>
                    )}
                    <div className="text-center mt-8">

                    <Link href="reviews">
                        <Button className="bg-white cursor-pointer hover:bg-gray-50 text-[#50398e] px-10 py-6 rounded-full shadow-md border-2 border-[#50398e]">
                            Show All Reviews
                        </Button>
                    </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
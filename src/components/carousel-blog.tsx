"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost } from '@/interface';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { SkeletonBlog } from './skeleton-card';

export default function BlogCarousel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [blogPosts, setBlogPosts] = useState<IBlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch blog posts
                const postsResult = await getAllBlogPosts();
                console.log('Blog Posts Result:', postsResult);
                if (postsResult.success) {
                    setBlogPosts(postsResult.data);
                }
            } catch (error) {
                console.error('Error fetching blog data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.description && post.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };



    return (
        <div>
            <div className="relative z-10">
                {/* Hero Section */}



                {/* Blog Posts Grid */}
                <section className="pb-20 px-4 sm:px-6">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl md:text-5xl font-bold text-[#50398e] relative inline-block">
                                Latest Articles
                                <span className="absolute -top-6 -right-8 text-4xl">✦</span>
                            </h3>

                        </div>

                        {loading ? (
                            <SkeletonBlog cardcount={3}/>
                        ):filteredPosts.length === 0 ? (
                            <div></div>
                        ) : (
                            <Carousel>
                                <CarouselContent>
                                    {filteredPosts.map((post) => {
                                        const formattedDate = formatDate(post.created_at);
                                        return (
                                            <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
                                                <div >

                                                    <Card

                                                        className="bg-white border-primary/30 p-0  hover:border-primary transition-all duration-300  overflow-hidden group"
                                                    >
                                                        <CardHeader className=" p-0">
                                                            <div className="relative h-60 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 overflow-hidden">
                                                                {post.image ? (
                                                                    <img
                                                                        src={post.image}
                                                                        alt={post.title}
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                        onError={(e) => {
                                                                            console.error('Image failed to load:', post.image);
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-6xl">
                                                                        📝
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardHeader>

                                                        <CardContent className="p-5 h-full">
                                                            <CardTitle className="text-xl text-primary mb-3 line-clamp-2 group-hover:text-primary/80 transition-colors">
                                                                {post.title}
                                                            </CardTitle>
                                                            <CardDescription className="text-gray-800 text-sm line-clamp-3 mb-4">
                                                                {post.description || 'No description available'}
                                                            </CardDescription>

                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{formattedDate}</span>
                                                            </div>
                                                        </CardContent>

                                                        <CardFooter className="p-5 pt-0 flex justify-end items-center">
                                                            <Link href={`/blog/${post.id}`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-primary hover:text-primary/80"
                                                                >
                                                                    Read More
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
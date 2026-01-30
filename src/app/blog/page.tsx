"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost } from '@/interface';
import { SkeletonBlog } from '@/components/skeleton-card';

export default function BlogPage() {
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
                <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
                    <div className="container mx-auto text-center">
                        <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
                            <span className="text-sm font-semibold text-[#50398e]">
                                📝 {blogPosts.length}+ Articles
                            </span>
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight">
                            Our <span className="text-primary relative">
                                Blog
                                <div className="absolute -bottom-2 left-0 w-full h-3 opacity-50 -rotate-2 -z-5">
                                    <img src="curve.png" alt="" />
                                </div>
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-black mb-8 max-w-3xl mx-auto">
                            Insights, tutorials, and tips for creating amazing stream content
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-white/5 border border-secondary border-2 rounded-xl text-primary placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="pb-20 px-4 sm:px-6">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl md:text-5xl font-bold text-[#50398e] relative inline-block">
                                Latest Articles
                                <span className="absolute -top-6 -right-8 text-4xl">✦</span>
                            </h3>
                            <span className="text-gray-400 text-sm sm:text-base">
                                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
                            </span>
                        </div>

                        {loading ? (
                          <SkeletonBlog/>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📚</div>
                                <h3 className="text-2xl font-bold text-gray-400 mb-2">No posts found</h3>
                                <p className="text-gray-500">Try adjusting your search</p>
                            </div>
                        ) : (

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPosts.map((post) => {
                                    const formattedDate = formatDate(post.created_at);

                                    return (
                                        <Card
                                            key={post.id}
                                            className="bg-white pt-0  border-primary/30 shadow-lg hover:border-primary transition-all duration-300 hover:transform  overflow-hidden group"
                                        >
                                         
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
                                          

                                            <CardContent className="p-5">
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
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Newsletter CTA */}
                <section className="pb-20 px-4 sm:px-6">
                    <div className="container mx-auto">
                        <Card className="bg-muted/50 border-primary/30">
                            <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                                    Stay Updated with <span className="text-primary">Our Latest Posts</span>
                                </h2>
                                <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                                    Subscribe to our newsletter and get the latest articles delivered to your inbox
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-4 py-3 rounded-lg border-2 border-primary/30 focus:outline-none focus:border-primary"
                                    />
                                    <Button size="lg" className="bg-primary text-white">
                                        Subscribe
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}
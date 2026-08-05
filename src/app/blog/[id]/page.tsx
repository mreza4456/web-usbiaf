"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getBlogPostById } from '@/action/blog';
import { IBlogPost } from '@/interface';
import { toast } from 'sonner';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params?.id as string;
  
  const [blogPost, setBlogPost] = useState<IBlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!blogId) return;
      
      try {
        setLoading(true);
        const result = await getBlogPostById(blogId);
        
        if (result.success && result.data) {
          setBlogPost(result.data);
        } else {
          toast.error('Blog post not found');
          router.push('/blog');
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        toast.error('Failed to load blog post');
        router.push('/blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [blogId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blogPost?.title,
        text: blogPost?.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-black">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="relative z-10">
        {/* Header */}
        <section className="pt-16 sm:pt-24 pb-8 px-4 sm:px-6">
          <div className="container mx-auto max-w-7xl">
            <Link href="/blog">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            {/* Featured Image */}
            {blogPost.image && (
              <div className="relative h-64 sm:h-96 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 rounded-2xl overflow-hidden mb-8">
                <img
                  src={blogPost.image}
                  alt={blogPost.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title & Meta */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4">
                {blogPost.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(blogPost.created_at)}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-white border-primary/30">
              <CardContent className="p-8 sm:p-12">
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {blogPost.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="mt-8 flex justify-center">
              <Link href="/blog">
                <Button size="lg" className="bg-primary text-white">
                  View All Articles
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related CTA */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-muted/50 border-primary/30">
              <CardContent className="text-center py-12 px-6">
                <h2 className="text-2xl sm:text-3xl text-primary font-bold mb-4">
                  Want More Content Like This?
                </h2>
                <p className="text-gray-800 mb-6">
                  Subscribe to our newsletter for the latest updates
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
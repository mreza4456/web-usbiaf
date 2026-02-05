"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MessageSquare,
  Filter,
  X,
  ChevronDown,
  Search,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { getAllComments } from '@/action/comment';
import { getAllCategories } from '@/action/categories';
import { IComment, ICategory } from '@/interface';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewPage() {
  const [allComments, setAllComments] = useState<IComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<IComment[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all comments
        const commentsResult = await getAllComments();
        if (commentsResult.success && Array.isArray(commentsResult.data)) {
          setAllComments(commentsResult.data);
          setFilteredComments(commentsResult.data);
        }

        // Fetch all categories
        const categoriesResult = await getAllCategories();
        if (categoriesResult.success && Array.isArray(categoriesResult.data)) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allComments];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        comment => comment.order_items?.categories_id === selectedCategory
      );
    }

    // Filter by rating
    if (selectedRating !== 'all') {
      filtered = filtered.filter(
        comment => comment.rating === selectedRating
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(comment =>
        comment.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.order_items?.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredComments(filtered);
  }, [selectedCategory, selectedRating, searchQuery, allComments]);

  const calculateStats = (): { avgRating: number; totalReviews: number; distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } } => {
    if (allComments.length === 0) return { avgRating: 0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const total = allComments.reduce((sum, comment) => sum + parseInt(comment.rating), 0);
    const avgRating = (total / allComments.length).toFixed(1);

    const distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allComments.forEach(comment => {
      const rating = parseInt(comment.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    return {
      avgRating: parseFloat(avgRating),
      totalReviews: allComments.length,
      distribution
    };
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedRating('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedRating !== 'all' || searchQuery.trim() !== '';

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64 mb-4" />
          <Skeleton className="h-64 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center gap-3">
            <MessageSquare className="w-10 h-10" />
            Customer Reviews
          </h1>
          <p className="text-gray-600 text-lg">See what our customers are saying about our services</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-purple-700 font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" />
                Average Rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">{stats.avgRating}</div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(stats.avgRating)
                          ? 'fill-[#FFE66D] text-[#FFE66D]'
                          : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-purple-700">Out of 5 stars</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Reviews Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-700 font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-blue-700">{stats.totalReviews}</div>
              <p className="text-sm text-blue-600 mt-2">Happy customers</p>
            </CardContent>
          </Card>

          {/* Top Rated Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-700 font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                5-Star Reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-green-700">{stats.distribution[5] || 0}</div>
              <p className="text-sm text-green-600 mt-2">
                {stats.totalReviews > 0 
                  ? `${((stats.distribution[5] / stats.totalReviews) * 100).toFixed(0)}%`
                  : '0%'
                } of all reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Rating Distribution</CardTitle>
            <CardDescription>Breakdown of customer ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    <span className="font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-[#FFE66D] text-[#FFE66D]" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.totalReviews > 0
                          ? (stats.distribution[rating as keyof typeof stats.distribution] / stats.totalReviews) * 100
                          : 0
                          }%`
                      }}
                    />
                  </div>
                  <span className="font-semibold text-gray-700 w-16 text-right">
                    {stats.distribution[rating as keyof typeof stats.distribution] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters Section */}
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Filter Reviews</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Rating Filter */}
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-primary">{filteredComments.length}</span> of{' '}
            <span className="font-semibold">{allComments.length}</span> reviews
          </p>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-2">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedCategory('all')}
                  />
                </Badge>
              )}
              {selectedRating !== 'all' && (
                <Badge variant="secondary" className="gap-2">
                  {selectedRating} Stars
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedRating('all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Reviews List */}
        {filteredComments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Found</h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more reviews'
                  : 'Be the first to leave a review!'}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-lg transition-shadow bg-white">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <img
                        src={comment.users?.avatar_url || '/default-avatar.png'}
                        alt={comment.users?.full_name || 'User'}
                        className="w-14 h-14 rounded-full border-2 border-purple-200 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.png';
                        }}
                      />

                      {/* User Info & Review */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-primary mb-1">
                          {comment.users?.full_name || 'Anonymous'}
                        </div>

                        {/* Rating & Date */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < parseInt(comment.rating)
                                  ? 'fill-[#FFE66D] text-[#FFE66D]'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Review Message */}
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {comment.message}
                        </p>

                        {/* Category & Package Badges */}
                        <div className="flex flex-wrap gap-2">
                          {comment.order_items?.category_name && (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {comment.order_items.category_name}
                            </Badge>
                          )}
                          {/* {comment.order_items?.package_name && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              {comment.order_items.package_name}
                            </Badge>
                          )} */}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button (if needed in future) */}
        {filteredComments.length > 0 && filteredComments.length < allComments.length && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="gap-2">
              Load More Reviews
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
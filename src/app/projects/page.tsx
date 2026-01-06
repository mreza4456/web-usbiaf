"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, X, ExternalLink, Eye, Heart, Play, Loader2 } from 'lucide-react';
import Footer from '@/components/footer';
import { getAllProducts } from '@/action/product';
import { getAllCategories } from '@/action/categories';
import { IProduct, ICategory } from '@/interface';
import Link from 'next/link';

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products
        const productsResult = await getAllProducts();
        console.log('Products Result:', productsResult); // Debug log
        if (productsResult.success) {
          setProducts(productsResult.data);
        }

        // Fetch all categories
        const categoriesResult = await getAllCategories();
        console.log('Categories Result:', categoriesResult); // Debug log
        if (categoriesResult.success) {
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

  const toggleLike = (productId: string) => {
    setLikedProjects(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProjects = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryOptions = [
    { id: 'all', name: 'All Projects' },
    ...categories
  ];

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-black">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div >
      {/* Animated Background */}

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto text-center">
            
            <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
              <span className="text-sm font-semibold text-[#50398e]">✨ {products.length}+ Premium Projects</span>
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight ">
              Our <span className="text-primary relative">Projects <div className="absolute -bottom-2 left-0 w-full h-3  opacity-50 -rotate-2 -z-5"><img src="curve.png" alt="" /></div> </span>
            </h1>
            <p className="text-lg sm:text-xl text-black mb-8 max-w-3xl mx-auto">
              Explore koleksi lengkap stream widgets, overlays, dan animasi premium kami
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, tags, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white/5  border border-secondary border-2 rounded-xl text-primary placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-all"
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
        </section>

        {/* Category Filter */}
        <section className="pb-8 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-3xl md:text-5xl font-bold mb-4 text-[#50398e] relative inline-block">
              Browse Projects
              <span className="absolute -top-6 -right-8 text-4xl">✦</span>
            </h3>
              <span className="text-gray-400 text-sm sm:text-base">
                {filteredProjects.length} projects found
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {categoryOptions.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={
                    selectedCategory === category.id
                      ? "bg-muted hover:bg-muted/90 text-primary rounded-full shadow-lg"
                      : "bg-muted/5 hover:bg-muted/30 text-[#50398e]  rounded-full shadow-lg border-2 border-[#50398e]"
                  }
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* All Projects Grid */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No projects found</h3>
                <p className="text-gray-500">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => {
                  // Get the first image (main image)
                  const mainImage = project.main_image?.image_url ||
                    (project.images && project.images.length > 0 ? project.images[0].image_url : null);

                  console.log('Project:', project.name, 'Main Image:', mainImage); // Debug log

                  const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(project.price || 0);

                  return (
                    <Card key={project.id} className="bg-white  border-primary/30 shadow-lg hover:border-primary transition-all duration-300 hover:transform hover:scale-105 group overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="relative aspect-video bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 rounded-lg flex items-center justify-center overflow-hidden">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={project.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', mainImage);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-6xl">🎨</div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                            <Button size="sm" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-lg text-primary mt-5 line-clamp-1">{project.name}</CardTitle>
                        <CardDescription className="text-gray-800 text-sm line-clamp-2">
                          {project.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.category && (
                            <Badge variant="outline" className="text-xs border-primary/30 bg-secondary text-white">
                              {project.category.name}
                            </Badge>
                          )}
                          {project.image_count !== undefined && project.image_count > 0 && (
                            <Badge variant="outline" className="text-xs border-primary/30 bg-secondary text-white">
                              {project.image_count} {project.image_count === 1 ? 'Image' : 'Images'}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between items-center">
                        {/* <span className="text-lg font-bold text-[#D78FEE]">{formattedPrice}</span> */}

                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <Card className="bg-muted/50 border-primary/30">
              <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                  Can't Find What You're <span className="text-primary">Looking For?</span>
                </h2>
                <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Hubungi kami untuk custom project sesuai kebutuhan stream Anda
                </p>
                <Link href="/order">
                <Button size="lg" className="bg-primary text-white">
                  Request Custom Project
                </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>


    </div>
  );
}
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
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    const handleClick = () => {
    router.push("/project/detail")
  };

  const filteredProjects = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categories_id === selectedCategory;
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
      <div className="min-h-screen flex items-center justify-center">

        <Spinner className='w-10 h-10 text-primary' />

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
              Our Recent <span className="text-primary relative">Projects <div className="absolute -bottom-2 left-0 w-full h-3  opacity-50 -rotate-2 -z-5"><img src="curve.png" alt="" /></div> </span>
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
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
                    <Card key={project.id} onClick={handleClick} className="bg-white p-0 m-0 border-0 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer transition-all duration-300 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Instagram-style header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b">
                          <img src="/avatarnemuneko.jpg" className='w-8 h-8 rounded-full' alt="" />
                          <span className="font-semibold text-sm">{project.name}</span>
                        </div>

                        {/* Main image with overlay text */}
                        <div className="relative aspect-square bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1e] flex items-center justify-center overflow-hidden">
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
                            /* Stylized overlay text */
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                              <div className="relative w-full h-full flex items-center justify-center">
                                {/* Diagonal lines background */}
                                <div className="absolute inset-0 opacity-10">
                                  {[...Array(8)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="absolute h-px bg-white transform -rotate-45"
                                      style={{
                                        width: '200%',
                                        top: `${i * 15}%`,
                                        left: '-50%'
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Instagram-style footer */}
                        <div className="px-4 py-4">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                                  {project.description || 'No description available'}
                          </h3>
                        </div>
                      </CardContent>
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
"use client";

import React, { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, X } from 'lucide-react';
import Footer from '@/components/footer';
import { getAllProducts } from '@/action/product';
import { getAllCategories } from '@/action/categories';
import { IProduct, ICategory } from '@/interface';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SkeletonProjects } from '@/components/skeleton-card';
import { Textstyle, TextstyleEliane, Textstylegreen } from '@/components/font-design';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

// ─── Animation Variants ────────────────────────────────────────────────────────

// ─── Main Component ────────────────────────────────────────────────────────────

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
        const productsResult = await getAllProducts();
        if (productsResult.success) setProducts(productsResult.data as any);

        const categoriesResult = await getAllCategories();
        if (categoriesResult.success) setCategories(categoriesResult.data);
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
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleClick = (productId: string) => {
    router.push(`/projects/${productId}`);
  };

  const filteredProjects = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categories_id === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryOptions = [{ id: 'all', name: 'All Projects' }, ...categories];

  return (
    <div>
      <div className="relative z-10">

        {/* ── Hero Section ── */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto text-center">

            {/* Badge */}
            <div>
              <div className="flex gap-5 justify-center w-full  mb-4 mt-15">
                <Textstyle Title="OUR" className="text-3xl sm:text-7xl w-full " color="text-purple" />
                <Textstyle Title="RECENTS" className="text-3xl sm:text-7xl w-full" color="text-yellow" />
                <Textstylegreen Title="WORKS" className="text-3xl sm:text-7xl w-full" color="text-green" />
              </div>
            </div>
            <div className="w-full max-w-3xl mx-auto">
              <p>
                Explore our collection and portofolio and browse for your reffrences
              </p>
            </div>
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative mt-10">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5 " />
              <input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white/5 text-arial border border-primary border-2 rounded-full text-primary placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-all"
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

        {/* ── Category Filter ── */}
        <section className="pb-8 px-4 sm:px-6">
          <div className="container max-w-7xl mx-auto ">
           
              <div className=" gap-4 md:items-center grid grid-cols-7">
                <Carousel
                  opts={{
                    align: 'start',
                    loop: false,
                  }}
                  className="w-full group relative w-full mx-auto col-span-6"
                >
                  <CarouselContent className="-ml-2 md:-ml-4 ">
                    {categoryOptions.map((category) => (
                      <CarouselItem
                        key={category.id}
                        className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                      >
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className={
                            selectedCategory === category.id
                              ? 'flex items-center gap-3 px-1 py-1 cursor-pointer rounded-full transition-all duration-300 bg-primary/8 w-full'
                              : 'flex items-center gap-3 px-1 py-1 cursor-pointer rounded-full transition-all duration-300 bg-gray-100 w-full'
                          }
                        >
                          <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300 bg-primary hover:bg-primary/80 overflow-hidden" />
                          <span className="text-sm font-medium arial text-start text-wrap line-clamp-2">
                            {category.name?.split(' ').slice(0, 4).join(' ')}
                          </span>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {/* <CarouselPrevious
            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          />
          <CarouselNext
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          /> */}
                </Carousel>

                <Link href={"/service"} className="lg:block hidden">
                  <button className="rounded-full text-font-arial flex justify-center items-center gap-2 bg-primary h-14 px-6 text-white whitespace-nowrap flex-shrink-0 hover:bg-primary/90 transition-colors">
                    Browse Commissions
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
           
          </div>
        </section>

        {/* ── Projects Grid ── */}
        <section className="pb-20 px-4 sm:px-6 bg-white">
          <div className="container mx-auto">
            {loading ? (
              <SkeletonProjects />
            ) : filteredProjects.length === 0 ? (
              <div
                
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No projects found</h3>
                <p className="text-gray-500">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProjects.map((project, index) => {
                  const mainImage =
                    project.main_image?.image_url ||
                    (project.images && project.images.length > 0 ? project.images[0].image_url : null);

                  const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(project.price || 0);

                  return (
                    <div
                      key={project.id}

                    >
                      <Card
                        onClick={() => handleClick(project.id)}
                        className="bg-white p-0 mt-5 border-0 shadow-lg hover:shadow-xl relative cursor-pointer rounded-[50px] transition-shadow duration-300 overflow-hidden"
                      >
                        <CardContent className="p-0">


                          {/* Image */}
                          <div className="relative aspect-square bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1e] flex items-center justify-center overflow-hidden">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={project.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center p-8">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <div className="absolute inset-0 opacity-10">
                                    {[...Array(8)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="absolute h-px bg-white transform -rotate-45"
                                        style={{ width: '200%', top: `${i * 15}%`, left: '-50%' }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="p-3 h-full px-10">
                            <h3 className="text-xl text-borsok text-dark line-clamp-2 group-hover:text-primary/80 transition-colors">
                              {project.name}
                            </h3>

                            <div className="prose prose-neutral text-gray-400 text-arial text-sm line-clamp-3" dangerouslySetInnerHTML={{ __html: project.description || 'No description available' }} />




                          </div>
                        </CardContent>
                        <div className="absolute top-0 right-10 h-18 rounded-b-full w-12 bg-primary/80 flex flex-col justify-end items-center">
                          <div className="clip-stars h-6 w-6 bg-white mb-5"></div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div>
              <Card className="bg-[#e6dcff] md:rounded-[100px] ">
                <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl text-borsok text-primary mb-4 sm:mb-6">
                    Can't Find What You're{' '}
                    <span className="text-primary">Looking For?</span>
                  </h2>
                  <p className="text-arial text-primary/50 sm:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                    Contact us to make custom project to fit with your request and personalized
                  </p>
                  <Link href="/order">
                    <div >
                      <Button size="sm" className="button-yellow text-xl p-5 ">
                        Request Custom Project
                      </Button>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}
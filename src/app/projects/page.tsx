"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
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

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.1 },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── AnimateWhenVisible ────────────────────────────────────────────────────────

function AnimateWhenVisible({
  children,
  variants = fadeUp,
  custom,
  className = '',
}: {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={variants}
      custom={custom}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────

function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="flex gap-5 justify-center w-full mb-4 mt-15">
                <Textstyle Title="OUR" className="text-4xl sm:text-7xl w-full " color="text-purple" />
                <Textstyle Title="RECENTS" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
                <Textstylegreen Title="WORKS" className="text-4xl sm:text-7xl w-full" color="text-green" />
              </div>
            </motion.div>
            <div className="w-full max-w-3xl mx-auto">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className="text-lg md:text-xl text-center arial"
              >
                Explore our collection and portofolio and browse for your reffrences
              </motion.p>
            </div>
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              className="max-w-2xl mx-auto relative mt-10"
            >
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
            </motion.div>
          </div>
        </section>

        {/* ── Category Filter ── */}
        <section className="pb-8 px-4 sm:px-6">
          <div className="container mx-auto">


            {/* Category Buttons with stagger */}
            <div className="flex justify-between gap-5 items-center">
              <StaggerContainer className="flex flex-wrap gap-3">
                {categoryOptions.map((category, i) => (
                  <motion.div key={category.id} variants={fadeUp} custom={i}>
                    <Button
                      onClick={() => setSelectedCategory(category.id)}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      className={
                        selectedCategory === category.id
                          ? 'bg-primary/8 arial hover:bg-bg-primary/8  text-primary rounded-full border-0 flex py-7 px-2 pr-4'
                          : 'bg-white border-0  arial rounded-full hover:bg-primary/8 cursor-pointer flex py-7 px-2 pr-4  flex'
                      }
                    >
                      <div className="w-10 h-10 bg-primary rounded-full"></div>
                      {category.name}
                    </Button>
                  </motion.div>
                ))}
              </StaggerContainer>
              <Link href={"/service"} className='lg:block hidden'>
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No projects found</h3>
                <p className="text-gray-500">Try adjusting your search or filter</p>
              </motion.div>
            ) : (
              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <motion.div
                      key={project.id}
                      variants={fadeUp}
                      custom={index % 8} // cap delay so later items don't wait too long
                      whileHover={{ scale: 1.04, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
                            <p className="text-gray-400 text-arial text-sm line-clamp-3 ">
                              {project.description || 'No description available'}
                            </p>



                          </div>
                        </CardContent>
                        <div className="absolute top-0 right-10 h-18 rounded-b-full w-12 bg-primary/80 flex flex-col justify-end items-center">
                          <div className="clip-stars h-6 w-6 bg-white mb-5"></div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </StaggerContainer>
            )}
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <AnimateWhenVisible variants={scaleIn}>
              <Card className="bg-[#e6dcff] rounded-[100px]">
                <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl text-borsok text-primary mb-4 sm:mb-6">
                    Can't Find What You're{' '}
                    <span className="text-primary">Looking For?</span>
                  </h2>
                  <p className="text-arial text-primary/50 sm:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                    Contact us to make custom project to fit with your request and personalized
                  </p>
                  <Link href="/order">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      <Button size="lg" className="button-yellow text-2xl px-10 py-5">
                        Request Custom Project
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </AnimateWhenVisible>
          </div>
        </section>

      </div>
    </div>
  );
}
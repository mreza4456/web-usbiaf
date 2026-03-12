"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Star, Clock, ImageIcon } from 'lucide-react';
import { getAllCategories } from '@/action/categories';
import type { ICategory, IImageCategories } from '@/interface';
import SkeletonService from '@/components/skeleton-card';
import Link from 'next/link';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
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

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
        visible: { transition: { staggerChildren: 0.12 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Interface ─────────────────────────────────────────────────────────────────

interface ICategoryWithImages extends ICategory {
  images?: IImageCategories[];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getAllCategories();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        } else {
          setCategories([]);
          setError(result.message || 'Failed to load categories');
        }
      } catch (error) {
        setCategories([]);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const benefits = [
    { icon: Zap, title: 'Fast Delivery', description: 'Project selesai tepat waktu dengan kualitas terbaik' },
    { icon: Shield, title: 'Quality Guarantee', description: '2x revisi gratis untuk kepuasan maksimal' },
    { icon: Star, title: 'Premium Assets', description: 'Desain eksklusif dan high-quality animations' },
    { icon: Clock, title: '24/7 Support', description: 'Tim kami siap membantu kapan saja' },
  ];

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/service/detail/${categoryId}`);
  };

  return (
    <div className="min-h-screen">
      
      {/* ── Hero Section ── */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex gap-5  w-full mb-4 mt-15">
              <Textstyle Title="FIND" className="text-4xl sm:text-7xl w-full " color="text-purple" />
              <Textstyle Title="OUR" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
              <Textstylegreen Title="SERVICES" className="text-4xl sm:text-7xl w-full" color="text-green" />
            </div>
          </motion.div>
          <div className=" max-w-3xl ">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="text-lg md:text-xl  arial"
            >
              Explore our collection and portofolio and browse for your reffrences
            </motion.p>
          </div>
        </div>

      </section>

      {/* ── Service Categories ── */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          {loading ? (
            <SkeletonService />
          ) : error ? (
            <AnimateWhenVisible variants={scaleIn}>
              <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                <CardContent className="py-12 text-center">
                  <p className="text-red-400">{error}</p>
                </CardContent>
              </Card>
            </AnimateWhenVisible>
          ) : categories.length === 0 ? (
            <AnimateWhenVisible variants={scaleIn}>
              <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-800">No categories available at the moment.</p>
                </CardContent>
              </Card>
            </AnimateWhenVisible>
          ) : (
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const primaryImage = category.images?.[0]?.image_url || '';

                return (
                  <motion.div key={category.id} variants={fadeUp} custom={index}>
                    <Card onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.id);
                    }} className="bg-white p-0 m-0 relative overflow-hidden shadow-lg cursor-pointer   rounded-[50px]">

                      {/* Image Section */}
                      <div className="relative h-70 overflow-hidden">
                        {primaryImage ? (
                          <motion.img
                            whileHover={{ scale: 1.06 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="w-full h-full object-cover"
                            src={primaryImage}
                            alt={category.name}
                            onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>


                      <div className="p-0 px-10">
                        <h3 onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryClick(category.id);
                        }} className="text-xl text-borsok text-dark line-clamp-2 group-hover:text-primary/80 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-400 text-arial text-sm line-clamp-3 ">
                          {category.description || 'No description available'}
                        </p>



                      </div>

                      <CardContent>

                      </CardContent>

                      <div className="absolute top-0 right-10 h-18 rounded-b-full w-12 bg-white/50 flex flex-col justify-end items-center">
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

      {/* ── Features / Benefits Section ── */}
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
  );
}
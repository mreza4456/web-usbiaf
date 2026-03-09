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
        <div className="container mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
              <span className="text-sm font-semibold text-[#50398e]">✨ Premium Streaming Assets</span>
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight"
          >
            Our{' '}
            <span className="text-primary relative">
              Services
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-3 -z-5" />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-800 mb-8 max-w-3xl mx-auto"
          >
            Pilih kategori yang sesuai kebutuhan streaming Anda. Semua produk dirancang dengan detail dan kualitas premium.
          </motion.p>

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
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {categories.map((category, index) => {
                const primaryImage = category.images?.[0]?.image_url || '';

                return (
                  <motion.div key={category.id} variants={fadeUp} custom={index}>
                    <Card className="bg-white grid grid-cols-1 lg:grid-cols-2 p-0 m-0 overflow-hidden shadow-lg border-primary/30 hover:border-primary/50 h-full">

                      {/* Image Section */}
                      <div className="relative h-full min-h-[250px] overflow-hidden">
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

                      {/* Content Section */}
                      <div className="py-7 flex flex-col justify-between">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-2xl text-primary mb-2 flex items-center gap-2">
                                {category.name}
                              </CardTitle>
                              {category.description && (
                                <CardDescription className="text-gray-700">
                                  {category.description}
                                </CardDescription>
                              )}
                              {category.start_price && (
                                <p className="text-secondary mt-5">
                                  Start From {category.start_price}$
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              className="w-full bg-primary rounded-full cursor-pointer hover:from-[#8049c7] hover:to-[#c576e0] text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(category.id);
                              }}
                            >
                              View
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </motion.div>
                        </CardContent>
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
      <section className="py-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <AnimateWhenVisible variants={scaleIn}>
            <Card className="bg-muted/50 border-primary/30">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-primary mb-2">What You Get</CardTitle>
                <CardDescription className="text-gray-700">
                  Setiap pembelian mencakup fitur-fitur premium berikut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                  {benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      custom={i}
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Card className="background backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-colors duration-300 h-full">
                        <CardContent className="pt-6 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <benefit.icon className="w-8 h-8 text-[#D78FEE]" />
                          </div>
                          <h3 className="text-lg font-semibold text-primary mb-2">{benefit.title}</h3>
                          <p className="text-sm text-gray-400">{benefit.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </AnimateWhenVisible>
        </div>
      </section>

    </div>
  );
}
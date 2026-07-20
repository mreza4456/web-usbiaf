"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useInView, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, Star, Clock, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllCategories } from '@/action/categories';
import { getAllPosters } from '@/action/poster'; // sesuaikan import path
import type { ICategory, IImageCategories, IPoster } from '@/interface';
import SkeletonService from '@/components/skeleton-card';
import Link from 'next/link';
import { Textstyle, Textstylegreen } from '@/components/font-design';

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.1 },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── AnimateWhenVisible ────────────────────────────────────────────────────────

function AnimateWhenVisible({
  children, variants = fadeUp, custom, className = '',
}: {
  children: React.ReactNode; variants?: Variants; custom?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={variants} custom={custom}
      initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────

function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.12 } }, hidden: {} }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ─── PosterCarousel ────────────────────────────────────────────────────────────

function PosterCarousel({ posters }: { posters: IPoster[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((index: number, dir?: 1 | -1) => {
    if (isAnimating || index === current) return;
    setDirection(dir ?? (index > current ? 1 : -1));
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, current]);

  const prev = () => goTo((current - 1 + posters.length) % posters.length, -1);
  const next = () => goTo((current + 1) % posters.length, 1);

  if (!posters.length) return null;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
    center: { x: '0%' },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' }),
  };

  return (
    <section className="relative w-full overflow-hidden mt-20" style={{ height: '400px' }}>
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            className="w-full h-full object-cover"
            src={posters[current].image_url}
            alt={posters[current].id}
            onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }}
          />
          {/* Gradient overlay bawah */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Prev Button */}
      {posters.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-muted hover:bg-muted text-white rounded-full p-2 transition-all duration-200"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-muted hover:bg-muted text-white rounded-full p-2 transition-all duration-200"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {posters.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-3 h-3 bg-primary'
                    : 'w-3 h-3 border border-primary border-2 '
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
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
  const [poster, setPoster] = useState<IPoster[]>([]);
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
      } catch {
        setCategories([]);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    const fetchPoster = async () => {
      try {
        const result = await getAllPosters();
        if (result.success && Array.isArray(result.data)) {
          setPoster(result.data);
        } else {
          console.error('Failed to fetch Poster:', result.message);
          setPoster([]);
        }
      } catch (error) {
        console.error('Failed to fetch Poster:', error);
        setPoster([]);
      }
    };

    fetchCategories();
    fetchPoster();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/service/detail/${categoryId}`);
  };

  return (
    <div className="min-h-screen">
      <div className="mt-20">

 {poster.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <PosterCarousel posters={poster} />
        </motion.div>
      )}
      </div>
      {/* ── Hero Section ── */}
      <section className="pt-5 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex gap-5 w-full mb-4 mt-15">
              <Textstyle Title="FIND" className="text-4xl sm:text-7xl w-full" color="text-purple" />
              <Textstyle Title="OUR" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
              <Textstylegreen Title="SERVICES" className="text-4xl sm:text-7xl w-full" color="text-green" />
            </div>
          </motion.div>
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="text-lg md:text-xl arial"
            >
              Explore our collection and portofolio and browse for your reffrences
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Poster Carousel ── */}
     

      {/* ── Service Categories ── */}
      <section className="py-12 sm:pb-16 px-5 sm:px-6 bg-white">
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
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const primaryImage = category.images?.[0]?.image_url || '';
                return (
                  <motion.div key={category.id} variants={fadeUp} custom={index}>
                    <Card
                      onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                      className="bg-white p-0 m-0 relative h-full overflow-hidden shadow-lg cursor-pointer rounded-[30px] lg:rounded-[50px]"
                    >
                      <div className="relative aspect-square overflow-hidden">
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
                      <div className="p-0 px-3 lg:px-10 m-0">
                        <h3
                          onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                          className="lg:text-xl text-borsok text-dark line-clamp-2 group-hover:text-primary/80 transition-colors"
                        >
                          {category.name}
                        </h3>
                        {/* <p className="text-gray-400 text-arial text-sm line-clamp-3">
                          {category.description || 'No description available'}
                        </p> */}
                      </div>
                      <CardContent />
                      <div className="absolute top-0 right-10 h-18 rounded-b-full w-12 bg-white/50 flex flex-col justify-end items-center">
                        <div className="clip-stars h-6 w-6 bg-white mb-5" />
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                    <Button size="sm" className="button-yellow text-xl p-5 ">
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
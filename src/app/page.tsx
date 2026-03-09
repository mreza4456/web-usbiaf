"use client"

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, Variants } from 'framer-motion';

import BlogCarousel from '@/components/carousel-blog';
import CommmentsCarousel from '@/components/comments.-carousel';
import { Textstyle, TextstyleEliane, TextstyleElianeGreen, Textstylegreen } from '@/components/font-design';
import CategoryPageCarousel from '@/components/service-page-carousel';
import ProductsCarousel from '@/components/carousel-products';
import TeamsCard from '@/components/teams-card';

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.1 },
  }),
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── Reusable Animation Components ────────────────────────────────────────────

interface AnimateProps {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
}

function AnimateWhenVisible({ children, variants = fadeUp, custom, className = '' }: AnimateProps) {
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

// ─── Shared UI Components ─────────────────────────────────────────────────────

function ShowMoreButton({ href }: { href: string }) {
  return (
    <div className="flex justify-center">
      <Link href={href} className="px-6">
        <button className="rounded-full flex items-center gap-2 bg-primary h-14 px-6 text-white hover:bg-primary/90 transition-colors">
          Show More
          <ArrowRight className="w-5 h-5" />
        </button>
      </Link>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURES = [
  "One Stop Service For Vtuber",
  "Specialize On The Artwork",
  "Unlimited Revision Guarantee",
  "Specialize On The Artwork",
  "Unlimited Revision Guarantee",
];

// ─── Section Components ───────────────────────────────────────────────────────

function HeroSection() {
  const heroItems = [
    { title: "One Stop", component: Textstyle, color: 'text-purple', size: 'sm:text-7xl text-6xl', delay: 0 },
    { title: "Creative", component: Textstyle, color: 'text-yellow', size: 'sm:text-8xl text-7xl', delay: 0.15 },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center bg-gradient-to-t from-white to-transparent">
      <div className="container mx-auto max-w-7xl text-center md:text-left">
        {heroItems.map(({ title, component: Component, color, size, delay }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay }}
          >
            <Component Title={title} className={`${size} w-full`} color={color} />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
          className="flex gap-5 justify-center md:justify-start"
        >
          <Textstyle Title="For" className="sm:text-7xl text-6xl w-full" color="text-purple" />
          <Textstylegreen Title="Vtubers" className="sm:text-7xl text-6xl w-full" color="text-green" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.45 }}
          className="text-lg md:text-xl text-gray-700 mb-10 arial"
        >
          More than art - We're partner for Vtuber who dream bigger
        </motion.p>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="px-6 relative bg-white">
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-12 flex flex-col">
            <AnimateWhenVisible variants={fadeLeft}>
              <TextstyleEliane Title="FOR CONSISTENLY" className="text-4xl sm:text-5xl w-full mb-4" color="text-purple" />
              <div className="flex gap-5">
                <TextstyleEliane Title="ARTWORK" className="text-4xl sm:text-5xl w-full" color="text-yellow" />
                <TextstyleEliane Title="AND" className="text-4xl sm:text-5xl w-full" color="text-purple" />
                <TextstyleElianeGreen Title="BRANDS" className="text-4xl sm:text-5xl w-full" color="text-green" />
              </div>
            </AnimateWhenVisible>
          </div>
        </div>

        <AnimateWhenVisible variants={scaleIn}>
          <CategoryPageCarousel />
        </AnimateWhenVisible>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="py-30 px-6 relative bg-gradient-to-b from-white to-transparent">
      <div className="mx-auto max-w-7xl">
        <AnimateWhenVisible variants={scaleIn}>
          <ProductsCarousel />
        </AnimateWhenVisible>
      </div>
      <AnimateWhenVisible variants={fadeUp}>
        <ShowMoreButton href="/projects" />
      </AnimateWhenVisible>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-10 px-6 bg-[#e9def8] relative overflow-hidden">
      <div className="absolute bottom-10 left-10 text-6xl opacity-20">★</div>
      <div className="absolute top-20 right-40 text-4xl rotate-45">✦</div>

      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-5 grid-cols-1 gap-8 items-center">

          <div className="col-span-2">
            <AnimateWhenVisible variants={fadeLeft}>
              <div className="inline-block mb-4">
                <TextstyleEliane Title="GROW BEYOND!" className="text-4xl sm:text-5xl w-full mb-4" color="text-purple" />
                <div className="flex gap-5">
                  <TextstyleEliane Title="WITH" className="text-4xl sm:text-5xl w-full" color="text-yellow" />
                  <TextstyleEliane Title="NEMUNEKO" className="text-4xl sm:text-5xl w-full" color="text-purple" />
                </div>
                <p className="text-lg md:text-xl text-gray-700 my-5 max-w-2xl arial">
                  More than art - We're partner for Vtuber who dream bigger
                </p>
              </div>
            </AnimateWhenVisible>

            <StaggerContainer className="grid grid-cols-1 gap-3">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="flex items-center px-5 bg-white overflow-hidden rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  <div className="bg-gray-100 p-3 aspect-square h-full flex items-center justify-center">
                    <img src="images/stars.png" alt="star" className="w-7 h-7" />
                  </div>
                  <span className="text-arial text-primary p-3">{feature}</span>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>

          <AnimateWhenVisible variants={fadeRight} className="relative col-span-3">
            <div className="flex items-center justify-center">
              <Image src="/images/why.png" alt="why" width={1000} height={1000} />
            </div>
            <div className="absolute right-1/3 sm:right-35 bottom-[12%]">
              <Link className="button-yellow text-xl py-2 px-7" href="/contact">ABOUT ME</Link>
            </div>
          </AnimateWhenVisible>

        </div>
      </div>
    </section>
  );
}

function TeamsSection() {
  return (
    <section id="teams" className="py-30 px-6 relative bg-gradient-to-b from-white via-transparent to-white">
      <div className="absolute top-10 right-20 text-4xl sm:text-5xl rotate-12">✦</div>

      <div className="container mx-auto max-w-7xl">
        <div className="text-left mb-12 flex flex-col">
          <AnimateWhenVisible variants={fadeLeft}>
            <div className="inline-block mb-4">
              <TextstyleEliane Title="SUPERMAN BEHIND" className="text-4xl sm:text-5xl w-full mb-4" color="text-purple" />
              <div className="flex gap-5 flex-wrap">
                <TextstyleEliane Title="ARTWORK" className="text-4xl sm:text-5xl w-full" color="text-yellow" />
                <TextstyleEliane Title="AND" className="text-4xl sm:text-5xl w-full" color="text-purple" />
                <TextstyleElianeGreen Title="BRAND" className="text-4xl sm:text-5xl w-full" color="text-green" />
              </div>
            </div>
          </AnimateWhenVisible>
        </div>

        <AnimateWhenVisible variants={scaleIn}>
          <TeamsCard />
        </AnimateWhenVisible>

        <AnimateWhenVisible variants={fadeUp}>
          <div className="mt-25">
            <ShowMoreButton href="/teams" />
          </div>
        </AnimateWhenVisible>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-white to-transparent">
      <div className="container mx-auto max-w-7xl pt-40 pb-20 px-6">
        <div className="text-left flex flex-col">
          <div className="inline-block mb-20">
            <AnimateWhenVisible variants={fadeLeft}>
              <TextstyleEliane Title="TESTIMONIALS" className="text-4xl sm:text-5xl w-full mb-4" color="text-purple" />
              <div className="flex gap-5">
                <TextstyleEliane Title="WHAT" className="text-4xl sm:text-5xl w-full mb-4" color="text-purple" />
                <TextstyleEliane Title="STREAMERS" className="text-4xl sm:text-5xl w-full" color="text-yellow" />
                <TextstyleEliane Title="SAY" className="text-4xl sm:text-5xl w-full" color="text-purple" />
              </div>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl arial">
                More than art - We're partner for Vtuber who dream bigger
              </p>
            </AnimateWhenVisible>
          </div>

          <AnimateWhenVisible variants={scaleIn}>
            <CommmentsCarousel />
          </AnimateWhenVisible>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="pb-20 px-4 sm:px-6">
      <div className="container mx-auto">
        <AnimateWhenVisible variants={scaleIn}>
          <Card className="bg-muted/50 border-primary/30">
            <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                Ready to Transform Your Stream?
              </h2>
              <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                Bergabunglah dengan ribuan content creator yang telah mempercayai Nemuneko Studio
                untuk meningkatkan kualitas stream mereka.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/order">
                  <Button size="lg" className="bg-primary text-white rounded-full px-10 py-7">
                    Start Your Journey
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" className="bg-background border-3 border-primary text-primary hover:bg-primary hover:text-white rounded-full px-10 py-7">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </AnimateWhenVisible>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NemunekoStudio() {
  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <FeaturesSection />
      <TeamsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
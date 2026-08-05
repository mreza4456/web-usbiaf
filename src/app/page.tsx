"use client"

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';


import BlogCarousel from '@/components/carousel-blog';
import CommmentsCarousel from '@/components/comments.-carousel';
import { Textstyle, TextstyleEliane, TextstyleElianeGreen, Textstylegreen } from '@/components/font-design';
import CategoryPageCarousel from '@/components/service-page-carousel';
import ProductsCarousel from '@/components/carousel-products';
import TeamsCard from '@/components/teams-card';

// ─── Animation Variants ────────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMediaQuery } from '@/hooks/use-media-query';

const Live2DWidget = dynamic(() => import('@/components/live2d-widget'), {
  ssr: false,
});

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
    { title: "One Stop", class: 'text-[#6B50B0]', size: 'sm:text-7xl text-5xl whitespace-nowrap', delay: 0 },
    { title: "Creative", class: 'text-[#6B50B0]', size: 'sm:text-8xl text-6xl', delay: 0.15 },
  ];
  const isDesktop = useMediaQuery("(min-width: 768px)")
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-t from-white to-transparent">
      <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-10">

        {/* Text kiri */}
        <div className="text-center md:text-left">
          {heroItems.map(({ title, size, delay }) => (
            <div
              key={title}
           
            >
              <h1 className={`${size} text-[#6B50B0] text-borsok  w-full `}  >{title}</h1>
            </div>
          ))}

          <div
       
            className="flex gap-5 justify-center md:justify-start"
          >
            {/* <Textstyle Title="For" className="sm:text-7xl text-5xl w-full" color="text-purple" />
            <Textstylegreen Title="Vtubers" className="sm:text-7xl text-5xl w-full" color="text-green" /> */}
            <h1 className='text-[#6B50B0] text-borsok sm:text-7xl text-5xl'>For Vtubers</h1>
          </div>

          <p

            className="text-md px-5 sm:px-0 md:text-xl text-gray-700 mb-10 arial"
          >
            More than art - We're partner for Vtuber who dream bigger
          </p>
        </div>

        {/* Live2D kanan */}
        {isDesktop && (
          <div
      
            className="relative w-full h-[1000px]"
          >
            <div className="h-1/7 bottom-0 absolute left-0 bg-gradient-to-t from-white to-transparent w-full" />
            <Live2DWidget modelPath="/Rigging_Karater_Nemuneko_RIG/Nemuneko_RIG.model3.json" />
          </div>
        )}

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
        
              <div className=' flex justify-between items-center'>
                <div>
                  <h1 className="text-2xl sm:text-5xl w-full text-[#6B50B0] text-eliane" >For Consistenly</h1>
                  <h1 className="text-2xl sm:text-5xl w-full text-[#6B50B0] text-eliane" >Artwork And Brand</h1>
                </div>
                {/* <Link href={"/service"} className="lg:block hidden">
                  <button className="rounded-full text-font-arial flex justify-center items-center gap-2 bg-primary h-14 px-6 text-white whitespace-nowrap flex-shrink-0 hover:bg-primary/90 transition-colors">
                    Browse Commissions
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link> */}

              </div>
              {/*  <div className="flex gap-5">
          
                 <h1 className="text-2xl sm:text-5xl w-full text-[#6B50B0] text-eliane" >AND</h1>
                <TextstyleEliane Title="AND" className="text-2xl sm:text-5xl w-full" color="text-purple" />
                <TextstyleElianeGreen Title="BRANDS" className="text-2xl sm:text-5xl w-full" color="text-green" /> 
              </div>*/}
       
          </div>
        </div>

     
          <CategoryPageCarousel />
  
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="py-30 px-6 relative bg-gradient-to-b from-white to-transparent">
      <div className="mx-auto max-w-7xl">
  
          <ProductsCarousel />

      </div>

        <ShowMoreButton href="/projects" />

    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-10 px-6 bg-[#e9def8] relative overflow-hidden">


      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-5 grid-cols-1 gap-8 items-center">

          <div className="col-span-2">
          
              <div className="inline-block mb-4">
                {/* <TextstyleEliane Title="GROW BEYOND!" className="text-3xl sm:text-5xl w-full mb-4" color="text-purple" /> */}
                <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >Grow Beyond!</h1>
                <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >With Nemuneko</h1>
                {/* <div className="flex gap-5">
                  <TextstyleEliane Title="WITH" className="text-3xl sm:text-5xl w-full" color="text-yellow" />
                  <TextstyleEliane Title="NEMUNEKO" className="text-3xl sm:text-5xl w-full" color="text-purple" />
                </div> */}
                <p className="text-lg md:text-xl text-gray-700 my-5 max-w-2xl arial">
                  More than art - We're partner for Vtuber who dream bigger
                </p>
              </div>
         

            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
            
                  className="flex items-center px-5 bg-white overflow-hidden rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  <div className="bg-gray-100 p-3 aspect-square h-full flex items-center justify-center">
                    <Image width={28} height={28} src="/images/stars.png" alt="star" className="w-7 h-7" />
                  </div>
                  <span className="text-arial text-primary p-3">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative col-span-3">
            <div className="flex items-center justify-center">
              <Image src="/images/why.webp" alt="why" width={1000} height={1000} />
            </div>
            <div className="absolute right-1/3 sm:right-35 bottom-[12%]">
              <Link className="button-yellow text-xl py-2 px-7" href="/contact">ABOUT ME</Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function TeamsSection() {
  return (
    <section id="teams" className="py-30 px-6 relative bg-gradient-to-b from-white via-transparent to-white">
      <div className="absolute top-10 right-20 text-3xl sm:text-5xl rotate-12">✦</div>

      <div className="container mx-auto max-w-7xl">
        <div className="text-left mb-12 flex flex-col">
       
            <div className="inline-block mb-4">
              {/* <TextstyleEliane Title="SUPERMAN BEHIND" className="text-3xl sm:text-5xl w-full mb-4" color="text-purple" /> */}
              <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >Superman Behind</h1>
              <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >Artwork And Brand</h1>
              {/* <div className="flex gap-5 flex-wrap">
                <TextstyleEliane Title="ARTWORK" className="text-3xl sm:text-5xl w-full" color="text-yellow" />
                <TextstyleEliane Title="AND" className="text-3xl sm:text-5xl w-full" color="text-purple" />
                <TextstyleElianeGreen Title="BRAND" className="text-3xl sm:text-5xl w-full" color="text-green" />
              </div> */}
            </div>
       
        </div>

      
          <TeamsCard />
     

      
          <div className="mt-25">
            <ShowMoreButton href="/teams" />
          </div>
    
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
          
              <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >Testimonials</h1>
              <h1 className="text-3xl sm:text-5xl w-full text-[#6B50B0] text-eliane mb-4" >What Streamers Say</h1>
              {/* <TextstyleEliane Title="TESTIMONIALS" className="text-3xl sm:text-5xl w-full mb-4" color="text-purple" /> */}
              {/* <div className="flex gap-5">
                <TextstyleEliane Title="WHAT" className="text-3xl sm:text-5xl w-full mb-4" color="text-purple" />
                <TextstyleEliane Title="STREAMERS" className="text-3xl sm:text-5xl w-full" color="text-yellow" />
                <TextstyleEliane Title="SAY" className="text-3xl sm:text-5xl w-full" color="text-purple" />
              </div> */}
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl arial">
                More than art - We're partner for Vtuber who dream bigger
              </p>
          
          </div>

            <CommmentsCarousel />
    
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="container mx-auto">

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
                <div>
                  <Button size="sm" className="button-yellow text-xl p-5 ">
                    Request Custom Project
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
      
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
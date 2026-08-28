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
import { CardDashedCTA, CardDashedThird } from '@/components/card-dashed';
import BadgeDisplay from '@/components/badge-display';
import HandpickDisplay from '@/components/handpick';

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

// ─── Section Components ───────────────────────────────────────────────────────
function HeroSection() {

  const isDesktop = useMediaQuery("(min-width: 768px)")
  return (
    <section className="relative min-h-screen  items-center bg-gradient-to-t from-white to-transparent">
      <div className="container flex flex-col justify-center md:mt-0 mt-25  mx-auto max-w-7xl relative ">
        <div className='px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-10'>

          {/* Text kiri */}
          <div className="text-left xl:p-0 p-10 text-primary md:mb-15">

            <h1 className='text-6xl lg:text-7xl xl:text-8xl '>ONE STOP</h1>
            <h1 className=' text-7xl lg:text-8xl xl:text-9xl '>SERVICE</h1>
            <h1 className=' text-6xl lg:text-7xl xl:text-8xl '>FOR VTUBERS</h1>
            <p

              className="text-md text-primary  sm:px-0 md:text-xl text-gray-700   "
            >
              WE GROW <b>TOGETHER!</b> WE  <b>SUPPORT VTUBERS</b> EACH OTHER
            </p>
          </div>

          {/* Live2D kanan */}
          {isDesktop && (
            <div

              className="relative w-full  h-[1000px]"
            >
              <div className="h-1/2 bottom-0 absolute left-0 bg-gradient-to-t from-white to-transparent w-full" />
              <Live2DWidget modelPath="/Rigging_Karater_Nemuneko_RIG/Nemuneko_RIG.model3.json" />
            </div>
          )}

        </div>
<div className='px-6 sm:px-6'>
        <CardDashedThird className='  mx-auto mt-15 md:mt-0 md:-top-[220px]  '>
          <div className=' grid grid-cols-2 sm:grid-cols-4  overflow-hidden rounded-[27px]'>
            <div className="p-5 flex gap-10 items-center border-primary border-r-2 border-b-2 sm:border-b-0 ">
              <div className='text-start text-primary'>
                <p>Total Sales</p>
                <h1 className='text-3xl'>75.760+</h1>
              </div>
              <Image alt="" src="/SVG/icontotal.svg" className='hidden lg:block' width={40} height={40} />
            </div>
            <div className="p-5 flex gap-10 sm:bg-muted/50    border-primary sm:border-r-2  border-b-2 sm:border-b-0">
              <div className="flex">
                <div className='text-start text-primary '>
                  <p>Product Sales</p>
                  <h1 className='text-3xl'>2.450+</h1>
                </div>
              </div>
              <Image alt="" src="/SVG/iconsales.svg" className='hidden lg:block' width={40} height={40} />
            </div>
            <div className="p-5 flex gap-10   border-primary border-r-2 ">
              <div className='text-start text-primary'>
                <p>Total Reviews</p>
                <h1 className='text-3xl'>58.504+</h1>
              </div>
              <Image alt="" src="/SVG/iconreview.svg" className='hidden lg:block' width={40} height={40} />
            </div>
            <div className="p-5 flex gap-10   border-primary  ">
              <div className='text-start text-primary'>
                <p>Team Member</p>
                <h1 className='text-3xl'>12</h1>
              </div>
              <Image alt="" src="/SVG/iconmember.svg" className='hidden lg:block' width={40} height={40} />
            </div>
          </div>
        </CardDashedThird>
</div>
      </div>
    </section>
  );
}



function HandPicked() {
  return (
    <section className="bg-gradient-to-b from-white to-transparent">
      <div className="container mx-auto max-w-7xl  px-4 sm:px-6 ">
        <div className="flex flex-col">
          <div className="inline-block mb-15">
            <div className='relative  w-fit'>
              <h1 className="text-6xl sm:text-7xl w-full text-primary mb-4" >Hand Picked</h1>
              <div className='w-[70%] float-end -mt-5 h-3 bg-muted rounded-xs text-accent'></div>
            </div>
          </div>

          <HandpickDisplay />
        </div>
      </div>
    </section>
  );
}
function BadgeData() {
  return (
    <section className="bg-gradient-to-b from-white to-transparent">
      <div className="container mx-auto max-w-7xl py-12 px-4 sm:px-6 ">
        <div className="">
          

          <BadgeDisplay />
        </div>
      </div>
    </section>
  );
}


function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-white to-transparent">
      <div className="container mx-auto max-w-7xl py-12 px-4 sm:px-6 ">
        <div className="text-left flex flex-col">
          <div className="inline-block mb-5">
            <div className='relative  w-fit'>
              <h1 className="text-6xl sm:text-7xl w-full text-primary mb-4" >Testimonials</h1>
              <div className='w-[70%] float-end -mt-5 h-3 bg-muted rounded-xs text-accent'></div>
            </div>
          </div>

          <CommmentsCarousel />

        </div>
      </div>
    </section>
  );
}


export function CTASection() {
  return (
    <section className="py-12 px-4 sm:px-6 ">
      <div className="container mx-auto">

        <CardDashedCTA className=" ">
          <div className="overflow-hidden">
          <div className="grid grid-cols-5 ">
            <div className="sm:col-span-3 col-span-5 p-5">
              <div className="text-left text-lilita  sm:p-10 px-4 sm:px-15 ">
                <p className='text-secondary text-xl'>Our Services</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl  text-primary ">
                  Can't Find What You're
                </h1>
                <div className='relative  w-fit'>
                  <h1 className="text-5xl sm:text-8xl w-full   text-primary mb-7" >Looking <span className="bg-title">For?</span></h1>
                  {/* <div className='w-[70%] float-end -mt-5 h-10 bg-muted rounded-xs text-accent'></div> */}
                </div>

                <Link href="/order">
                  <div>
                    <Button size="sm" className="text-lilita text-white rounded-full text-xl p-5  ">
                      Request Custom Project
                    </Button>
                  </div>
                </Link>
              </div>
            </div>
            <div className="col-span-2">

            </div>
          </div>
          </div>
        </CardDashedCTA>

      </div>
    </section>

  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NemunekoStudio() {
  return (
    <div className="relative overflow-hidden max-w-7xl mx-auto">
      <HeroSection />
<div className="sm:px-0 px-5">
      <HandPicked />
     <BadgeData/>
      <TestimonialsSection />
      <CTASection />
      </div>
    </div>
  );
}
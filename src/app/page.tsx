"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Palette, Users, Star, ArrowRight, Check, Package, Shield, Headphones, Award } from 'lucide-react';
import Link from 'next/link';
import BlogCarousel from '@/components/carousel-blog';
import CommmentsCarousel from '@/components/comments.-carousel';
import { Textstyle, TextstyleEliane, TextstyleElianeGreen, Textstylegreen } from '@/components/font-design';
import CategoryPageCarousel from '@/components/service-page-carousel';
import ProductsCarousel from '@/components/carousel-products';
import Image from 'next/image';

export default function NemunekoStudio() {
  const services = [
    {
      icon: Sparkles,
      title: "Stream Widgets",
      description: "Widget interaktif yang dapat disesuaikan untuk meningkatkan engagement stream Anda",
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
      price: "$49",
      features: ["Alert Notifikasi", "Chat Overlay", "Goal Tracker", "Event List"]
    },
    {
      icon: Palette,
      title: "Custom Overlays",
      description: "Desain overlay unik yang mencerminkan brand dan personality Anda",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop",
      price: "$79",
      features: ["Starting Soon", "BRB Screen", "End Screen", "Transitions"]
    },
    {
      icon: Zap,
      title: "Illustrations",
      description: "Getting art of your character is a happy thing! Show off your personality and lore",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
      price: "$99",
      features: ["Animated Alerts", "Scene Transitions", "Stinger Transitions", "Motion Graphics"]
    }
  ];

  const features = [
    "One Stop Service For Vtuber",
    "Specialize On The Artwork",
    "Unlimited Revision Guarantee",
    "Specialize On The Artwork",
    "Unlimited Revision Guarantee"
  ];

  const testimonials = [
    {
      name: "Alex Stream",
      role: "Twitch Partner",
      content: "Widget dari Nemuneko Studio benar-benar mengubah tampilan stream saya. Engagement naik 200%!",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
    },
    {
      name: "Rina Gaming",
      role: "YouTube Creator",
      content: "Kualitas profesional dengan harga yang sangat terjangkau. Highly recommended!",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rina"
    },
    {
      name: "David Streamer",
      role: "Content Creator",
      content: "Customer support yang luar biasa responsif dan helpful. Best investment untuk stream!",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    }
  ];

  const handleClick = () => {
    console.log('Navigate to order page');
  };

  const handleShow = () => {
    console.log('Navigate to projects page');
  };

  return (
    <div className=" relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen  flex flex-col justify-center items-center ">
        <div className="container mx-auto  max-w-7xl">


          {/* <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-[#50398e]">
            The place to find the best
            <br />
            <span className="relative inline-block">
              streaming assets
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-1 -z-5"></div>
            </span>
          </h1> */}
          <Textstyle Title="One Stop" className='text-6xl w-full' color='text-purple' />
          <Textstyle Title="Creative" className='text-7xl w-full' color='text-yellow' />
          <div className="flex gap-5">
            <Textstyle Title="For" className='text-6xl w-full' color='text-purple' />
            <Textstylegreen Title="Vtubers" className='text-6xl w-full' color='text-green' />
          </div>
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl  arial">
            More than art - We're partner for Vtuber who dream bigger
          </p>


          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button onClick={handleClick} size="lg" className="cursor-pointer bg-muted hover:bg-muted/90 text-primary text-lg px-10 py-7 rounded-full shadow-lg">
              Order Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={handleShow} size="lg" className="cursor-pointer bg-white hover:bg-gray-50 text-[#50398e] text-lg px-10 py-7 rounded-full shadow-lg border-2 border-[#50398e]">
              View Projects
            </Button>
          </div>

      
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { number: "5000+", label: "Happy Streamers" },
              { number: "10K+", label: "Assets Sold" },
              { number: "4.9★", label: "Rating" },
              { number: "24/7", label: "Support" }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#dbc8fb] rounded-full opacity-20 -mr-10 -mt-10"></div>
                <div className="text-3xl font-bold text-[#50398e] mb-1 relative z-10">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm font-medium relative z-10">{stat.label}</div>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className=" px-6 relative">
        <div className=" mx-auto max-w-7xl">
          <div className="text-left mb-12 flex flex-col">
            <div className="inline-block mb-4">
              <TextstyleEliane Title="FOR CONSISTENLY" className='text-5xl w-full mb-4' color='text-purple' />

              <div className="flex gap-5 ">
                <TextstyleEliane Title="ARTWORK" className='text-5xl w-full' color='text-yellow' />
                <TextstyleEliane Title="AND" className='text-5xl w-full' color='text-purple' />
                <TextstyleElianeGreen Title="BRANDS" className='text-5xl w-full' color='text-green' />
              </div>
            </div>
          </div>

          <CategoryPageCarousel />

        </div>
      </section>

      <section id="projects" className=" pb-30 px-6 relative">
        <div className=" mx-auto max-w-7xl">
          <div className="text-left mb-12 flex flex-col">
            <div className="inline-block mb-4">
              <TextstyleEliane Title="READY TO USE" className='text-5xl w-full mb-4' color='text-purple' />

              <div className="flex gap-5">
                <TextstyleEliane Title="AND" className='text-5xl w-full' color='text-purple' />
                <TextstyleElianeGreen Title="ADOBTABLE" className='text-5xl w-full' color='text-green' />
              </div>
            </div>
          </div>

          <ProductsCarousel />

        </div>
      </section>

      {/* <section id='blog' className='py-20 px-6 relative'>
        <BlogCarousel />
        <div className="text-center ">
          <Link href="/blog">
            <Button className="bg-white cursor-pointer hover:bg-gray-50 text-[#50398e] px-10 py-6 rounded-full shadow-md border-2 border-[#50398e]">
              Show More
            </Button>
          </Link>
        </div>
      </section> */}

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#e9def8]  relative overflow-hidden">
        <div className="absolute bottom-10 left-10 text-6xl opacity-20">★</div>
        <div className="absolute top-20 right-40 text-4xl rotate-45">✦</div>

        <div className="container mx-auto max-w-6xl ">
          <div className="grid md:grid-cols-5  gap-8 items-center">
            <div className='col-span-2'>
              <div className="inline-block mb-4">
                <TextstyleEliane Title="GROW BEYOND!" className='text-5xl w-full mb-4' color='text-purple' />

                <div className="flex gap-5">
                  <TextstyleEliane Title="WITH" className='text-5xl w-full' color='text-yellow' />
                  <TextstyleEliane Title="NEMUNEKO" className='text-5xl w-full' color='text-purple' />
                </div>
                <p className="text-lg md:text-xl text-gray-700 my-5 max-w-2xl  arial">
                  More than art - We're partner for Vtuber who dream bigger
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center px-5  bg-white overflow-hidden rounded-full shadow-sm  hover:shadow-md transition-all">
                    {/* <Check className="w-5 h-5 mr-3 text-[#50398e] flex-shrink-0" /> */}
                    <div className="bg-gray-100 p-3 aspect-square h-full flex items-center justify-center ">
                      <img src="images/stars.png" alt="asw3" className='w-7 h-7 ' />
                    </div>
                    <span className="text-arial text-primary p-3">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative col-span-3">
              <div className=" flex items-center justify-center">
                <Image src="/images/why.png" alt="why" width={1000} height={1000} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="container mx-auto max-w-7xl pt-40 pb-20">
          <div className="text-left flex flex-col">
            <div className="inline-block mb-4">

              <TextstyleEliane Title="TESTIMONIALS" className='text-5xl w-full mb-4' color='text-purple' />

              <div className="flex gap-5">
                <TextstyleEliane Title="WHAT" className='text-5xl w-full mb-4' color='text-purple' />
                <TextstyleEliane Title="STREAMERS" className='text-5xl w-full' color='text-yellow' />
                <TextstyleEliane Title="SAY" className='text-5xl w-full' color='text-purple' />
              </div>
              <p className="text-lg md:text-xl text-gray-700 my-5 max-w-2xl  arial">
                More than art - We're partner for Vtuber who dream bigger
              </p>
            </div>
            <CommmentsCarousel />
          </div>
        </div>
      </section >


      <section id="teams" className=" py-20 mb-20 px-6 relative">
        <div className="absolute top-10 right-20 text-5xl rotate-12">✦</div>

        <div className="container mx-auto max-w-7xl">
          <div className="text-left mb-12 flex flex-col">
            <div className="inline-block mb-4">
              <TextstyleEliane Title="SUPERMAN BEHIND" className='text-5xl w-full mb-4' color='text-purple' />

              <div className="flex gap-5">
                <TextstyleEliane Title="ARTWORK" className='text-5xl w-full' color='text-yellow' />
                <TextstyleEliane Title="AND" className='text-5xl w-full' color='text-purple' />
                <TextstyleElianeGreen Title="BRAND" className='text-5xl w-full' color='text-green' />
              </div>
            </div>
          </div>

          {/* <ProductsCarousel /> */}
          <div className="grid md:grid-cols-4">
            <div className='relative h-[400px]'>
              <div className='absolute inset-0 translate-y-2 bg-[#f99c08] rounded-[40px] border-3 border-[#ad4512] z-0'></div>

              <div className='relative z-10 h-full bg-[#faca06] border-3 rounded-[40px] border-[#ad4512] p-4 '>
                <div className=''>
                  <div className="h-full w-8 absolute top-0 left-25  bg-[#fff8dc] -z-1 -skew-x-20"></div>
                  <div className="h-full w-15 absolute top-0 left-35   bg-[#fff8dc] -z-1 -skew-x-20"></div>
                </div>
                <div className="w-full h-full bg-gradient-to-r rounded-[30px] from-[#493977] relative to-[#6b53ac] p-2 border-3 border-[#ad4512] shadow-box1 z-20">
                  <div className="bg-gradient-to-t from-[#4c3b7c]  to-transparent absolute rounded-[25px] bottom-0 left-0  z-10 w-full h-2/3"></div>
                  <div className="w-full h-full bg-gradient-to-r relative rounded-[25px] from-[#6b53ac] to-[#493977]">
                    <img src="images/airi.png" className='absolute top-[-15%] left-1/2 -translate-x-1/2 w-[85%]' alt="" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                      <Textstyle Title="AIRI" className=' text-5xl w-full mb-4' color='text-purple' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="pb-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <Card className="bg-muted/50 border-primary/30">
            <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                Ready to Transform Your Stream?
              </h2>
              <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                Bergabunglah dengan ribuan content creator yang telah mempercayai Nemuneko Studio untuk meningkatkan kualitas stream mereka.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/order">
                  <Button size="lg" className="bg-primary text-white rounded-full px-10 py-7 ">
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
        </div>
      </section>
    </div >
  );
}
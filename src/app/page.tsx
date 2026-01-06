"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Palette, Users, Star, ArrowRight, Check, Package, Shield, Headphones, Award } from 'lucide-react';
import Link from 'next/link';

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
    "Kompatibel dengan OBS, Streamlabs & StreamElements",
    "Support Twitch, YouTube & Kick",
    "Customizable Colors & Fonts",
    "Easy Installation",
    "Free Updates",
    "24/7 Customer Support"
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
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm ">
            <span className="text-sm font-semibold text-[#50398e]"> Welcome to Nemuneko Studio</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-[#50398e]">
            The place to find the best
            <br />
            <span className="relative inline-block">
              streaming assets
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-1 -z-5"></div>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            You came to look for streaming assets? You are in the right place, here we have provided thousands of assets that might be suitable for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button onClick={handleClick} size="lg" className="cursor-pointer bg-muted hover:bg-muted/90 text-primary text-lg px-10 py-7 rounded-full shadow-lg">
              Order Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={handleShow} size="lg" className="cursor-pointer bg-white hover:bg-gray-50 text-[#50398e] text-lg px-10 py-7 rounded-full shadow-lg border-2 border-[#50398e]">
              View Projects
            </Button>
          </div>

          {/* Stats */}
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
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6 relative">
        <div className="absolute top-10 right-20 text-5xl rotate-12">✦</div>

        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-12 flex flex-col">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-[#50398e] bg-muted px-4 py-2 rounded-full shadow-sm border-2 border-[#dbc8fb]">
                Our Services
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#50398e] relative inline-block">
              Complete Streaming Solutions
              <span className="absolute -top-6 -right-8 text-4xl">✦</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl">
              Solusi lengkap untuk semua kebutuhan streaming Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service, i) => {
             
              return (
                <Card key={i} className={`border-3 border-primary rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 overflow-hidden bg-white`}>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-[#50398e] mb-2 flex items-center justify-between">
                      {service.title}
                      <Star className="w-5 h-5 fill-[#FFE66D] text-[#FFE66D]" />
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature, j) => (
                        <li key={j} className="flex items-center text-gray-600 text-sm">
                          <Check className="w-4 h-4 mr-2 text-[#50398e]" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/service">
              <Button className="bg-white cursor-pointer hover:bg-gray-50 text-[#50398e] px-10 py-6 rounded-full shadow-md border-2 border-[#50398e]">
                Show More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/50 relative overflow-hidden">
        <div className="absolute bottom-10 left-10 text-6xl opacity-20">★</div>
        <div className="absolute top-20 right-40 text-4xl rotate-45">✦</div>

        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4">
                <span className="text-sm font-semibold text-[#50398e] bg-white px-4 py-2 rounded-full shadow-sm">
                  Why Choose Us?
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#50398e]">
                Why Choose Nemuneko?
              </h2>
              <p className="text-gray-700 text-lg mb-8">
                Kami memahami kebutuhan setiap content creator. Dengan pengalaman bertahun-tahun, kami menciptakan produk berkualitas tinggi yang mudah digunakan dan terjangkau.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border-2 border-white hover:shadow-md transition-all">
                    <Check className="w-5 h-5 mr-3 text-[#50398e] flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white rounded-3xl shadow-xl  flex items-center justify-center">
                <Users className="w-32 h-32 text-[#50398e]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-30 px-6  relative overflow-hidden">
        <div className="absolute top-10 left-20 text-5xl text-primary opacity-10 rotate-12">★</div>
        <div className="absolute bottom-20 right-40 text-6xl text-primary opacity-10">✦</div>

        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-12">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-primary bg-muted px-4 py-2 rounded-full">
                Testimonials
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              What Streamers Say
            </h2>
            <p className="text-gray-500 text-lg">Trusted by thousands of content creators</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-muted/50 backdrop-blur-sm border-2 border-primary/20 hover:scale-105 transition-all rounded-3xl">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#FFE66D] text-[#FFE66D]" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-500 text-base italic leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full border-2 border-white" />
                    <div>
                      <div className="font-semibold text-primary">{testimonial.name}</div>
                      <div className="text-sm text-primary/80">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
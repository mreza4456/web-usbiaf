"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Twitter, Instagram, Mail, Globe, Users, Award, Heart, Briefcase, Code, Palette, Zap, MessageCircle } from 'lucide-react';

export default function Teams() {
  const [activeTab, setActiveTab] = useState('team');

  const teamMembers = [
    {
      id: 1,
      name: "Aiko Tanaka",
      role: "Founder & Lead Designer",
      avatar: "👩‍🎨",
      bio: "Passionate designer dengan 8+ tahun pengalaman di industri streaming. Menciptakan visual yang memorable dan engaging.",
      specialties: ["UI/UX Design", "Branding", "Motion Graphics"],
      socials: {
        twitter: "@aikotanaka",
        instagram: "@aiko.designs",
        email: "aiko@nemuneko.studio"
      },
      stats: {
        projects: 150,
        clients: 500,
        rating: 4.9
      }
    },
    {
      id: 2,
      name: "Ryu Nakamura",
      role: "Lead Developer",
      avatar: "👨‍💻",
      bio: "Full-stack developer yang mengubah design menjadi interactive widgets. Specialist dalam web technologies dan animations.",
      specialties: ["JavaScript", "React", "CSS Animations"],
      socials: {
        twitter: "@ryucodes",
        instagram: "@ryu.dev",
        email: "ryu@nemuneko.studio"
      },
      stats: {
        projects: 200,
        clients: 450,
        rating: 5.0
      }
    },
    {
      id: 3,
      name: "Sakura Yamamoto",
      role: "Motion Designer",
      avatar: "🎬",
      bio: "Motion designer yang membuat animasi smooth dan eye-catching. Expert dalam After Effects dan Lottie animations.",
      specialties: ["After Effects", "Animation", "Video Editing"],
      socials: {
        twitter: "@sakuramotion",
        instagram: "@sakura.motion",
        email: "sakura@nemuneko.studio"
      },
      stats: {
        projects: 180,
        clients: 380,
        rating: 4.8
      }
    },
    {
      id: 4,
      name: "Kenji Sato",
      role: "Illustrator",
      avatar: "✏️",
      bio: "Creative illustrator dengan style yang versatile. Menciptakan custom artwork dan emotes untuk streamers.",
      specialties: ["Digital Art", "Character Design", "Emotes"],
      socials: {
        twitter: "@kenjiart",
        instagram: "@kenji.illust",
        email: "kenji@nemuneko.studio"
      },
      stats: {
        projects: 220,
        clients: 600,
        rating: 4.9
      }
    },
    {
      id: 5,
      name: "Hana Fujimoto",
      role: "Customer Success Manager",
      avatar: "💼",
      bio: "Memastikan setiap client mendapatkan pengalaman terbaik. Always ready to help dan mendengarkan kebutuhan Anda.",
      specialties: ["Customer Support", "Project Management", "Communication"],
      socials: {
        twitter: "@hanafuji",
        instagram: "@hana.nemuneko",
        email: "hana@nemuneko.studio"
      },
      stats: {
        projects: 500,
        clients: 1000,
        rating: 5.0
      }
    },
    {
      id: 6,
      name: "Takeshi Ito",
      role: "Sound Designer",
      avatar: "🎵",
      bio: "Audio specialist yang menciptakan sound effects dan music untuk alerts. Membuat stream Anda terdengar professional.",
      specialties: ["Sound Design", "Audio Mixing", "Music Production"],
      socials: {
        twitter: "@takeshisound",
        instagram: "@takeshi.audio",
        email: "takeshi@nemuneko.studio"
      },
      stats: {
        projects: 160,
        clients: 420,
        rating: 4.9
      }
    }
  ];

  const partners = [
    {
      id: 1,
      name: "StreamLabs",
      logo: "🎮",
      type: "Platform Partner",
      description: "Official integration partner untuk streaming platform terkemuka",
      benefits: ["Direct Integration", "Premium Support", "Early Access"],
      featured: true
    },
    {
      id: 2,
      name: "OBS Studio",
      logo: "📹",
      type: "Technology Partner",
      description: "Kompatibilitas penuh dengan OBS Studio untuk seamless integration",
      benefits: ["Full Compatibility", "Plugin Support", "Documentation"],
      featured: true
    },
    {
      id: 3,
      name: "Twitch",
      logo: "💜",
      type: "Platform Partner",
      description: "Verified partner untuk Twitch extensions dan integrations",
      benefits: ["Extension Support", "API Access", "Featured Status"],
      featured: false
    },
    {
      id: 4,
      name: "StreamElements",
      logo: "⚡",
      type: "Platform Partner",
      description: "Partnership untuk custom widget development dan integrations",
      benefits: ["Custom Widgets", "Priority Support", "Revenue Share"],
      featured: true
    },
    {
      id: 5,
      name: "Discord",
      logo: "💬",
      type: "Community Partner",
      description: "Official Discord server dengan exclusive content dan support",
      benefits: ["Community Access", "Beta Testing", "Direct Support"],
      featured: false
    },
    {
      id: 6,
      name: "Adobe",
      logo: "🎨",
      type: "Technology Partner",
      description: "Partnership untuk professional design tools dan resources",
      benefits: ["Tool Access", "Training Resources", "Templates"],
      featured: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
            <span className="text-sm font-semibold text-[#50398e]">✨ Meet The Creators</span>
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight">
            Our <span className="text-primary relative">Team & Partners<div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-3 -z-5"></div></span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
            Talented professionals dan trusted partners yang membuat Nemuneko Studio menjadi pilihan terbaik untuk streamers
          </p>

          {/* Tab Selector */}
          <div className="flex justify-center gap-4 mt-12">
            <Button
              size="lg"
              onClick={() => setActiveTab('team')}
              className={
                activeTab === 'team'
                  ? "bg-primary text-white"
                  : "bg-background border border-2 border-primary text-primary hover:bg-muted cursor-pointer"
              }
            >
              <Users className="w-5 h-5 mr-2" />
              Our Team
            </Button>
            <Button
              size="lg"
              onClick={() => setActiveTab('partners')}
              className={
                activeTab === 'partners'
                  ? "bg-primary text-white"
                  : "bg-background border border-2 border-primary text-primary hover:bg-muted cursor-pointer"
              }
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Partners
            </Button>
          </div>
        </div>
      </section>

      {/* Team Section */}
      {activeTab === 'team' && (
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { icon: Users, number: "6", label: "Team Members" },
                { icon: Award, number: "1,000+", label: "Projects Done" },
                { icon: Heart, number: "2,500+", label: "Happy Clients" },
                { icon: Zap, number: "4.9★", label: "Avg Rating" }
              ].map((stat, i) => (
                <div key={i} className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-[#9B5DE0]/20 hover:border-[#D78FEE]/50 transition-all">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#D78FEE] mb-2 mx-auto" />
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {stat.number}
                  </div>
                  <div className="text-gray-700 text-xs sm:text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Team Members Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.id} className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden group">
                  <CardHeader className="text-center pb-3">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center text-5xl sm:text-6xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {member.avatar}
                    </div>
                    <CardTitle className="text-xl sm:text-2xl text-primary">{member.name}</CardTitle>
                    <Badge className="mx-auto mt-2 bg-muted border-2 border-[#dbc8fb] text-[#50398e]">
                      {member.role}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-gray-700 text-sm text-center">
                      {member.bio}
                    </CardDescription>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {member.specialties.map((specialty, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-[#9B5DE0]/30 text-[#50398e]">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#9B5DE0]/20">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{member.stats.projects}</div>
                        <div className="text-xs text-gray-700">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{member.stats.clients}</div>
                        <div className="text-xs text-gray-700">Clients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{member.stats.rating}★</div>
                        <div className="text-xs text-gray-700">Rating</div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-center space-x-3 pt-3">
                      <Button size="sm" variant="ghost" className="hover:text-[#D78FEE] hover:bg-[#9B5DE0]/10">
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:text-[#D78FEE] hover:bg-[#9B5DE0]/10">
                        <Instagram className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:text-[#D78FEE] hover:bg-[#9B5DE0]/10">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Join Team CTA */}
            <Card className="mt-12 sm:mt-16 bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
              <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                  Want to <span className="relative">Join Us?<div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFE66D] opacity-50 -rotate-1 -z-5"></div></span>
                </h2>
                <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Kami selalu mencari talented individuals yang passionate tentang streaming dan design
                </p>
                <Button size="lg" className="bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white">
                  <Mail className="w-5 h-5 mr-2" />
                  careers@nemuneko.studio
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Partners Section */}
      {activeTab === 'partners' && (
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
         

            {/* Featured Partners */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center text-primary">
                <Award className="w-6 h-6 mr-2 text-[#D78FEE]" />
                Featured Partners
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.filter(p => p.featured).map((partner) => (
                  <Card key={partner.id} className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden group">
                    <CardHeader className="text-center pb-3">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center text-5xl sm:text-6xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                        {partner.logo}
                      </div>
                      <CardTitle className="text-xl sm:text-2xl text-primary">{partner.name}</CardTitle>
                      <Badge className="mx-auto mt-2 bg-muted border-2 border-[#dbc8fb] text-[#50398e]">
                        {partner.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-gray-700 text-sm text-center">
                        {partner.description}
                      </CardDescription>

                      {/* Benefits */}
                      <div className="space-y-2">
                        {partner.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center text-sm text-gray-800 bg-muted/50 rounded-lg p-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D78FEE] mr-2 flex-shrink-0"></div>
                            {benefit}
                          </div>
                        ))}
                      </div>

                      <Button className="w-full bg-primary">
                        <Globe className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Partners */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center text-primary">
                <Briefcase className="w-6 h-6 mr-2 text-[#D78FEE]" />
                All Partners
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.filter(p => !p.featured).map((partner) => (
                  <Card key={partner.id} className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden group">
                    <CardHeader className="text-center pb-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                        {partner.logo}
                      </div>
                      <CardTitle className="text-xl text-primary">{partner.name}</CardTitle>
                      <Badge className="mx-auto mt-2 bg-muted border-2 border-[#dbc8fb] text-[#50398e]">
                        {partner.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-gray-700 text-sm text-center">
                        {partner.description}
                      </CardDescription>

                      {/* Benefits */}
                      <div className="space-y-2">
                        {partner.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center text-sm text-gray-800 bg-muted/50 rounded-lg p-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D78FEE] mr-2 flex-shrink-0"></div>
                            {benefit}
                          </div>
                        ))}
                      </div>

                      <Button className="w-full bg-primary">
                        <Globe className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Partnership CTA */}
            <Card className="mt-12 sm:mt-16 bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
              <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                  Become a <span className="relative">Partner</span>
                </h2>
                <p className="text-gray-800 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Interested in partnering dengan Nemuneko Studio? Let's collaborate dan grow together!
                </p>
                <Button size="lg" className="bg-primary rounded-full py-5 px-10  text-white">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Partnership Team
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Twitter, Instagram, Mail, Globe, Users, Award, Heart, Briefcase, Code, Palette, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { getAllTeams } from '@/action/teams';
import { ITeams } from '@/interface';
import { toast } from 'sonner';

export default function Teams() {
  const [activeTab, setActiveTab] = useState('team');
  const [teamMembers, setTeamMembers] = useState<ITeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await getAllTeams();
        
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to fetch team members');
        }
        
        setTeamMembers(response.data || []);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        toast.error(error.message || 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Calculate team stats from database
  const teamStats = {
    totalMembers: teamMembers.length,
    totalProjects: teamMembers.reduce((sum, member) => {
      const projects = parseInt(member.projects || '0' as any);
      return sum + (isNaN(projects) ? 0 : projects);
    }, 0),
    // You can calculate these from additional fields if needed
    totalClients: teamMembers.length * 350, // Estimated
    avgRating: 4.9
  };

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
                { icon: Users, number: teamStats.totalMembers.toString(), label: "Team Members" },
                { icon: Award, number: teamStats.totalProjects > 0 ? `${teamStats.totalProjects}+` : "0", label: "Projects Done" },
                { icon: Heart, number: `${teamStats.totalClients}+`, label: "Happy Clients" },
                { icon: Zap, number: `${teamStats.avgRating}★`, label: "Avg Rating" }
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

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#9B5DE0] animate-spin mb-4" />
                <p className="text-gray-600">Loading team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Team Members Yet</h3>
                <p className="text-gray-600">Team members will appear here once added.</p>
              </div>
            ) : (
              /* Team Members Grid */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden group">
                    <CardHeader className="text-center pb-3">
                      {/* Photo */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                        {member.photo_url ? (
                          <img 
                            src={member.photo_url} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-5xl sm:text-6xl">
                            👤
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl sm:text-2xl text-primary">{member.name}</CardTitle>
                      <Badge className="mx-auto mt-2 bg-muted border-2 border-[#dbc8fb] text-[#50398e]">
                        {member.position}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Bio/Description */}
                      {member.descriptions && (
                        <CardDescription className="text-gray-700 text-sm text-center">
                          {member.descriptions}
                        </CardDescription>
                      )}

                      {/* Skills/Specialties */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {member.skills.slice(0, 5).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-[#9B5DE0]/30 text-[#50398e]">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs border-[#9B5DE0]/30 text-[#50398e]">
                              +{member.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Projects Count */}
                      {member.projects && (
                        <div className="pt-3 border-t border-[#9B5DE0]/20">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{member.projects}</div>
                            <div className="text-xs text-gray-700">Projects Completed</div>
                          </div>
                        </div>
                      )}

                      {/* Social Links Placeholder */}
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
            )}

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
                <Button size="lg" className="bg-primary rounded-full py-5 px-10 text-white">
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
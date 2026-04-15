"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Twitter, Instagram, Mail, Globe, Users, Award, Heart, Briefcase, Code, Palette, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { getAllTeams } from '@/action/teams';
import { ITeams } from '@/interface';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TeamsCard from '@/components/teams-card';
import { motion, useInView, Variants } from 'framer-motion';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import Image from 'next/image';
export default function Teams() {
  const [activeTab, setActiveTab] = useState('team');
  const [teamMembers, setTeamMembers] = useState<ITeams[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

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
    totalClients: "12", // Estimated
    avgRating: 4.9
  };

  const partners = [
    {
      id: 1,
      name: "StreamLabs",
      logo: "🎮",
      type: "Platform Partner",
      description: "Official integration partner untuk streaming platform terkemuka Kompatibilitas penuh dengan OBS Studio untuk seamless integration Partnership untuk custom widget development dan integrations",
      benefits: ["Direct Integration", "Premium Support", "Early Access"],
      flex: true
    },
     {
      id: 2,
      name: "StreamElements",
      logo: "⚡",
      type: "Platform Partner",
      description: "Official integration partner untuk streaming platform terkemuka Kompatibilitas penuh dengan OBS Studio untuk seamless integration Partnership untuk custom widget development dan integrations",
      benefits: ["Custom Widgets", "Priority Support", "Revenue Share"],
      flex: false
    },
    {
      id: 3,
      name: "OBS Studio",
      logo: "📹",
      type: "Technology Partner",
      description: "Official integration partner untuk streaming platform terkemuka Kompatibilitas penuh dengan OBS Studio untuk seamless integration Partnership untuk custom widget development dan integrations",
      benefits: ["Full Compatibility", "Plugin Support", "Documentation"],
      flex: true
    },
    {
      id: 4,
      name: "Twitch",
      logo: "💜",
      type: "Platform Partner",
      description: "Official integration partner untuk streaming platform terkemuka Kompatibilitas penuh dengan OBS Studio untuk seamless integration Partnership untuk custom widget development dan integrations",
      benefits: ["Extension Support", "API Access", "flex Status"],
      flex: false
    },
   
    
  ];
  const handleClick = (teamsId: string) => {
    router.push(`/teams/${teamsId}`)
  };
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 bg-gradient-to-t from-white to-transparent">
        <div className="container mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex gap-5  w-full mb-4 mt-15 justify-center">
              <Textstyle Title="TEAM" className="text-4xl sm:text-7xl w-full " color="text-purple" />
              <Textstyle Title="AND" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
              <Textstylegreen Title="PARTNER" className="text-4xl sm:text-7xl w-full" color="text-green" />
            </div>
          </motion.div>
          <div className=" max-w-3xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="text-lg md:text-xl  arial"
            >
              Nemuneko Studio is house of creativity, full of talented artist and partners 
            </motion.p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => setActiveTab('team')}
              className={
                activeTab === 'team'
                  ? "bg-primary text-white rounded-full"
                  : "bg-background border border-2 border-primary text-primary rounded-full hover:bg-muted cursor-pointer"
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
                  ? "bg-primary text-white rounded-full"
                  : "bg-background border border-2 border-primary rounded-full text-primary hover:bg-muted cursor-pointer"
              }
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Partners
            </Button>
          </div>
        </div>

        {activeTab === 'team' && (

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-15 my-12 mt-25 sm:mb-16 max-w-7xl mx-auto">
            {[
              { icon: Users, number: teamStats.totalMembers.toString(), label: "Team Members" },
              { icon: Award, number: "12", label: "Partner VArtist" },
              { icon: Heart, number: `${teamStats.totalClients}k+`, label: "Satisfied Customers" },
              { icon: Zap, number: `${teamStats.avgRating}★`, label: "Average Rating" }
            ].map((stat, i) => (
              <div key={i} className=" relative py-10 pt-20 text-arial px-10  rounded-xl stats transition-all">
                <div className="rotate-5">
                  <div className="text-2xl sm:text-7xl  font-bold text-primary">
                    {stat.number}
                  </div>
                  <div className="text-gray-700 text-xl max-w-[50px] mt-1 text-primary">{stat.label}</div>
                </div>

              </div>

            ))}
          </div>

        )}
      </section>
      {activeTab === 'team' && (
        <hr className='bg-primary/50 p-[0.3px] ' />
      )}
      {/* Team Section */}
      {activeTab === 'team' && (
        <section className="pb-20 sm:px-6 relative bg-gradient-to-b from-white to-transparent" >
          <div className="container mx-auto py-20">
            {/* Team Stats */}



            <div className="pt-10">

              <TeamsCard />
            </div>



          </div>
        </section>
      )}

      {/* Partners Section */}
      {activeTab === 'partners' && (
        <section className="pb-20 px-4 sm:px-6 bg-gradient-to-b from-white via-transparent to-white">
          <div className="container max-w-5xl mx-auto">
            {/* Featured Partners */}
            <div className="mb-12">

              <div className="flex flex-col  gap-15">
            {partners.map((partner, index) => (
  <div key={partner.id} className="relative max-w-6xl mb-10">
    
    {/* Card */}
    <Card className={`bg-muted/50 backdrop-blur-sm rounded-[50px] ${index % 2 === 0 ? "pl-70" : "pr-70"}`}>
      <div className={`flex ${index % 2 === 0 ? "" : "flex-row-reverse"} items-center`}>
        <CardContent className="space-y-4 flex-1 px-10 py-3">
          <CardTitle className="arial text-2xl">
            {partner.name}
          </CardTitle>
          <CardDescription className="text-arial text-lg">
            {partner.description}
          </CardDescription>
          <Button className="rounded-full bg-primary px-10 mt-5 text-font-arial text-white">
            Learn More
          </Button>
        </CardContent>
      </div>
    </Card>

    {/* Image keluar dari card */}
    <div className={`absolute bottom-[-175px] ${index % 2 === 0 ? "-left-20" : "-right-20"} w-[500px] h-[500px] clip-image`}>
      <Image
        src="/images/airi.png"
        alt={partner.name}
        fill
        className="object-contain drop-shadow-xl"
      />
    </div>

  </div>
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
  )
}
    </div >
  );
}
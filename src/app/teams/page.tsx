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
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 ">
        <div className="container mx-auto  max-w-7xl">
          <div className="flex flex-co text-center  w-full my-20">
            <h1 className="text-4xl sm:text-6xl  w-full text-primary leading-5 " >MEET OUR <span className='bg-title'>TEAMS</span></h1>
          </div>
           <TeamsCard/>
        </div>
      </section>
    </div >
  );
}
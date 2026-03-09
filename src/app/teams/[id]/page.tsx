"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Star,
  Mail,
  Twitter,
  Instagram,
  Globe,
  Briefcase,
  Check,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTeamById } from "@/action/teams";
import { ITeams } from "@/interface";
import { Textstyle } from "@/components/font-design";
import { motion, useInView, Variants } from 'framer-motion';

export default function TeamProfile() {
  const [member, setMember] = useState<ITeams | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const memberId = params?.id as string;

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) return;
      try {
        setLoading(true);
        const result = await getTeamById(memberId);
        if (result.success && result.data) {
          setMember(result.data);
        }
      } catch (error) {
        console.error("Error fetching team member:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-bold text-muted-foreground mb-2">
            Member not found
          </h3>
          <Link href="/teams">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Briefcase, label: "Projects", value: member.projects ?? "0" },
    { icon: Users, label: "Clients", value: "350+" },
    { icon: Star, label: "Rating", value: "4.9" },
  ];

  const perks = [
    "Available for collaboration",
    "Quick response time",
    "Professional delivery",
    "Revision included",
  ];

  return (
    <div className="min-h-screen mt-20 w-full mx-auto max-w-7xl">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 ">

        {/* Back Button */}
        <Link
          href="/teams"
          className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            <Card className="bg-muted/30 border-0 shadow-lg relative mt-10">
              <CardContent className="p-6 sm:p-8">

          

                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
                  className="flex gap-5 justify-center md:justify-start absolute -top-7"
                >
                  <Textstyle Title={member.name} className='sm:text-7xl text-6xl w-full' color='text-purple' />
                
                </motion.div>

      {/* Position badge */}
                <Badge className="mb-4 px-4 py-1.5 rounded-full text-sm font-semibold  absolute top-5 right-5">
                  {member.position}
                </Badge>



                {/* Description */}
                {member.descriptions && (
                  <p className="text-muted-foreground leading-relaxed text-md sm:text-base mb-6 mt-6 text-arial text-primary">
                    {member.descriptions}
                  </p>
                )}



              </CardContent>
            </Card>



            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <Card className="bg-muted/30 border-0 shadow-md">
                <CardContent className="p-6 sm:p-8">
                  <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Row */}
            {member.projects && (
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                  <Card key={i} className="border-2 border-border shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-primary leading-tight">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Column (Sticky) ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {member.photo_url ? (
                <div className="relative  w-full overflow-hidden">
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-[4/3] w-full bg-muted flex flex-col items-center justify-center gap-4">
                  <div className="w-28 h-28 rounded-full bg-white border-0 border-4 border-border flex items-center justify-center">
                    <Users className="w-14 h-14 " />
                  </div>
                  <span className="text-sm ">No photo available</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* What I Offer */}
        <Card className="mt-10 border-2 border-border shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <h4 className="text-xl font-bold text-foreground mb-4">What I Offer:</h4>
            <ul className="space-y-3">
              {[
                "High-quality creative assets ready to use",
                "Complete source files & documentation",
                "Responsive support via Discord",
                "Custom requests & revisions available",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen mt-20">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Skeleton className="h-5 w-28 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Left skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full aspect-[4/3] rounded-xl" />
            <Card className="border-2 border-border">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <div className="flex flex-wrap gap-2">
                  {[80, 100, 70, 120, 90, 85].map((w, i) => (
                    <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-2 border-border">
                  <CardContent className="p-5 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right skeleton */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-border">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
                <div className="space-y-2 pt-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-12 w-full rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
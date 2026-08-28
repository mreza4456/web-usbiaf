"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost, ICategory, IImageCategories, IProduct, ITeams } from '@/interface';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { SkeletonBlog } from './skeleton-card';
import { getAllCategories } from '@/action/categories';
import { getAllProducts } from '@/action/product';
import { Textstyle, TextstyleEliane, TextstyleElianeGreen } from './font-design';
import { getAllTeams } from '@/action/teams';
import { useRouter } from 'next/navigation';
import { start } from 'repl';

export default function TeamsCard() {

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [teams, setTeams] = useState<ITeams[]>([]);
    const router = useRouter();
    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch teams
                const teamsResult = await getAllTeams();
                console.log('teams Result:', teamsResult); // Debug log
                if (teamsResult.success) {
                    setTeams(teamsResult.data as any);
                }


            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    // Tambahkan ini SEBELUM return statement
    const filteredTeams = teams.filter((teams) =>
        teams.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
     const handleClick = (teamsId:string) => {
    router.push(`/teams/${teamsId}`)
  };
    return (

        <div className="relative z-10">

            {loading ? (
                <SkeletonBlog cardcount={4} />
            ) : filteredTeams.length === 0 ? (
                <div className='flex justify-center itenms-center text-gray-300'>Not Found</div>
            ) : (
                <div className="grid lg:grid-cols-3 grid-cols-2 gap-8">
                    {teams.map((stat, i) => (
                        <div className='relative  w-full' key={i} onClick={() => handleClick(stat.id)}>
                     
                                        <img src={stat.photo_url} className=' aspect-square w-full' alt="" />
<div className='absolute bottom-12 bg-primary text-[#E1C5FF] rounded-xl flex justify-between items-center gap-5 py-3 px-5 w-[90%] left-1/2 -translate-x-1/2'>
    <h1>{stat.position}</h1>
    <img src="/icon/SVG/iconteams.svg" className='w-5' alt="" />
</div>
                                            <h1  className=' text-3xl text-center w-full mt-4 text-primary'  >{stat.name}</h1>
                 
                        </div>
                    ))}

                </div>
            )}
            </div>
        )
    
            
}
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
                <div className="grid lg:grid-cols-4 grid-cols-2 gap-8">
                    {teams.map((stat, i) => (
                        <div className='relative aspect-[2/3] w-full ' key={i} onClick={() => handleClick(stat.id)}>
                            <div className='absolute inset-0 translate-y-2 bg-[#f99c08] rounded-[40px] border-3 border-[#ad4512] z-0'></div>

                            <div className='relative z-10 h-full bg-[#faca06] border-3 rounded-[40px] border-[#ad4512] p-4 '>
                                <div className=''>
                                    <div className="h-1/2 w-8 absolute bottom-0 left-[30%] bg-[#fff8dc] -z-1 -skew-x-20"></div>
                                    <div className="h-1/2 w-15 absolute bottom-0 md:left-[45%] left-[50%]   bg-[#fff8dc] -z-1 -skew-x-20"></div>
                                </div>
                                <div className="w-full h-full bg-gradient-to-r rounded-[30px] from-[#493977] relative to-[#6b53ac] p-2 border-3 border-[#ad4512] shadow-box1 z-20">
                                    <div className="bg-gradient-to-t from-[#4c3b7c]  to-transparent absolute rounded-[25px] bottom-0 left-0  z-10 w-full h-2/3"></div>
                                    <div className="w-full h-full bg-gradient-to-r relative rounded-[25px] from-[#6b53ac] to-[#493977]">
                                        <img src={stat.photo_url} className='absolute top-[-15%] left-1/2 -translate-x-1/2 md:w-[95%]' alt="" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                                            <Textstyle Title={stat.name} className=' text-5xl w-full mb-4' color='text-purple' />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            )}
            </div>
        )
    
            
}
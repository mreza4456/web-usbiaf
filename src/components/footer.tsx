"use client";


import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon, Sparkles } from "lucide-react"
import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { getAllCategories } from "@/action/categories";
import { useRouter } from "next/navigation";
import { ICategory } from "@/interface";
import Image from "next/image";

export default function Footer() {
 const router = useRouter();
    const [categories, setCategories] = useState<ICategory[]>([]);
 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
   
             const fetchCategories = async () => {
                try {
                    const result = await getAllCategories();
    
                    if (result.success && Array.isArray(result.data)) {
                        setCategories(result.data);
                    } else {
                        console.error('Failed to fetch categories:', result.message);
                        setCategories([]);
                        setError(result.message || 'Failed to load categories');
                    }
                } catch (error) {
                    console.error('Failed to fetch categories:', error);
                    setCategories([]);
                    setError('Failed to load categories');
                } finally {
                    setLoading(false);
                }
            };
        React.useEffect(() => {
            fetchCategories();
        }, []);

    return (
        <footer className="py-12 mt-50 px-6 bg-[#e6dcff] border-t border-[#9B5DE0]/20 ">
            <div className="container mx-auto text-arial">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                       <Image src="/images/logonav.png" width={100} height={50} className="w-1/2 mb-5" alt="" />
                        <p className="text-primary/50 text-sm">
                            Premium stream widgets & overlays for content creators
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Services</h4>
                        <ul className="space-y-2 text-primary/50 text-sm grid md:grid-cols-2">
                            {categories.map((category)=>(
                            <li key={category.id} ><a href={`/service/detail/${category.id}`} className="hover:text-[#D78FEE] transition-colors">{category.name}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Company</h4>
                        <ul className="space-y-2 text-primary/50 text-sm">
                            <li><a href="/teams" className="hover:text-[#D78FEE] transition-colors">About Us</a></li>
                            <li><a href="/contact" className="hover:text-[#D78FEE] transition-colors">Contact</a></li>
                            <li><a href="/projects" className="hover:text-[#D78FEE] transition-colors">Our Projects</a></li>
                            <li><a href="/blog" className="hover:text-[#D78FEE] transition-colors">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Connect</h4>
                        <ul className="space-y-2 text-primary/50 text-sm">
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Twitter</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Instagram</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Discord</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-[#9B5DE0]/20 pt-8 text-center text-primary/50 text-sm">
                    © 2025 Nemuneko Studio. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
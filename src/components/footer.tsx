"use client";

import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon, Sparkles } from "lucide-react"

import { Button } from "./ui/button";

export default function Footer() {


    return (
        <footer className="py-12 mt-50 px-6 bg-muted/50 border-t border-[#9B5DE0]/20">
            <div className="container mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold text-primary">
                                Nemuneko <span className="text-secondary">Studio</span> 
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Premium stream widgets & overlays for content creators
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Services</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Stream Widgets</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Custom Overlays</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Animations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Company</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-primary">Connect</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Twitter</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Instagram</a></li>
                            <li><a href="#" className="hover:text-[#D78FEE] transition-colors">Discord</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-[#9B5DE0]/20 pt-8 text-center text-gray-400 text-sm">
                    © 2025 Nemuneko Studio. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
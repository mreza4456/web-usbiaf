"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/auth";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Chrome,
    Twitch,
} from "lucide-react";


import { supabase } from '@/config/supabase';


type LoginFormValues = {
    email: string;
    password: string;
    remember: boolean;
};


export default function Login(): React.ReactElement {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { user} = useAuthStore();

    const loginForm = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    });


    useEffect(() => {
        if (user) {
            router.replace("/");
        }
    }, [user, router]);


    const handleLogin = async (): Promise<void> => {
        const values = loginForm.getValues();

        const emailError = !values.email
            ? "Email is required"
            : !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                ? "Invalid email"
                : null;

        const passwordError = !values.password
            ? "Password is required"
            : values.password.length < 6
                ? "Password must be at least 6 characters"
                : null;

        if (emailError || passwordError) {
            setError(emailError || passwordError || "");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const { error: authError } =
                await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });

            if (authError) throw authError;

            setSuccess("Login successful!");
            router.replace('/');
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to sign in");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOAuthLogin = async (
        provider: "twitch" | "google"
    ): Promise<void> => {
        setError("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (error) throw error;
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Failed to sign in with ${provider}`
            );
        }
    };

   

    const handleKeyPress = (
        e: React.KeyboardEvent<HTMLInputElement>
    ): void => {
        if (e.key === "Enter") {
            void handleLogin();
        }
    };

    /* ------------------------------------------------------------------------ */
    /*                                   UI                                     */
    /* ------------------------------------------------------------------------ */

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-white flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#9B5DE0] rounded-full blur-[120px] opacity-30 animate-pulse" />
                <div
                    className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-[#D78FEE] rounded-full blur-[100px] opacity-25 animate-pulse"
                    style={{ animationDelay: "2s" }}
                />
                <div
                    className="absolute top-[50%] left-[50%] w-[350px] h-[350px] bg-[#4E56C0] rounded-full blur-[90px] opacity-20 animate-pulse"
                    style={{ animationDelay: "4s" }}
                />
            </div> 

            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-white/5 backdrop-blur-sm border-[#9B5DE0]/30">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white">
                            Sign In
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {error && (
                            <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="flex items-center text-sm text-gray-300">
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="hello@example.com"
                                {...loginForm.register("email")}
                                onKeyPress={handleKeyPress}
                                className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="flex items-center text-sm text-gray-300">
                                <Lock className="w-4 h-4 mr-2" />
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...loginForm.register("password")}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={handleLogin}
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE]"
                        >
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => handleOAuthLogin("twitch")}
                                className="bg-white/5 border border-[#9B5DE0]/30"
                            >
                                <Twitch className="w-5 h-5 mr-2" />
                                Twitch
                            </Button>
                            <Button
                                onClick={() => handleOAuthLogin("google")}
                                className="bg-white/5 border border-[#9B5DE0]/30"
                            >
                                <Chrome className="w-5 h-5 mr-2" />
                                Google
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/register" className="text-[#D78FEE]">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}

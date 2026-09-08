"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Chrome, Twitch } from "lucide-react";
import { supabase } from '@/config/supabase';

import Live2DWidget from "@/components/live2d-widget";
import { useMediaQuery } from "@/hooks/use-media-query";
import Image from "next/image";
import { CardAuth, CardSecondary } from "@/components/card-dashed";
import { Checkbox } from "@/components/ui/checkbox";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

// X (x) doesn't have an official lucide-react icon anymore since the rebrand,
// so we use a small inline SVG that matches the current X logo.
function XIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Login(): React.ReactElement {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loginForm = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // Check if already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Always redirect to home, let home page handle the modal
          router.replace('/');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (data?.user) {
        setSuccess("Login successful! Redirecting...");


        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // "x" is Supabase's provider key for X login (the provider was renamed
  // in the dashboard/UI, but the API key is still "x").
  const handleOAuthLogin = async (
    provider: "twitch" | "google" | "x"
  ): Promise<void> => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : `Failed to sign in with ${provider}`
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      void handleLogin();
    }
  };
  const isDesktop = useMediaQuery("(min-width: 640px)")
  return (
    <div className="min-h-screen bg-radial from-transparent to-white text-primary flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-4xl  mx-auto">
        <img src="/images/logonav.webp" alt="Logo" className="md:w-1/2 w-3/4 mx-auto mb-5" width={200} height={100} />
        <CardAuth variant="signin" className="mx-4">
          <Card className="bg-white shadow-none sm:border-primary/30 grid sm:grid-cols-2 sm:shadow-lg rounded-4xl">
            {isDesktop && (
              <div className="relative  overflow-hidden -mt-15">

                <div className="bg-gradient-to-t from-white via-transparent to-transparent absolute inset-0 z-1"></div>

                <Live2DWidget modelPath="/NemunekoChibiRIG/Nemuneko Live 2D.model3.json" />
              </div>
            )}
            <div className="py-6 sm:pr-5 ">

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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xl text-primary text-lilita flex items-center gap-2">
                      <img src="/icon/SVG/inboxicon.svg" className="w-6 h-6" alt="" />
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Enter Email"
                      onKeyDown={handleKeyPress}
                      {...loginForm.register("email")}
                      className="w-full px-5 py-2.5 bg-muted/50 text-fredoka p-2 px-4 text-primary rounded-full border-2 border-primary disabled:opacity-60 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xl text-primary text-lilita flex items-center gap-2">
                      <img src="/icon/SVG/lockicon.svg" className="w-6 h-6" alt="" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Password"
                        onKeyDown={handleKeyPress}
                        {...loginForm.register("password")}
                        className="w-full px-5 py-2.5 bg-muted/50 text-fredoka p-2 px-4 text-primary rounded-full border-2 border-primary disabled:opacity-60 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-primary" />
                        ) : (
                          <Eye className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center text-primary text-fredoka font-semibold">
                      <Checkbox className="text-primary border-2  border-primary rounded-sm" /> Remember Me
                    </div>
                    <Link
                      href="/auth/forgot-password"
                      className="text-primary text-sm hover:text-[#FDCFFA] underline transition-colors font-medium my-3"
                    >
                      Forgot <b>Password</b> ?
                    </Link>

                  </div>


                  <Button
                    onClick={() => void handleLogin()}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-6 text-lg rounded-full"
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#9B5DE0]/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-primary text-fredoka ">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-3">
                    <Button
                      type="button"
                      onClick={() => void handleOAuthLogin("google")}
                      className="bg-white/5 border border-primary border-2 text-primary hover:bg-muted rounded-lg shadow-login cursor-pointer transition-colors w-full py-5"
                      aria-label="Sign in with Google"
                    >
                      <Chrome className="w-5 h-5" />
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleOAuthLogin("twitch")}
                      className="bg-white/5 border border-primary border-2 text-primary hover:bg-muted rounded-lg shadow-login cursor-pointer transition-colors w-full py-5"
                      aria-label="Sign in with Twitch"
                    >
                      <Twitch className="w-5 h-5" />
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleOAuthLogin("x")}
                      className="bg-white/5 border border-primary border-2 text-primary hover:bg-muted rounded-lg shadow-login cursor-pointer transition-colors w-full py-5"
                      aria-label="Sign in with X"
                    >
                      <XIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="mt-7 bg-primary rounded-full py-2 text-white text-center text-sm text-gray-400">
                    <p>
                      Don't have an account?{" "}
                      <Link
                        href="/auth/register"
                        className="text-muted underline  hover:text-[#FDCFFA] transition-colors font-medium"
                      >
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>

            </div >
          </Card>
        </CardAuth>


        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors inline-flex items-center"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>

  );
}
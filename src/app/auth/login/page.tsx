"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Chrome } from "lucide-react";
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

  // Check if user needs to complete social media setup (no longer needed)
  const checkSocialMediaStatus = async (userId: string): Promise<boolean> => {
    // This function is no longer used
    return false;
  };

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
        
        // Always redirect to home, let home page handle the social media modal
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-primary flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-background border-[#9B5DE0]/30">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-primary">Sign In</CardTitle>
            <CardDescription className="text-gray-500">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  onKeyDown={handleKeyPress}
                  {...loginForm.register("email")}
                  className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-500 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    onKeyDown={handleKeyPress}
                    {...loginForm.register("password")}
                    className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
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
                onClick={() => void handleLogin()}
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-6"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#9B5DE0]/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  onClick={() => void handleOAuthLogin("google")}
                  className="bg-white/5 border border-primary border-2 text-primary"
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Google
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
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
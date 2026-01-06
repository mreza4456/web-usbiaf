"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ForgotPassword(): React.ReactElement {
    const [step, setStep] = useState<'email' | 'success'>('email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();

    const emailForm = useForm({
        defaultValues: {
            email: ''
        }
    });

    const handleSendResetEmail = async (values: any) => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            });

            if (resetError) throw resetError;

            setUserEmail(values.email);
            setStep('success');
            setSuccess('Password reset link has been sent to your email!');
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to send reset email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                {/* Animated Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#9B5DE0] rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-[#D78FEE] rounded-full blur-[100px] opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                            <p className="text-gray-300">
                                We've sent a password reset link to<br />
                                <span className="font-semibold text-[#D78FEE]">{userEmail}</span>
                            </p>
                            <p className="text-sm text-gray-400 pt-4">
                                Click the link in the email to reset your password. The link will expire in 1 hour.
                            </p>
                        </div>

                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white py-3"
                            >
                                Back to Login
                            </Button>
                            
                            <button
                                onClick={() => setStep('email')}
                                className="w-full text-sm text-gray-400 hover:text-[#D78FEE] transition-colors"
                            >
                                Didn't receive the email? Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-white flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#9B5DE0] rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-[#D78FEE] rounded-full blur-[100px] opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[50%] left-[50%] w-[350px] h-[350px] bg-[#4E56C0] rounded-full blur-[90px] opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-white/5 backdrop-blur-sm border-[#9B5DE0]/30">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-full flex items-center justify-center">
                                <KeyRound className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-white text-center">
                            Forgot Password?
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-center">
                            No worries, we'll send you reset instructions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300 flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="hello@example.com"
                                    {...emailForm.register('email', {
                                        required: 'Email is required',
                                        pattern: { 
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                                            message: 'Invalid email address' 
                                        }
                                    })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                                />
                                {emailForm.formState.errors.email && (
                                    <p className="text-sm text-red-400 flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {emailForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={() => void emailForm.handleSubmit(handleSendResetEmail)()}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white py-6"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="mt-6 text-center">
                    <Link 
                        href="/auth/login"
                        className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors inline-flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                    <a
                        href="/"
                        className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors"
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}
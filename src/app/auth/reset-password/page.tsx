"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Loading fallback component
function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B5DE0]"></div>
                    </div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        </div>
    );
}

// Main component that uses useSearchParams
function ResetPasswordContent(): React.ReactElement {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const resetForm = useForm({
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    useEffect(() => {
        // Check if user came from email link with access token
        checkSession();

        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidToken(true);
            }
        });

        const subscription = data?.subscription;
        return () => subscription?.unsubscribe();
    }, []);

    const checkSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                setIsValidToken(false);
                setError('Invalid or expired reset link. Please request a new one.');
                return;
            }

            if (data.session) {
                setIsValidToken(true);
            } else {
                // Check if there's a recovery token in the URL
                const accessToken = searchParams?.get('access_token');
                const type = searchParams?.get('type');
                
                if (accessToken && type === 'recovery') {
                    setIsValidToken(true);
                } else {
                    setIsValidToken(false);
                    setError('Invalid or expired reset link. Please request a new one.');
                }
            }
        } catch (err) {
            setIsValidToken(false);
            setError('Something went wrong. Please try again.');
        }
    };

    const handleResetPassword = async (values: any) => {
        setError('');
        setSuccess('');

        // Validate passwords match
        if (values.password !== values.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: values.password
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully! Redirecting to login...');
            
            // Sign out user and redirect to login
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/auth/login');
            }, 2000);

        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to reset password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state while checking token
    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B5DE0]"></div>
                        </div>
                        <p className="text-gray-600">Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                {/* Animated Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#9B5DE0] rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-[#D78FEE] rounded-full blur-[100px] opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-primary">Link Expired</h2>
                            <p className="text-gray-600">
                                {error || 'This password reset link is invalid or has expired.'}
                            </p>
                        </div>

                        <Button
                            onClick={() => router.push('/auth/forgot-password')}
                            className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-primary py-3"
                        >
                            Request New Link
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
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
                                <CheckCircle2 className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-primary">Password Reset Successfully!</h2>
                            <p className="text-gray-600">{success}</p>
                        </div>

                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE0]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-primary flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-white/5 backdrop-blur-sm border-[#9B5DE0]/30">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-primary text-center">
                            Reset Your Password
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-center">
                            Enter your new password below
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

                        <div className="space-y-4">
                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-600 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...resetForm.register('password', {
                                            required: 'Password is required',
                                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                            pattern: { 
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
                                                message: 'Password must contain uppercase, lowercase and number' 
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {resetForm.formState.errors.password && (
                                    <p className="text-sm text-red-400 flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {resetForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-600 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...resetForm.register('confirmPassword', { 
                                            required: 'Please confirm your password' 
                                        })}
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {resetForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-400 flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {resetForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-white/5 border border-[#9B5DE0]/20 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-2">Password must contain:</p>
                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li className="flex items-center">
                                        <span className="w-1 h-1 bg-[#D78FEE] rounded-full mr-2"></span>
                                        At least 8 characters
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-1 h-1 bg-[#D78FEE] rounded-full mr-2"></span>
                                        One uppercase letter
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-1 h-1 bg-[#D78FEE] rounded-full mr-2"></span>
                                        One lowercase letter
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-1 h-1 bg-[#D78FEE] rounded-full mr-2"></span>
                                        One number
                                    </li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={() => void resetForm.handleSubmit(handleResetPassword)()}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-6"
                            >
                                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="text-sm text-gray-500 hover:text-[#D78FEE] transition-colors"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

// Wrapper component with Suspense
export default function ResetPassword(): React.ReactElement {
    return (
        <Suspense fallback={<LoadingState />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
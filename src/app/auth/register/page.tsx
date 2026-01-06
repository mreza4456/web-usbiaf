"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Github, Chrome, AudioLines, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Register(): React.ReactElement {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [userEmail, setUserEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();

    const registerForm = useForm({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false
        }
    });

    useEffect(() => {
        checkUser();

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            
            if (event === 'SIGNED_IN') {
                setSuccess('Successfully signed in!');
                // Check if user is verified
                if (session?.user?.email_confirmed_at) {
                    setIsVerified(true);
                    // Redirect to home after 2 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                }
            }
        });

        const subscription = data?.subscription;
        return () => subscription?.unsubscribe();
    }, [router]);

    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        const currentUser = data?.user ?? null;
        setUser(currentUser);
        
        // Check if user is already verified
        if (currentUser?.email_confirmed_at) {
            setIsVerified(true);
            // Redirect to home immediately
            router.push('/');
        }
    };

    const handleRegister = async (values: any) => {
        setError('');
        setSuccess('');

        // basic validation
        if (values.password !== values.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        fullName: values.fullName
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (signUpData?.user) {
                // Check if email is already confirmed (auto-confirm enabled)
                if (signUpData.user.email_confirmed_at) {
                    setSuccess('Account created and signed in successfully. Redirecting to home...');
                    setIsVerified(true);
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                } else {
                    // Show OTP input for email verification
                    setUserEmail(values.email);
                    setShowOtpInput(true);
                    setSuccess('Verification code sent to your email. Please check your inbox.');
                    setUser(signUpData.user);
                }
            } else {
                setSuccess('Account created. Please check your email to confirm your account.');
            }

            registerForm.reset();
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError(String(err) || 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email: userEmail,
                token: otpCode,
                type: 'email'
            });

            if (verifyError) throw verifyError;

            if (data?.user) {
                setSuccess('Email verified successfully! Redirecting to home...');
                setIsVerified(true);
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Invalid verification code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            const firstInput = document.getElementById('otp-0');
            firstInput?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setIsSubmitting(true);

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: userEmail
            });

            if (resendError) throw resendError;

            setSuccess('New verification code sent to your email!');
            setOtp(['', '', '', '', '', '']);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to resend code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = () => {
        router.push("/auth/login");
    };

    // Show success message if verified
    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
                        <p className="text-gray-300">Your email has been verified successfully. Redirecting to home...</p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE0]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show OTP input screen
    if (showOtpInput && user && !isVerified) {
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
                            <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
                            <p className="text-gray-300">
                                We've sent a 6-digit code to<br />
                                <span className="font-semibold text-[#D78FEE]">{userEmail}</span>
                            </p>
                        </div>

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

                        {/* OTP Input */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-[#9B5DE0]/30 rounded-lg text-white focus:outline-none focus:border-[#D78FEE] transition-all"
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <Button
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otp.join('').length !== 6}
                            className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white py-3 disabled:opacity-50"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify Email'}
                        </Button>

                        {/* Resend Code */}
                        <div className="text-sm text-gray-400">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResendOtp}
                                disabled={isSubmitting}
                                className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors font-medium disabled:opacity-50"
                            >
                                Resend Code
                            </button>
                        </div>

                        {/* Back to Login */}
                        <button
                            onClick={handleLogin}
                            className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
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
                            <CardTitle className="text-2xl text-white">
                                Create New Account
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Fill in the information below to get started
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error Alert */}
                            {error && (
                                <Alert className="mb-4 bg-red-500/10 border-red-500/50 text-red-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="mb-4 bg-green-500/10 border-green-500/50 text-green-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300 flex items-center">
                                        <User className="w-4 h-4 mr-2" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        {...registerForm.register('fullName', {
                                            required: 'Full name is required',
                                            minLength: { value: 3, message: 'Name must be at least 3 characters' }
                                        })}
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                                    />
                                    {registerForm.formState.errors.fullName && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {registerForm.formState.errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300 flex items-center">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="hello@example.com"
                                        {...registerForm.register('email', {
                                            required: 'Email is required',
                                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                                        })}
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                                    />
                                    {registerForm.formState.errors.email && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {registerForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300 flex items-center">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            {...registerForm.register('password', {
                                                required: 'Password is required',
                                                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Password must contain uppercase, lowercase and number' }
                                            })}
                                            className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {registerForm.formState.errors.password && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {registerForm.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300 flex items-center">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                                            className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {registerForm.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {registerForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Terms Agreement */}
                                <label className="flex items-start space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...registerForm.register('agreeTerms', { required: 'You must agree to the terms' })}
                                        className="w-4 h-4 mt-0.5 rounded border-[#9B5DE0]/30 bg-white/5 text-[#D78FEE] focus:ring-[#D78FEE] focus:ring-offset-0"
                                    />
                                    <span className="text-sm text-gray-300">
                                        I agree to the{' '}
                                        <a href="#" className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors">Terms of Service</a>{' '}
                                        and{' '}
                                        <a href="#" className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors">Privacy Policy</a>
                                    </span>
                                </label>

                                {/* Submit Button */}
                                <Button
                                    onClick={() => void registerForm.handleSubmit(handleRegister)()}
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white py-6"
                                >
                                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Links */}
                    <div className="mt-6 text-center text-sm text-gray-400">
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/login"
                                className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors font-medium"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-4 text-center">
                        <a
                            href="/"
                            className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors inline-flex items-center"
                        >
                            ← Back to Home
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
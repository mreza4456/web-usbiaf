"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
            full_name: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false
        }
    });

    useEffect(() => {
        // Tidak perlu cek user di register page
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsVerified(false);
            }

            setUser(session?.user ?? null);
        });

        const subscription = data?.subscription;
        return () => subscription?.unsubscribe();
    }, [router]);

    const checkUser = async () => {
        // Tidak perlu cek user di register page
    };

    const checkSocialMediaStatus = async (userId: string): Promise<boolean> => {
        // Fungsi ini tidak digunakan lagi di register
        return true;
    };

    const handleRegister = async (values: any) => {
        setError('');
        setSuccess('');

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
                        full_name: values.full_name
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (signUpData?.user) {
                // Trigger will automatically create user record with social_media_completed = false
                
                if (signUpData.user.email_confirmed_at) {
                    // Email already confirmed (e.g., localhost or disabled email confirmation)
                    setSuccess('Account created successfully. Redirecting to login...');
                    setIsVerified(true);
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 2000);
                } else {
                    // Need email verification
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
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

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

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();
        
        if (!/^\d+$/.test(pastedData)) {
            setError('Please paste numbers only');
            return;
        }

        const digits = pastedData.slice(0, 6).split('');
        
        if (digits.length === 6) {
            setOtp(digits);
            const lastInput = document.getElementById('otp-5');
            lastInput?.focus();
            setError('');
        } else {
            setError('Please paste a 6-digit code');
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
                setIsVerifying(false); // ✅ Set false dulu sebelum state lain berubah
                setSuccess('Email verified successfully! Redirecting to login...');
                setIsVerified(true);
                
                // Redirect to login page after verification
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            }
        } catch (err: unknown) {
            setIsVerifying(false); // ✅ Set false saat error
            if (err instanceof Error) setError(err.message);
            else setError('Invalid verification code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            const firstInput = document.getElementById('otp-0');
            firstInput?.focus();
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

    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-primary">Email Verified!</h2>
                        <p className="text-gray-500">Redirecting to login page...</p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE0]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showOtpInput && user && !isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-primary">Verify Your Email</h2>
                            <p className="text-gray-500">
                                We've sent a 6-digit code to<br />
                                <span className="font-semibold text-[#D78FEE]">{userEmail}</span>
                            </p>
                        </div>

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
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-[#9B5DE0]/30 rounded-lg text-primary focus:outline-none focus:border-[#D78FEE] transition-all"
                                />
                            ))}
                        </div>

                        <p className="text-xs text-gray-400">
                            💡 Tip: You can paste the entire 6-digit code
                        </p>

                        <Button
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otp.join('').length !== 6}
                            className="w-full bg-primary text-white py-3 disabled:opacity-50"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify Email'}
                        </Button>

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
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-primary flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-background border-[#9B5DE0]/30">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl text-primary">
                            Create New Account
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Fill in the information below to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert className="mb-4 bg-red-500/10 border-red-500/50 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="mb-4 bg-green-500/10 border-green-500/50 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    {...registerForm.register('full_name', {
                                        required: 'Full name is required',
                                        minLength: { value: 3, message: 'Name must be at least 3 characters' }
                                    })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                                />
                                {registerForm.formState.errors.full_name && (
                                    <p className="text-sm text-red-400 flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {registerForm.formState.errors.full_name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 flex items-center">
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
                                    className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                                />
                                {registerForm.formState.errors.email && (
                                    <p className="text-sm text-red-400 flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {registerForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 flex items-center">
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
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
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

                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                                        className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
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

                            <label className="flex items-start space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...registerForm.register('agreeTerms', { required: 'You must agree to the terms' })}
                                    className="w-4 h-4 mt-0.5 rounded border-[#9B5DE0]/30 bg-white/5 text-[#D78FEE] focus:ring-[#D78FEE] focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-500">
                                    I agree to the{' '}
                                    <a href="#" className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors">Terms of Service</a>{' '}
                                    and{' '}
                                    <a href="#" className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors">Privacy Policy</a>
                                </span>
                            </label>

                            <Button
                                onClick={() => void registerForm.handleSubmit(handleRegister)()}
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:from-[#8B4DD0] hover:to-[#C77FDE] text-white py-6"
                            >
                                {isSubmitting ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
    );
}
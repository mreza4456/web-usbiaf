"use client";
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkEmailRegistered } from '@/action/auth'; // sesuaikan path dengan lokasi file di project kamu

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Step = 'email' | 'verify' | 'newPassword' | 'success';

const OTP_LENGTH = 6;

export default function ForgotPassword(): React.ReactElement {
    const [step, setStep] = useState<Step>('email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [userEmail, setUserEmail] = useState('');
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const emailForm = useForm({
        defaultValues: {
            email: ''
        }
    });

    const passwordForm = useForm({
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    // ============ STEP 1: EMAIL ============
    const handleSendResetCode = async (values: any) => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            // Cek email terdaftar lewat Server Action (pakai service role
            // key di server, aman dari exposure ke client, dan tidak
            // bergantung pada RLS policy publik).
            const checkResult = await checkEmailRegistered(values.email);

            if (!checkResult.success) {
                setError(checkResult.message || 'Unable to verify email at this time. Please try again later.');
                setIsSubmitting(false);
                return;
            }

            if (!checkResult.exists) {
                setError('This email is not registered. Please check and try again, or create a new account.');
                setIsSubmitting(false);
                return;
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email);
            if (resetError) throw resetError;

            setUserEmail(values.email);
            setOtp(Array(OTP_LENGTH).fill(''));
            setStep('verify');
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to send reset code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============ STEP 2: OTP BOXES ============
    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return; // hanya izinkan 1 digit angka

        const next = [...otp];
        next[index] = value;
        setOtp(next);

        if (value && index < OTP_LENGTH - 1) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;

        const next = Array(OTP_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
        setOtp(next);

        const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
        document.getElementById(`otp-${lastIndex}`)?.focus();
    };

    const handleVerifyOtp = async () => {
        setError('');
        setSuccess('');

        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: userEmail,
                token: code,
                type: 'recovery',
            });

            if (verifyError) {
                setError('Invalid or expired code. Please check the code or request a new one.');
                setIsSubmitting(false);
                return;
            }

            // Session sudah aktif setelah verifyOtp berhasil
            setStep('newPassword');
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to verify code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            const { error: resendError } = await supabase.auth.resetPasswordForEmail(userEmail);
            if (resendError) throw resendError;
            setOtp(Array(OTP_LENGTH).fill(''));
            document.getElementById('otp-0')?.focus();
            setSuccess('A new code has been sent to your email.');
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to resend code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============ STEP 3: NEW PASSWORD ============
    const handleSetNewPassword = async (values: any) => {
        setError('');
        setSuccess('');

        if (values.password !== values.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: values.password,
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully! Redirecting to login...');
            setStep('success');

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

    // ============ STEP: SUCCESS ============
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-radial from-transparent to-white flex items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-md bg-background border border-[#9B5DE0]/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-primary">Password Reset!</h2>
                            <p className="text-gray-500">{success}</p>
                        </div>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE0]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============ STEP: NEW PASSWORD ============
    if (step === 'newPassword') {
        return (
            <div className="min-h-screen bg-radial from-transparent to-white flex items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-md">
                    <Card className="bg-white shadow-lg">
                        <CardHeader className="space-y-1 pb-4">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-primary text-center">
                                Set New Password
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-center">
                                Your code has been verified. Enter your new password below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-500 flex items-center">
                                        <Lock className="w-4 h-4 mr-2" />
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            {...passwordForm.register('password', {
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
                                    {passwordForm.formState.errors.password && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {passwordForm.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-500 flex items-center">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            {...passwordForm.register('confirmPassword', {
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
                                    {passwordForm.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-400 flex items-center mt-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {passwordForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    onClick={() => void passwordForm.handleSubmit(handleSetNewPassword)()}
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-white py-6"
                                >
                                    {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ============ STEP: VERIFY OTP ============
    if (step === 'verify') {
        return (
            <div className="min-h-screen bg-radial from-transparent to-white flex items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-md">
                    <Card className="bg-white shadow-lg">
                        <CardHeader className="space-y-1 pb-4">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-primary text-center">
                                Enter Verification Code
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-center">
                                We've sent a 6-digit code to<br />
                                <span className="font-semibold text-secondary">{userEmail}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-[#9B5DE0]/30 rounded-lg text-primary focus:outline-none focus:border-[#D78FEE] transition-all"
                                    />
                                ))}
                            </div>

                            <Button
                                onClick={handleVerifyOtp}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-6"
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify Code'}
                            </Button>

                            <div className="text-sm text-gray-400 text-center">
                                Didn't receive the code?{' '}
                                <button
                                    onClick={handleResendOtp}
                                    disabled={isSubmitting}
                                    className="text-[#D78FEE] hover:text-[#FDCFFA] transition-colors font-medium disabled:opacity-50"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setStep('email')}
                            className="text-sm text-gray-400 hover:text-[#D78FEE] transition-colors inline-flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Use a different email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============ STEP: EMAIL ============
    return (
        <div className="min-h-screen bg-radial from-transparent to-white flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-white shadow-lg ">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                                <KeyRound className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-primary text-center">
                            Forgot Password?
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-center">
                            No worries, we'll send you a reset code
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter Your Email"
                                    {...emailForm.register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[#9B5DE0]/30 rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
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
                                onClick={() => void emailForm.handleSubmit(handleSendResetCode)()}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-6"
                            >
                                {isSubmitting ? 'Checking...' : 'Send Reset Code'}
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
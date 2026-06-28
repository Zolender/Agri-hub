'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { loginAction } from '@/app/lib/actions/login';

export default function LoginPage() {
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [error, setError]             = useState('');
    const [loading, setLoading]         = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setRateLimited(false);

        try {
            const result = await loginAction({ email, password });

            if (result?.rateLimited) {
                setRateLimited(true);
                setError(result.error!);
            } else if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main 
            className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6 relative overflow-hidden"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* Animated Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-emerald-100/40 blur-[120px] pointer-events-none" />
            
            {/* Floating Shapes */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 left-20 w-20 h-20 rounded-2xl bg-emerald-600/10 blur-xl"
            />
            <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-emerald-600/10 blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-white rounded-3xl shadow-2xl shadow-stone-200/50 border border-stone-200 p-10 space-y-8">
                    
                    {/* Header */}
                    <header className="text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-2"
                        >
                            <Leaf className="w-8 h-8 text-white" strokeWidth={2.5} />
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 
                                className="text-3xl font-black text-stone-900 tracking-tight"
                                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                            >
                                <span className="text-emerald-600">AgriHub</span>
                            </h1>
                            <p className="text-stone-500 text-sm mt-2">
                                Welcome back. Sign in to continue.
                            </p>
                        </motion.div>
                    </header>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-sm p-4 rounded-xl border flex items-start gap-3 ${
                                    rateLimited
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                }`}
                            >
                                {rateLimited
                                    ? <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                    : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                }
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                disabled={rateLimited}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all text-stone-900 placeholder-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={rateLimited}
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all text-stone-900 placeholder-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading || rateLimited}
                            whileHover={{ scale: loading || rateLimited ? 1 : 1.02 }}
                            whileTap={{ scale: loading || rateLimited ? 1 : 0.98 }}
                            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    Authenticating...
                                </>
                            ) : rateLimited ? (
                                <>
                                    <ShieldAlert className="w-5 h-5" />
                                    Too many attempts
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center pt-4 border-t border-stone-100"
                    >
                        <Link
                            href="/"
                            className="text-sm text-stone-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2"
                        >
                            ← Back to home
                        </Link>
                    </motion.div>
                </div>

                {/* Trust Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center mt-6 text-xs text-stone-400"
                >
                    🔒 Secured with NextAuth • Rate limited by Upstash
                </motion.div>
            </motion.div>
        </main>
    );
}
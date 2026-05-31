'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
    Package,
    AlertTriangle,
    BadgeDollarSign,
    Activity,
    RefreshCcw,
    Target,
    TrendingDown,
    Lock,
    LucideIcon,
} from 'lucide-react';
import { useDarkMode } from '../DarkModeContext'; // ← NEW

interface AnimatedStatCardProps {
    title: string;
    value: string | number;
    iconName: 'Package' | 'AlertTriangle' | 'BadgeDollarSign' | 'Activity' | 'RefreshCcw' | 'Target' | 'TrendingDown' | 'Lock';
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const iconMap: Record<string, LucideIcon> = {
    Package,
    AlertTriangle,
    BadgeDollarSign,
    Activity,
    RefreshCcw,
    Target,
    TrendingDown,
    Lock,
};

export default function AnimatedStatCard({ title, value, iconName, description, trend }: AnimatedStatCardProps) {
    const { isDark } = useDarkMode(); // ← NEW
    const [count, setCount] = useState(0);
    const numericValue = typeof value === 'number' ? value : 0;
    const Icon = iconMap[iconName];

    useEffect(() => {
        if (typeof value === 'number') {
            const duration = 1500;
            const step = (timestamp: number, startTime?: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.floor(eased * numericValue));
                if (progress < 1) {
                    requestAnimationFrame((t) => step(t, startTime));
                } else {
                    setCount(numericValue);
                }
            };
            requestAnimationFrame((t) => step(t));
        }
    }, [numericValue, value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-2xl border shadow-sm hover:shadow-lg transition-all group ${
                isDark
                    ? 'bg-stone-900 border-stone-700'
                    : 'bg-white border-stone-200'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-3 bg-emerald-600/10 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                >
                    <Icon className="w-6 h-6" />
                </motion.div>
                {trend && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            trend.isPositive 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-rose-100 text-rose-700'
                        }`}
                    >
                        {trend.isPositive ? '+' : '-'}{trend.value}%
                    </motion.span>
                )}
            </div>
            <div>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {title}
                </p>
                <motion.h3
                    className={`text-2xl font-black tracking-tight wrap-break-word ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                    {typeof value === 'number' ? count.toLocaleString() : value}
                </motion.h3>
                {description && (
                    <p className={`text-xs mt-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        {description}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
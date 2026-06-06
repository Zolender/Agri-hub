'use client';

import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

type Props = {
    title: string;
    value: string;
    subtitle?: string;
    highlight?: 'neutral' | 'warn' | 'good';
};

export default function FinancialMiniCard({ title, value, subtitle, highlight = 'neutral' }: Props) {
    const { isDark } = useDarkMode();

    const valueColor = {
        neutral: isDark ? 'text-stone-200' : 'text-stone-800',
        warn:    'text-amber-500',
        good:    isDark ? 'text-emerald-400' : 'text-emerald-600',
    }[highlight];

    return (
        <div className={`rounded-xl px-5 py-4 shadow ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {title}
            </p>
            <p
                className={`text-xl font-black leading-tight ${valueColor}`}
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
                {value}
            </p>
            {subtitle && (
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

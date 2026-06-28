'use client';

import { SlidersHorizontal, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

type Props = {
    role: 'ADMIN' | 'MANAGER';
};

export default function AdjustmentPageHeader({ role }: Props) {
    const router = useRouter();
    const { isDark } = useDarkMode();

    return (
        <div className="space-y-3">
            <button
                onClick={() => router.back()}
                className={`
                    flex items-center gap-1.5 text-sm font-medium transition-colors
                    ${isDark ? 'text-stone-400 hover:text-stone-100' : 'text-stone-500 hover:text-stone-800'}
                `}
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div>
                <div className="flex items-center gap-3 mb-1">
                    <SlidersHorizontal className="w-6 h-6 text-amber-600" />
                    <h1
                        className={`text-2xl font-black tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                    >
                        Stock Adjustment
                    </h1>
                </div>
                <p className={`text-sm ml-9 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Correct stock levels for breakage, spoilage, counting errors, or returns.
                    Every adjustment is logged to the audit trail.
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 w-fit">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">
                    {role === 'ADMIN' ? 'Admin' : 'Manager'} access
                </span>
            </div>
        </div>
    );
}

'use client';

import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export default function SectionLabel({ title }: { title: string }) {
    const { isDark } = useDarkMode();
    return (
        <div className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {title}
            </span>
            <div className={`flex-1 h-px ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />
        </div>
    );
}

'use client';

import { FileUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export default function ImportPageHeader() {
    const router = useRouter();
    const { isDark } = useDarkMode();

    return (
        <div className="space-y-3">
            <button
                onClick={() => router.back()}
                className={`
                    flex items-center gap-1.5 text-sm font-medium transition-colors
                    ${isDark
                        ? 'text-stone-400 hover:text-stone-100'
                        : 'text-stone-500 hover:text-stone-800'
                    }
                `}
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div>
                <div className="flex items-center gap-3 mb-1">
                    <FileUp className="w-6 h-6 text-emerald-600" />
                    <h1
                        className={`text-2xl font-black tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                    >
                        Import Data
                    </h1>
                </div>
                <p className={`text-sm ml-9 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Upload a CSV file to bulk-import inventory records into the system.
                </p>
            </div>
        </div>
    );
}
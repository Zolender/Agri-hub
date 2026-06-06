'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        console.error('Global Error:', error);
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) setIsDark(saved === 'true');
    }, [error]);

    return (
        <html lang="en">
            <body className={isDark ? 'bg-stone-950' : 'bg-slate-50'}>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className={`max-w-md w-full rounded-2xl shadow-lg p-8 text-center space-y-4 ${
                        isDark ? 'bg-stone-900' : 'bg-white'
                    }`}>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle size={32} />
                        </div>

                        <h2 className={`text-2xl font-bold ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>
                            Something went wrong
                        </h2>

                        <p className={isDark ? 'text-stone-400' : 'text-slate-600'}>
                            A critical error occurred. The team has been notified.
                        </p>

                        {error.digest && (
                            <p className={`text-xs font-mono ${isDark ? 'text-stone-600' : 'text-slate-400'}`}>
                                Error ID: {error.digest}
                            </p>
                        )}

                        <div className="flex gap-3 justify-center pt-4">
                            <button
                                onClick={reset}
                                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className={`px-6 py-3 rounded-lg transition-colors ${
                                    isDark
                                        ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

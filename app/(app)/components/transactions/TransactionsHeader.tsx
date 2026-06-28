"use client";

import { useDarkMode } from "../DarkModeContext";

export default function TransactionsHeader({ totalCount }: { totalCount: number }) {
    const { isDark } = useDarkMode();

    return (
        <div className="flex flex-col gap-1">
            <p className={`text-xs font-mono uppercase tracking-widest ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
                Ledger
            </p>
            <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                }`}
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
                Transactions
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {totalCount.toLocaleString()} movement{totalCount !== 1 ? 's' : ''} recorded in the ledger
            </p>
        </div>
    );
}
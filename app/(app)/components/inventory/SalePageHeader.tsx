"use client";

import { History, ShieldCheck, ArrowLeft } from "lucide-react";
import { useDarkMode } from "../DarkModeContext";
import { useRouter } from "next/navigation";

export default function SalePageHeader() {
    const { isDark } = useDarkMode();
    const router = useRouter();

    return (
        <header className="flex flex-col gap-1">
            <button
                onClick={() => router.back()}
                className={`flex items-center gap-1.5 text-sm font-medium mb-2 w-fit transition-colors ${
                    isDark ? 'text-stone-400 hover:text-stone-100' : 'text-stone-500 hover:text-stone-800'
                }`}
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>
            <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-widest ${
                isDark ? 'text-stone-500' : 'text-slate-400'
            }`}>
                <span>Inventory</span>
                <span>/</span>
                <span className="text-emerald-500">Stock Out</span>
            </div>
            <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                }`}
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
                Record a Sale
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                Search for a product SKU to deduct stock and update the ledger.
            </p>
        </header>
    );
}

export function SalePageSidebar() {
    const { isDark } = useDarkMode();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Quick Tip card */}
            <div className={`p-5 sm:p-6 rounded-3xl shadow-lg ${
                isDark ? 'bg-stone-800 text-stone-100' : 'bg-slate-900 text-white'
            }`}>
                <div className="flex items-center gap-3 mb-3">
                    <History className="text-emerald-400 shrink-0" size={20} />
                    <h3 className="font-semibold text-sm sm:text-base">Quick Tip</h3>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-slate-300'}`}>
                    Always verify the <strong>Product Preview</strong> before confirming.
                    Products at or below their reorder point are flagged as <strong>Low Stock</strong>.
                </p>
            </div>

            {/* Inventory Health card */}
            <div className={`p-5 sm:p-6 rounded-3xl border ${
                isDark
                    ? 'bg-emerald-950 border-emerald-900'
                    : 'bg-emerald-50 border-emerald-100'
            }`}>
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <h4 className={`font-bold text-xs uppercase tracking-wide ${
                        isDark ? 'text-emerald-400' : 'text-emerald-800'
                    }`}>
                        Inventory Health
                    </h4>
                </div>
                <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    Any sale recorded here will instantly reflect on the main dashboard analytics.
                </p>
            </div>
        </div>
    );
}
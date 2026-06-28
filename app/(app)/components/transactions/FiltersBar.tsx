"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Filter, X, Download, Calendar, MapPin, Package, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "@/app/(app)/components/DarkModeContext";

type FiltersBarProps = {
    totalCount: number;
};

export default function FiltersBar({ totalCount }: FiltersBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const { isDark } = useDarkMode();

    const [movementType, setMovementType] = useState(searchParams.get('movementType') || '');
    const [region, setRegion] = useState(searchParams.get('region') || '');
    const [productSearch, setProductSearch] = useState(searchParams.get('productId') || '');
    const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('to') || '');

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (movementType) params.set('movementType', movementType);
        if (region) params.set('region', region);
        if (productSearch) params.set('productId', productSearch);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        params.set('page', '1');
        startTransition(() => { router.push(`/transactions?${params.toString()}`); });
    };

    const clearFilters = () => {
        setMovementType('');
        setRegion('');
        setProductSearch('');
        setDateFrom('');
        setDateTo('');
        startTransition(() => { router.push('/transactions'); });
    };

    const removeFilter = (filterName: string) => {
        const updates: Record<string, () => void> = {
            movementType: () => setMovementType(''),
            region: () => setRegion(''),
            productId: () => setProductSearch(''),
            dateRange: () => { setDateFrom(''); setDateTo(''); }
        };
        updates[filterName]?.();
        setTimeout(() => {
            const params = new URLSearchParams();
            if (filterName !== 'movementType' && movementType) params.set('movementType', movementType);
            if (filterName !== 'region' && region) params.set('region', region);
            if (filterName !== 'productId' && productSearch) params.set('productId', productSearch);
            if (filterName !== 'dateRange') {
                if (dateFrom) params.set('from', dateFrom);
                if (dateTo) params.set('to', dateTo);
            }
            params.set('page', '1');
            startTransition(() => { router.push(`/transactions?${params.toString()}`); });
        }, 0);
    };

    const hasActiveFilters = movementType || region || productSearch || dateFrom || dateTo;

    const exportToCSV = () => {
        const params = new URLSearchParams();
        if (movementType) params.set('movementType', movementType);
        if (region) params.set('region', region);
        if (productSearch) params.set('productId', productSearch);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        params.set('export', 'csv');
        window.location.href = `/api/transactions/export?${params.toString()}`;
    };

    const activeFilters = [
        { key: 'movementType', label: movementType, icon: Filter },
        { key: 'region', label: region, icon: MapPin },
        { key: 'productId', label: `ID: ${productSearch}`, icon: Package },
        { key: 'dateRange', label: dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : dateFrom || dateTo, icon: Calendar }
    ].filter(f => f.label);

    // Shared input class builder
    const inputClass = `w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm ${
        isDark
            ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500'
            : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400'
    }`;

    const labelClass = `block text-xs font-semibold mb-2 uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-700'}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl shadow-sm border p-6 space-y-5 ${
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
            }`}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                        <Filter className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                            Filters
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            {totalCount.toLocaleString()} transaction{totalCount !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {hasActiveFilters && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearFilters}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                                isDark
                                    ? 'text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 border-stone-700'
                                    : 'text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border-stone-200'
                            }`}
                        >
                            <X className="w-4 h-4" />
                            Clear All
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </motion.button>
                </div>
            </div>

            {/* Active Filter Pills */}
            <AnimatePresence>
                {activeFilters.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                    >
                        {activeFilters.map((filter) => {
                            const Icon = filter.icon;
                            return (
                                <motion.div
                                    key={filter.key}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-200"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="font-medium">{filter.label}</span>
                                    <button
                                        onClick={() => removeFilter(filter.key)}
                                        className="hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Product ID */}
                <div>
                    <label className={labelClass}>Product ID</label>
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                        <input
                            type="text"
                            placeholder="Search by ID..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className={`${inputClass} pl-10`}
                        />
                    </div>
                </div>

                {/* Movement Type */}
                <div>
                    <label className={labelClass}>Movement Type</label>
                    <select
                        value={movementType}
                        onChange={(e) => setMovementType(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">All Types</option>
                        <option value="Sale">Sale</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Adjustment">Adjustment</option>
                    </select>
                </div>

                {/* Region */}
                <div>
                    <label className={labelClass}>Region</label>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">All regions</option>
                        {['Kigali', 'Musanze', 'Nyagatare', 'Huye', 'Rubavu', 'Rwamagana', 'Muhanga', 'Karongi'].map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {/* Date From */}
                <div>
                    <label className={labelClass}>From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className={inputClass}
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className={labelClass}>To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end pt-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={applyFilters}
                    disabled={isPending}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm"
                >
                    {isPending ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Applying...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Apply Filters
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
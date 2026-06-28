'use client';

import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, ArrowUpDown } from 'lucide-react';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

type Transaction = {
    id: string;
    transactionDate: Date;
    movementType: string;
    quantityOrderedUnits: number;
    remainingStockUnits: number;
    region: string;
    product: {
        id: string;
        categoryId: string;
        unitOfMeasure: string;
    };
};

type PageLinks = {
    previous: string | null;
    next: string | null;
    pages: Array<{
        number: number;
        url: string;
        isActive: boolean;
    }>;
};

type TransactionsTableProps = {
    transactions: Transaction[];
    page: number;
    totalPages: number;
    totalCount: number;
    pageLinks: PageLinks;
};

export default function TransactionsTable({
    transactions,
    page,
    totalPages,
    totalCount,
    pageLinks
}: TransactionsTableProps) {
    const { isDark } = useDarkMode();

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'Sale':       return isDark ? 'bg-rose-900/40 text-rose-400 border-rose-800'     : 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Purchase':   return isDark ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Adjustment': return isDark ? 'bg-blue-900/40 text-blue-400 border-blue-800'     : 'bg-blue-100 text-blue-700 border-blue-200';
            default:           return isDark ? 'bg-stone-800 text-stone-400 border-stone-700'     : 'bg-stone-100 text-stone-700 border-stone-200';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl shadow-sm border overflow-hidden ${
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
            }`}
        >
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`border-b ${isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'}`}>
                        <tr>
                            {['Date', 'Product ID', 'Category', 'Type', 'Quantity', 'Stock After', 'Region'].map((header, i) => (
                                <th
                                    key={header}
                                    className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                                        isDark ? 'text-stone-400' : 'text-stone-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {header}
                                        {i < 2 && <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-stone-700/50' : 'divide-stone-100'}`}>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-3"
                                    >
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                                            <FileText className={`w-8 h-8 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-lg font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-900'}`}>
                                                No transactions found
                                            </p>
                                            <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                                Try adjusting your filters or import some data
                                            </p>
                                        </div>
                                    </motion.div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((txn, index) => (
                                <motion.tr
                                    key={txn.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.3 }}
                                    className={`transition-colors group ${isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                                            {format(txn.transactionDate, 'MMM d, yyyy')}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                            {formatDistanceToNow(txn.transactionDate, { addSuffix: true })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-mono font-medium px-2 py-1 rounded transition-colors ${
                                            isDark
                                                ? 'text-stone-200 bg-stone-800 group-hover:bg-stone-700'
                                                : 'text-stone-900 bg-stone-50 group-hover:bg-stone-100'
                                        }`}>
                                            {txn.product.id}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                        {txn.product.categoryId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMovementTypeColor(txn.movementType)}`}>
                                            {txn.movementType}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                                        {txn.quantityOrderedUnits.toLocaleString()}{' '}
                                        <span className={`font-normal ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                            {txn.product.unitOfMeasure}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                                        {txn.remainingStockUnits.toLocaleString()}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                        {txn.region}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'
                }`}>
                    <div className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Showing{' '}
                        <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>{(page - 1) * 50 + 1}</span>
                        {' '}to{' '}
                        <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>{Math.min(page * 50, totalCount)}</span>
                        {' '}of{' '}
                        <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>{totalCount.toLocaleString()}</span>
                        {' '}transactions
                    </div>

                    <div className="flex items-center gap-2">
                        {pageLinks.previous ? (
                            <Link
                                href={pageLinks.previous}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all font-medium text-sm ${
                                    isDark
                                        ? 'border-stone-600 text-stone-300 hover:bg-stone-800 hover:border-stone-500'
                                        : 'border-stone-300 text-stone-700 hover:bg-white hover:border-stone-400'
                                }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Link>
                        ) : (
                            <span className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-not-allowed text-sm ${
                                isDark ? 'border-stone-700 text-stone-600' : 'border-stone-200 text-stone-400'
                            }`}>
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </span>
                        )}

                        <div className="hidden sm:flex items-center gap-1">
                            {pageLinks.pages.map((pageLink) => (
                                <Link
                                    key={pageLink.number}
                                    href={pageLink.url}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold text-sm transition-all ${
                                        pageLink.isActive
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : isDark
                                                ? 'text-stone-400 hover:bg-stone-800'
                                                : 'text-stone-600 hover:bg-stone-100'
                                    }`}
                                >
                                    {pageLink.number}
                                </Link>
                            ))}
                        </div>

                        {pageLinks.next ? (
                            <Link
                                href={pageLinks.next}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all font-medium text-sm ${
                                    isDark
                                        ? 'border-stone-600 text-stone-300 hover:bg-stone-800 hover:border-stone-500'
                                        : 'border-stone-300 text-stone-700 hover:bg-white hover:border-stone-400'
                                }`}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-not-allowed text-sm ${
                                isDark ? 'border-stone-700 text-stone-600' : 'border-stone-200 text-stone-400'
                            }`}>
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { importInventoryAction } from '@/app/lib/actions/import-inventory';
import { toast } from 'sonner';
import { resetInventoryAction } from '@/app/lib/actions/reset-inventory';
import {
    TriangleAlert, Download, AlertCircle, CheckCircle,
    Upload, FileText, Trash2, Sparkles, X, Info, Table2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import DangerModal from '../components/DangerModal';
import { useDarkMode } from '../components/DarkModeContext';
import ImportPageHeader from '../components/import/importPageHearder';

type ImportError = {
    productId: string;
    error: string;
    rowIndex?: number;
    rowNumber?: number;
};


function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const REQUIRED_CSV_HEADERS = [
    'product_id', 'category_id', 'unit_of_measure', 'unit_cost_rwf', 'selling_price_rwf',
    'reorder_point_units', 'lead_time_buffer_days', 'movement_type',
    'remaining_stock_units', 'order_id', 'region', 'transaction_date', 'landed_cost_rwf',
];
// quantity_fulfilled_units and product_name are optional — not in required list

function downloadTemplateCsv() {
    const headers = [
        // Required core fields
        'product_id', 'product_name', 'category_id', 'unit_of_measure', 'unit_cost_rwf', 'selling_price_rwf',
        'reorder_point_units', 'lead_time_buffer_days',
        'movement_type', 'quantity_ordered_units', 'quantity_fulfilled_units', 'remaining_stock_units',
        'order_id', 'region', 'transaction_date', 'landed_cost_rwf',
        // Optional tracking fields
        'lost_sale_qty_units', 'customer_id', 'po_id', 'supplier_id',
        // Optional shipment fields
        'ship_type', 'port_name', 'country', 'arrival_time', 'departure_time',
        // Optional FX fields
        'USD_RWF', 'EUR_RWF',
    ];

    // Example row 1 — a Purchase with shipment and FX data
    const purchaseRow = [
        'FERT-DAP-50KG', 'DAP Fertilizer 50kg', 'Fertilizers', 'bag', '38000', '45000',
        '50', '14',
        'Purchase', '120', '120', '210',
        'PO-2026-001', 'Kigali', '2026-03-27', '41000',
        '0', '', 'PO-2026-001', 'ETG-Rwanda',
        'Sea', 'Dar es Salaam', 'Tanzania', '2026-04-10', '2026-03-20',
        '1285', '1450',
    ];

    // Example row 2 — a Sale with partial fulfillment (lost sale recorded)
    const saleRow = [
        'FERT-DAP-50KG', 'DAP Fertilizer 50kg', 'Fertilizers', 'bag', '38000', '45000',
        '50', '14',
        'Sale', '12', '10', '200',
        'ORD-2026-002', 'Musanze', '2026-04-01', '41000',
        '2', 'CUST-001', '', '',
        '', '', '', '', '',
        '', '',
    ];

    const csv = [headers.join(','), purchaseRow.join(','), saleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'agri-hub-import-template.csv';
    link.click();
    toast.success('Template downloaded!');
}


export default function ImportPage() {
    const { isDark } = useDarkMode();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0);
    const [currentChunkInfo, setCurrentChunkInfo] = useState<{ start: number; end: number; total: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [importResults, setImportResults] = useState<{
        totalProcessed: number;
        successCount: number;
        errorCount: number;
        errors: ImportError[];
    } | null>(null);

    const [dangerModalOpen, setDangerModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);



    // ── smooth progress animation ──
    useEffect(() => {
        if (displayProgress < progress) {
            const timer = setTimeout(() => {
                setDisplayProgress(prev => {
                    const diff = progress - prev;
                    const increment = Math.max(1, Math.ceil(diff / 10));
                    return Math.min(prev + increment, progress);
                });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [progress, displayProgress]);

    // ── navigation guard during upload ──
    useEffect(() => {
        const guard = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                e.preventDefault();
                e.returnValue = 'Import in progress. Are you sure you want to leave?';
            }
        };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [isUploading]);

    // ── import logic ──
    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setProgress(0);
        setDisplayProgress(0);
        setImportResults(null);
        setCurrentChunkInfo(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (h) => h.replace(/^﻿/, '').trim(),
            complete: async (results) => {
                const allData = results.data as Record<string, unknown>[];

                if (allData.length === 0) {
                    toast.error('The CSV file appears to be empty.');
                    setIsUploading(false);
                    return;
                }

                const presentHeaders = results.meta.fields ?? [];
                const missingHeaders = REQUIRED_CSV_HEADERS.filter(h => !presentHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    toast.error(
                        `CSV is missing required columns: ${missingHeaders.join(', ')}. Download the template to see the correct format.`,
                        { duration: 10000 }
                    );
                    setIsUploading(false);
                    return;
                }

                const chunkSize = 100;
                let totalImported = 0;
                const allErrors: ImportError[] = [];

                for (let i = 0; i < allData.length; i += chunkSize) {
                    const chunk = allData.slice(i, i + chunkSize);
                    const startRow = i + 1;
                    const endRow = Math.min(i + chunkSize, allData.length);

                    setProgress(Math.round((i / allData.length) * 100));
                    setCurrentChunkInfo({ start: startRow, end: endRow, total: allData.length });

                    try {
                        const response = await importInventoryAction(chunk);
                        if (response && response.count !== undefined && response.count > 0) {
                            totalImported += response.count;

                            if (response.errors && response.errors.length > 0) {
                                const errorsWithRows = response.errors.map((err: ImportError) => ({
                                    ...err,
                                    rowNumber: startRow + (err.rowIndex ?? 0),
                                }));
                                allErrors.push(...errorsWithRows);
                                toast.warning(response.message || `${response.errors.length} rows failed`);
                            } else {
                                toast.success(`Rows ${startRow}–${endRow} imported`, { duration: 2000 });
                            }
                        } else {
                            toast.error(response?.error || 'Import failed at a chunk.');
                            break;
                        }
                    } catch {
                        toast.error('Network error during import. Please check your connection.');
                        break;
                    }
                }

                setProgress(100);
                setCurrentChunkInfo(null);
                setImportResults({
                    totalProcessed: allData.length,
                    successCount: totalImported,
                    errorCount: allErrors.length,
                    errors: allErrors,
                });

                if (totalImported > 0) {
                    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
                    toast.success(`🎉 ${totalImported} records imported successfully!`);
                    setFile(null);
                } else {
                    toast.error('Import finished but 0 records were saved. Check the errors below.');
                }

                setIsUploading(false);
            },
        });
    };

    // ── reset logic ──
    const handleReset = async () => {
        setIsResetting(true);
        try {
            const response = await resetInventoryAction();
            if (response.success) {
                toast.success(response.message || 'Database reset successfully');
            } else {
                toast.error(response.error || 'Failed to reset database');
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Network error during reset');
        } finally {
            setIsResetting(false);
            setDangerModalOpen(false);
        }
    };

    // ── file handling ──
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selected = e.target.files[0];
        if (selected.size > 5 * 1024 * 1024) {
            toast.warning(`File is ${formatBytes(selected.size)} — large files may take longer to process.`, { duration: 4000 });
        }
        setFile(selected);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.name.endsWith('.csv')) {
            setFile(dropped);
        } else {
            toast.error('Please upload a .csv file');
        }
    }, []);

    // ── error report download ──
    const downloadErrorReport = () => {
        if (!importResults || importResults.errors.length === 0) return;
        const headers = ['Row Number', 'Product ID', 'Error'];
        const rows = importResults.errors.map((err) => [
            err.rowNumber ?? 'Unknown',
            err.productId,
            err.error,
        ]);
        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        toast.success('Error report downloaded!');
    };

    // ── stagger variants ──
    const container = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
    };
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
        <div
            className="max-w-4xl mx-auto space-y-8"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            <ImportPageHeader />
            {/* ── Upload Progress Modal ── */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            className={`p-8 rounded-2xl shadow-2xl border max-w-sm w-full mx-4 space-y-6 ${
                                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                            }`}
                        >
                            {/* Spinning icon */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-16 h-16 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30"
                            >
                                <Upload className="w-8 h-8 text-white" />
                            </motion.div>

                            <div className="text-center space-y-1">
                                <h3 className={`font-bold text-xl ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                                    Importing Data…
                                </h3>
                                {currentChunkInfo ? (
                                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        Rows{' '}
                                        <span className="font-semibold text-emerald-600">
                                            {currentChunkInfo.start}–{currentChunkInfo.end}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-semibold">{currentChunkInfo.total}</span>
                                    </p>
                                ) : (
                                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        Please stay on this page
                                    </p>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className={`font-bold tabular-nums ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                        {displayProgress}%
                                    </span>
                                    <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>Processing…</span>
                                </div>
                                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                                    <motion.div
                                        className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${displayProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Danger Modal ── */}
            <DangerModal
                isOpen={dangerModalOpen}
                isDark={isDark}
                title="Reset Database"
                description="This will permanently delete ALL products, transactions, shipments, FX rates, and metrics. User accounts will NOT be affected. This action cannot be undone."
                confirmWord="DELETE"
                confirmLabel="Reset Database"
                isLoading={isResetting}
                onConfirm={handleReset}
                onCancel={() => setDangerModalOpen(false)}
            />

            {/* ── Page content (staggered) ── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                

                {/* Import Results */}
                <AnimatePresence>
                    {importResults && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className={`border rounded-2xl p-6 space-y-6 shadow-sm ${
                                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                            }`}
                        >
                            {/* Results header */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-950' : 'bg-emerald-50'}`}>
                                        <Sparkles className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                                        Import Results
                                    </h2>
                                </div>
                                {importResults.errorCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={downloadErrorReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Error Report
                                    </motion.button>
                                )}
                            </div>

                            {/* Summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    {
                                        label: 'Total Processed',
                                        value: importResults.totalProcessed,
                                        delay: 0.1,
                                        color: isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200',
                                        text: isDark ? 'text-stone-100' : 'text-stone-900',
                                    },
                                    {
                                        label: 'Successful',
                                        value: importResults.successCount,
                                        icon: <CheckCircle className="w-4 h-4" />,
                                        delay: 0.2,
                                        color: isDark ? 'bg-emerald-950 border-emerald-800' : 'bg-emerald-50 border-emerald-200',
                                        text: 'text-emerald-600',
                                    },
                                    {
                                        label: 'Failed',
                                        value: importResults.errorCount,
                                        icon: <AlertCircle className="w-4 h-4" />,
                                        delay: 0.3,
                                        color: isDark ? 'bg-rose-950 border-rose-800' : 'bg-rose-50 border-rose-200',
                                        text: 'text-rose-600',
                                    },
                                ].map(({ label, value, icon, delay, color, text }) => (
                                    <motion.div
                                        key={label}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay, type: 'spring', stiffness: 200 }}
                                        className={`rounded-xl p-5 border ${color}`}
                                    >
                                        {icon && (
                                            <div className={`flex items-center gap-2 text-sm font-medium mb-1 ${text}`}>
                                                {icon}
                                                {label}
                                            </div>
                                        )}
                                        {!icon && (
                                            <div className={`text-sm font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                                {label}
                                            </div>
                                        )}
                                        <div className={`text-3xl font-black tracking-tight ${text}`}>
                                            {value}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Error table */}
                            {importResults.errors.length > 0 && (
                                <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        Failed Records ({importResults.errors.length})
                                    </h3>
                                    <div className={`border rounded-xl overflow-hidden max-h-80 overflow-y-auto ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                                        <table className="w-full text-sm">
                                            <thead className={`sticky top-0 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}>
                                                <tr>
                                                    {['Row', 'Product ID', 'Error'].map((h) => (
                                                        <th
                                                            key={h}
                                                            className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-600'}`}
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? 'divide-stone-800 bg-stone-900' : 'divide-stone-100 bg-white'}`}>
                                                {importResults.errors.map((err, idx) => (
                                                    <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'}`}>
                                                        <td className={`px-4 py-3 font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                                            {err.rowNumber ?? 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-3 font-mono font-medium ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                                                            {err.productId}
                                                        </td>
                                                        <td className="px-4 py-3 text-rose-500">{err.error}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* File Upload Area */}
                <motion.div variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                }}>
                    <motion.div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center space-y-5 transition-colors ${
                            isDragging
                                ? isDark
                                    ? 'border-emerald-500 bg-emerald-950/40'
                                    : 'border-emerald-500 bg-emerald-50'
                                : isDark
                                ? 'border-stone-700 bg-stone-900 hover:border-emerald-600'
                                : 'border-stone-300 bg-white hover:border-emerald-400'
                        }`}
                    >
                        {/* Icon with idle pulse */}
                        <motion.div
                            animate={isDragging
                                ? { scale: 1.15 }
                                : file
                                ? { scale: 1 }
                                : { scale: [1, 1.05, 1] }
                            }
                            transition={!isDragging && !file
                                ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                                : { duration: 0.2 }
                            }
                            className={`w-20 h-20 rounded-full flex items-center justify-center ${
                                isDragging
                                    ? 'bg-emerald-500'
                                    : isDark
                                    ? 'bg-emerald-950'
                                    : 'bg-emerald-50'
                            }`}
                        >
                            <FileText
                                className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-emerald-600'}`}
                                strokeWidth={1.5}
                            />
                        </motion.div>

                        {/* Upload label */}
                        <div className="text-center">
                            <label className="cursor-pointer">
                                <span className="text-emerald-600 font-semibold text-lg hover:underline">
                                    Click to upload
                                </span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                                <span className={`block text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    or drag and drop your CSV file here
                                </span>
                            </label>
                        </div>

                        {/* Constraints hint */}
                        <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            <span className="flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" /> CSV only
                            </span>
                            <span>·</span>
                            <span>5 MB recommended max</span>
                            <span>·</span>
                            <span>Up to 10,000 rows</span>
                        </div>

                        {/* Template download */}
                        <button
                            onClick={downloadTemplateCsv}
                            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                isDark
                                    ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                            }`}
                        >
                            <Table2 className="w-3.5 h-3.5" />
                            Download CSV template
                        </button>

                        {/* Selected file chip */}
                        <AnimatePresence>
                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                                        isDark
                                            ? 'bg-emerald-950 border-emerald-800'
                                            : 'bg-emerald-50 border-emerald-200'
                                    }`}
                                >
                                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                                        {file.name}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'}`}>
                                        {formatBytes(file.size)}
                                    </span>
                                    <button
                                        onClick={() => setFile(null)}
                                        className={`ml-auto transition-colors ${isDark ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-500'}`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>

                {/* Import Button */}
                <motion.div variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                }}>
                    <motion.button
                        whileHover={{ scale: file && !isUploading ? 1.02 : 1 }}
                        whileTap={{ scale: file && !isUploading ? 0.98 : 1 }}
                        onClick={handleImport}
                        disabled={!file || isUploading}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                                Processing Data…
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Start Import
                            </>
                        )}
                    </motion.button>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } 
                    }}
                    className={`border-2 rounded-xl p-6 ${isDark ? 'border-rose-900 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}
                >
                    <h3 className={`text-base font-bold mb-1 flex items-center gap-2 ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>
                        <TriangleAlert className="w-5 h-5" />
                        Danger Zone
                    </h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-rose-400/80' : 'text-rose-700'}`}>
                        Permanently deletes all inventory data — products, transactions, shipments, FX rates and metrics.{' '}
                        <strong>User accounts are NOT affected.</strong>
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDangerModalOpen(true)}
                        disabled={isUploading}
                        className="px-5 py-2.5 bg-rose-600 text-white rounded-lg font-semibold text-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Reset Database
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
}
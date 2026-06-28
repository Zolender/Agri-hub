'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, TrendingUp, DollarSign, Clock, Edit3, Check, AlertCircle } from 'lucide-react';
import { updateProductAction } from '@/app/lib/actions/inventory';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
    id: string;
    name?: string | null;
    categoryId: string;
    unitOfMeasure: string;
    unitCostRwf: number;
    sellingPriceRwf: number;
    quantity: number;
    reorderPointUnits: number;
    leadTimeBufferDays?: number;
};

type UserRole = 'ADMIN' | 'MANAGER' | 'ANALYST';

type ProductDetailModalProps = {
    product: Product | null;       // null = modal is closed
    userRole: UserRole;
    onClose: () => void;
};

// ─── Helper: read-only detail row ─────────────────────────────────────────────

function DetailRow({
    icon: Icon,
    label,
    value,
    isDark,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    isDark: boolean;
}) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-stone-700 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{label}</p>
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>{value}</p>
            </div>
        </div>
    );
}

// ─── Helper: editable number field ────────────────────────────────────────────

function EditableField({
    label,
    value,
    onChange,
    isDark,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    isDark: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 ${
                    isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100'
                        : 'bg-white border-stone-300 text-stone-800'
                }`}
            />
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ProductDetailModal({ product, userRole, onClose }: ProductDetailModalProps) {
    const { isDark } = useDarkMode();
    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER';

    // Edit form state — we pre-fill from the product when it opens
    const [isEditing, setIsEditing] = useState(false);
    const [sellingPrice, setSellingPrice] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [reorderPoint, setReorderPoint] = useState('');
    const [leadTime, setLeadTime] = useState('');

    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    // When the user clicks "Edit", seed the input fields from current values
    function startEditing() {
        if (!product) return;
        setSellingPrice(String(product.sellingPriceRwf));
        setUnitCost(String(product.unitCostRwf));
        setReorderPoint(String(product.reorderPointUnits));
        setLeadTime(String(product.leadTimeBufferDays ?? 0));
        setFeedback(null);
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
        setFeedback(null);
    }

    function handleSave() {
        if (!product) return;

        startTransition(async () => {
            const result = await updateProductAction(product.id, {
                sellingPriceRwf: parseFloat(sellingPrice),
                unitCostRwf: parseFloat(unitCost),
                reorderPointUnits: parseInt(reorderPoint, 10),
                leadTimeBufferDays: parseInt(leadTime, 10),
            });

            if (result.success) {
                setFeedback({ ok: true, msg: 'Product updated successfully!' });
                setIsEditing(false);
            } else {
                setFeedback({ ok: false, msg: result.error ?? 'Something went wrong.' });
            }
        });
    }

    return (
        <AnimatePresence>
            {product && (
                // ── Backdrop ───────────────────────────────────────────────
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={onClose}
                >
                    {/* ── Panel ─────────────────────────────────────────── */}
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}   // don't close when clicking inside
                        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 ${
                            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-emerald-900 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                                        {product.id}
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                        {product.name ?? product.categoryId}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                canEdit
                                    ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                    : isDark ? 'bg-stone-800 text-stone-400'        : 'bg-stone-100 text-stone-500'
                            }`}>
                                {userRole}
                            </span>
                            {canEdit
                                ? <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>You can edit this product</span>
                                : <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Read-only view</span>
                            }
                        </div>

                        {/* ── Read-only details grid ─────────────────────── */}
                        <div className="grid grid-cols-2 gap-3">
                            <DetailRow icon={TrendingUp} label="Stock Level" value={`${product.quantity.toLocaleString()} ${product.unitOfMeasure}`} isDark={isDark} />
                            <DetailRow icon={AlertCircle} label="Reorder Point" value={product.reorderPointUnits.toLocaleString()} isDark={isDark} />
                            <DetailRow icon={DollarSign} label="Unit Cost (RWF)" value={product.unitCostRwf.toLocaleString()} isDark={isDark} />
                            <DetailRow icon={DollarSign} label="Selling Price (RWF)" value={product.sellingPriceRwf.toLocaleString()} isDark={isDark} />
                            {product.leadTimeBufferDays !== undefined && (
                                <DetailRow icon={Clock} label="Lead Time (days)" value={product.leadTimeBufferDays} isDark={isDark} />
                            )}
                        </div>

                        {/* ── Edit form (MANAGER / ADMIN only) ──────────── */}
                        {canEdit && (
                            <>
                                {!isEditing ? (
                                    <button
                                        onClick={startEditing}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit Product
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className={`h-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
                                        <p className={`text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                                            Edit Fields
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <EditableField label="Selling Price (RWF)" value={sellingPrice} onChange={setSellingPrice} isDark={isDark} />
                                            <EditableField label="Unit Cost (RWF)" value={unitCost} onChange={setUnitCost} isDark={isDark} />
                                            <EditableField label="Reorder Point" value={reorderPoint} onChange={setReorderPoint} isDark={isDark} />
                                            <EditableField label="Lead Time (days)" value={leadTime} onChange={setLeadTime} isDark={isDark} />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={cancelEditing}
                                                disabled={isPending}
                                                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${isDark ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isPending}
                                                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isPending ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                {isPending ? 'Saving…' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-sm px-4 py-2.5 rounded-xl font-medium ${
                                    feedback.ok
                                        ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        : isDark ? 'bg-red-900/40 text-red-400'         : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {feedback.msg}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { getProductPreview, recordAdjustmentAction } from '@/app/lib/actions/inventory';
import { toast } from 'sonner';
import { useDarkMode } from '../DarkModeContext';
import { SlidersHorizontal, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const REGIONS = ['Kigali', 'Musanze', 'Nyagatare', 'Huye', 'Rubavu', 'Rwamagana', 'Muhanga', 'Karongi'];

export default function AdjustmentForm() {
    const { isDark } = useDarkMode();

    const [productId, setProductId] = useState('');
    const [product, setProduct] = useState<any>(null);
    const [direction, setDirection] = useState<'increase' | 'decrease'>('decrease');
    const [qty, setQty] = useState(1);
    const [reason, setReason] = useState('');
    const [region, setRegion] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (productId.length <= 3) { setProduct(null); return; }
        setSearching(true);
        const timer = setTimeout(async () => {
            const data = await getProductPreview(productId);
            setProduct(data);
            setSearching(false);
        }, 500);
        return () => { clearTimeout(timer); setSearching(false); };
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) { toast.error('Enter a valid Product ID first.'); return; }
        if (qty < 1)  { toast.error('Quantity must be at least 1.'); return; }
        if (!reason.trim()) { toast.error('Reason is required.'); return; }
        if (!region) { toast.error('Region is required.'); return; }

        setLoading(true);
        const res = await recordAdjustmentAction(productId, qty, direction, reason.trim(), region, transactionDate);

        if (res.success) {
            toast.success(`Adjustment recorded — stock ${direction === 'increase' ? 'increased' : 'decreased'} by ${qty} units.`);
            setProductId('');
            setProduct(null);
            setQty(1);
            setReason('');
            setRegion('');
            setDirection('decrease');
            setTransactionDate(new Date().toISOString().slice(0, 10));
        } else {
            toast.error(res.error ?? 'Something went wrong.');
        }
        setLoading(false);
    };

    const inputClass = `
        w-full p-3 rounded-xl border-none outline-none
        focus:ring-2 focus:ring-emerald-500 transition-all
        ${isDark
            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
        }
    `;

    const label = (text: string, optional = false) => (
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
            {text}{optional && <span className={`normal-case font-normal ml-1 ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>(optional)</span>}
        </label>
    );

    return (
        <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-900/50' : 'bg-amber-50'}`}>
                    <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className={`font-bold text-base ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>Stock Adjustment</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                        Correct stock for breakage, spoilage, or counting errors
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    {label('Product ID')}
                    <div className="relative">
                        <input
                            placeholder="e.g. FERT-DAP-50KG"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value.toUpperCase())}
                            className={inputClass}
                            autoComplete="off"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />}
                    </div>
                </div>

                {product && (
                    <div className={`p-3 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 ${
                        isDark ? 'bg-emerald-950 border-emerald-800' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{product.name ?? product.categoryId}</p>
                        <div className="flex justify-between items-center mt-1.5 gap-4 flex-wrap">
                            <span className={isDark ? 'text-stone-300' : 'text-slate-600'}>
                                Current stock: <span className="font-semibold">{product.quantity.toLocaleString()} {product.unitOfMeasure}</span>
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                product.quantity <= product.reorderPointUnits ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {product.quantity <= product.reorderPointUnits ? '⚠ Low Stock' : 'In Stock'}
                            </span>
                        </div>
                    </div>
                )}

                {!product && productId.length > 3 && !searching && (
                    <p className="text-xs text-rose-500 px-1">No product found with that ID.</p>
                )}

                <div>
                    {label('Direction')}
                    <div className="grid grid-cols-2 gap-2">
                        {(['decrease', 'increase'] as const).map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDirection(d)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all ${
                                    direction === d
                                        ? d === 'decrease'
                                            ? 'bg-rose-600 text-white shadow-md'
                                            : 'bg-emerald-600 text-white shadow-md'
                                        : isDark
                                        ? 'bg-stone-800 text-stone-400 hover:text-stone-200'
                                        : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {d === 'decrease' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                {d === 'decrease' ? 'Decrease' : 'Increase'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    {label('Quantity')}
                    <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className={inputClass}
                    />
                </div>

                <div>
                    {label('Reason')}
                    <input
                        type="text"
                        placeholder="e.g. Broken bags, expired stock, recount correction…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div>
                    {label('Region')}
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                        <option value="">Select region...</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div>
                    {label('Date')}
                    <input
                        type="date"
                        value={transactionDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !product || qty < 1 || !reason.trim() || !region}
                    className={`
                        w-full py-3 rounded-xl font-semibold text-sm
                        flex items-center justify-center gap-2
                        transition-all duration-200
                        ${direction === 'decrease' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                        text-white active:scale-[0.98]
                        disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                        <><SlidersHorizontal className="w-4 h-4" /> Confirm Adjustment</>
                    )}
                </button>
            </form>
        </div>
    );
}

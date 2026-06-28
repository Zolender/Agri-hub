'use client';

import { useState, useEffect } from 'react';
import { getProductPreview, recordSaleAction } from '@/app/lib/actions/inventory';
import { toast } from 'sonner';
import { useDarkMode } from '../DarkModeContext'; 

export default function QuickSale() {
    const { isDark } = useDarkMode(); 
    const [sku, setSku] = useState('');
    const [product, setProduct] = useState<any>(null);
    const [qty, setQty] = useState(1);
    const [lostSaleQty, setLostSaleQty] = useState(0);
    const [customerId, setCustomerId] = useState('');
    const [region, setRegion] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (sku.length > 3) {
                const data = await getProductPreview(sku);
                setProduct(data);
            } else {
                setProduct(null);
            }
        };
        const timer = setTimeout(search, 500);
        return () => clearTimeout(timer);
    }, [sku]);

    const handleSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await recordSaleAction(sku, qty, region, {
            lostSaleQty: lostSaleQty || 0,
            customerId: customerId || undefined,
            transactionDate,
        });
        if (res.success) {
            toast.success("Sale recorded!");
            setSku('');
            setQty(1);
            setLostSaleQty(0);
            setCustomerId('');
            setRegion('');
            setTransactionDate(new Date().toISOString().slice(0, 10));
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark
                ? 'bg-stone-900 border-stone-700'
                : 'bg-white border-slate-100'
        }`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>
                New Sale
            </h3>
            <form onSubmit={handleSale} className="space-y-4">
                <input
                    placeholder="Enter Product ID..."
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className={`w-full p-3 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 outline-none ${
                        isDark
                            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
                            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
                    }`}
                />

                {product && (
                    <div className={`p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
                        isDark
                            ? 'bg-emerald-950 border-emerald-800'
                            : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <p className="text-xs font-bold text-emerald-600 uppercase">{product.categoryId}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-sm ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                                Stock: {product.quantity}
                            </span>
                            <span className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>
                                {product.sellingPriceRwf} RWF
                            </span>
                        </div>
                    </div>
                )}

                <input
                    type="number"
                    min={1}
                    placeholder="Units sold"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className={`w-full p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark
                            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
                            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
                    }`}
                />

                <input
                    type="number"
                    min={0}
                    placeholder="Units the customer couldn't get (lost sale) — optional"
                    value={lostSaleQty || ''}
                    onChange={(e) => setLostSaleQty(Number(e.target.value) || 0)}
                    className={`w-full p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-400 ${
                        isDark
                            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
                            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
                    }`}
                />

                <input
                    type="text"
                    placeholder="Customer ID (optional)"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className={`w-full p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark
                            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
                            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
                    }`}
                />

                <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={`w-full p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark
                            ? 'bg-stone-800 text-stone-100'
                            : 'bg-slate-50 text-slate-700'
                    }`}
                >
                    <option value="">Select region...</option>
                    {['Kigali', 'Musanze', 'Nyagatare', 'Huye', 'Rubavu', 'Rwamagana', 'Muhanga', 'Karongi'].map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={transactionDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className={`w-full p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark
                            ? 'bg-stone-800 text-stone-100'
                            : 'bg-slate-50 text-slate-700'
                    }`}
                />

                <button
                    disabled={loading || !product || !region}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium disabled:opacity-30 hover:bg-slate-800 transition-colors"
                >
                    {loading ? "Processing..." : "Confirm Transaction"}
                </button>
            </form>
        </div>
    );
}
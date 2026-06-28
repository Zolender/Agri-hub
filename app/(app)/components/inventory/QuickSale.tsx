'use client';

import { useState, useEffect } from 'react';
import { getProductPreview, recordSaleAction } from '@/app/lib/actions/inventory';
import { toast } from 'sonner';
import { useDarkMode } from '../DarkModeContext';
import { ShoppingBag, Loader2 } from 'lucide-react';

const REGIONS = ['Kigali', 'Musanze', 'Nyagatare', 'Huye', 'Rubavu', 'Rwamagana', 'Muhanga', 'Karongi'];

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
            toast.success('Sale recorded!');
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

    const inputClass = `
        w-full p-3 rounded-xl border-none outline-none
        focus:ring-2 focus:ring-emerald-500 transition-all
        ${isDark
            ? 'bg-stone-800 text-stone-100 placeholder:text-stone-500'
            : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
        }
    `;

    const labelClass = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`;
    const optional = <span className={`normal-case font-normal ml-1 ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>(optional)</span>;

    return (
        <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-slate-100'}`}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className={`font-bold text-base ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>Record Sale</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                        Log an outgoing sale and track customer demand
                    </p>
                </div>
            </div>

            <form onSubmit={handleSale} className="space-y-4">

                <div>
                    <label className={labelClass}>Product ID *</label>
                    <input
                        placeholder="e.g. FERT-DAP-50KG"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        className={inputClass}
                        autoComplete="off"
                    />
                </div>

                {product && (
                    <div className={`p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
                        isDark ? 'bg-emerald-950 border-emerald-800' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{product.name ?? product.categoryId}</p>
                        <div className="flex justify-between items-center mt-1.5 gap-4 flex-wrap">
                            <span className={`text-sm ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                                Stock: <span className="font-semibold">{product.quantity.toLocaleString()} {product.unitOfMeasure}</span>
                            </span>
                            <span className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>
                                {product.sellingPriceRwf.toLocaleString()} RWF
                            </span>
                        </div>
                    </div>
                )}

                {!product && sku.length > 3 && (
                    <p className="text-xs text-rose-500 px-1">No product found with that ID.</p>
                )}

                <div>
                    <label className={labelClass}>Units Sold *</label>
                    <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Lost Sale Qty {optional}</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="Units customer wanted but couldn't get"
                        value={lostSaleQty || ''}
                        onChange={(e) => setLostSaleQty(Number(e.target.value) || 0)}
                        className={inputClass.replace('focus:ring-emerald-500', 'focus:ring-amber-400')}
                    />
                </div>

                <div>
                    <label className={labelClass}>Customer ID {optional}</label>
                    <input
                        type="text"
                        placeholder="e.g. CUST-001"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Region *</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                        <option value="">Select region...</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Date *</label>
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
                    disabled={loading || !product || !region}
                    className={`
                        w-full py-3 rounded-xl font-semibold text-sm
                        flex items-center justify-center gap-2
                        transition-all duration-200
                        bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]
                        disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                        <><ShoppingBag className="w-4 h-4" /> Confirm Sale</>
                    )}
                </button>
            </form>
        </div>
    );
}

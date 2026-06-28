'use client';

import { useState, useEffect } from 'react';
import { getProductPreview, recordPurchaseAction } from '@/app/lib/actions/inventory';
import { toast } from 'sonner';
import { useDarkMode } from '../DarkModeContext';
import { PackagePlus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function QuickAdd() {
    const { isDark } = useDarkMode();

    // Form state
    const [productId, setProductId] = useState('');
    const [product, setProduct] = useState<any>(null);
    const [qty, setQty] = useState(1);
    const [region, setRegion] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [poId, setPoId] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    // Shipment fields
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [shipType, setShipType] = useState('');
    const [portName, setPortName] = useState('');
    const [country, setCountry] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    // FX fields
    const [usdToRwf, setUsdToRwf] = useState('');
    const [eurToRwf, setEurToRwf] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Debounced product lookup — fires 500 ms after the user stops typing
    useEffect(() => {
        if (productId.length <= 3) {
            setProduct(null);
            return;
        }

        setSearching(true);
        const timer = setTimeout(async () => {
            const data = await getProductPreview(productId);
            setProduct(data);
            setSearching(false);
        }, 500);

        return () => {
            clearTimeout(timer);
            setSearching(false);
        };
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!product) {
            toast.error('Please enter a valid Product ID first.');
            return;
        }
        if (qty < 1) {
            toast.error('Quantity must be at least 1.');
            return;
        }
        if (!region.trim()) {
            toast.error('Region is required.');
            return;
        }

        setLoading(true);
        const res = await recordPurchaseAction(productId, qty, region, {
            supplierId: supplierId.trim() || undefined,
            poId: poId.trim() || undefined,
            transactionDate,
            shipment: showAdvanced ? {
                shipType: shipType || undefined,
                portName: portName.trim() || undefined,
                country: country.trim() || undefined,
                arrivalTime: arrivalTime || undefined,
                departureTime: departureTime || undefined,
            } : undefined,
            fxRate: showAdvanced && (usdToRwf || eurToRwf) ? {
                usdToRwf: usdToRwf ? Number(usdToRwf) : undefined,
                eurToRwf: eurToRwf ? Number(eurToRwf) : undefined,
            } : undefined,
        });

        if (res.success) {
            toast.success(`Stock received! +${qty} units added to ${productId}.`);
            setProductId('');
            setProduct(null);
            setQty(1);
            setRegion('');
            setSupplierId('');
            setPoId('');
            setTransactionDate(new Date().toISOString().slice(0, 10));
            setShipType('');
            setPortName('');
            setCountry('');
            setArrivalTime('');
            setDepartureTime('');
            setUsdToRwf('');
            setEurToRwf('');
            setShowAdvanced(false);
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

    return (
        <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-slate-100'
        }`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${
                    isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'
                }`}>
                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className={`font-bold text-base ${isDark ? 'text-stone-100' : 'text-slate-800'}`}>
                        Receive Stock
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                        Record an incoming purchase / delivery
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        Product ID *
                    </label>
                    <div className="relative">
                        <input
                            placeholder="e.g. FERT-DAP-50KG"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value.toUpperCase())}
                            className={inputClass}
                            autoComplete="off"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                        )}
                    </div>
                </div>

                {product && (
                    <div className={`p-3 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 ${
                        isDark
                            ? 'bg-emerald-950 border-emerald-800'
                            : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                            {product.name ?? product.categoryId}
                        </p>
                        <div className="flex justify-between items-center mt-1.5 gap-4 flex-wrap">
                            <span className={isDark ? 'text-stone-300' : 'text-slate-600'}>
                                Current stock:{' '}
                                <span className="font-semibold">
                                    {product.quantity.toLocaleString()} {product.unitOfMeasure}
                                </span>
                            </span>
                            <span className={isDark ? 'text-stone-300' : 'text-slate-600'}>
                                Cost:{' '}
                                <span className="font-semibold">
                                    {product.unitCostRwf.toLocaleString()} RWF
                                </span>
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                product.quantity <= product.reorderPointUnits
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {product.quantity <= product.reorderPointUnits ? '⚠ Low Stock' : 'In Stock'}
                            </span>
                        </div>
                    </div>
                )}

                {!product && productId.length > 3 && !searching && (
                    <p className="text-xs text-rose-500 px-1">
                        No product found with that ID.
                    </p>
                )}

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        Quantity to Receive *
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        Region *
                    </label>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select region...</option>
                        {['Kigali', 'Musanze', 'Nyagatare', 'Huye', 'Rubavu', 'Rwamagana', 'Muhanga', 'Karongi'].map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        PO Number{' '}
                        <span className={`normal-case font-normal ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                            (optional)
                        </span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. PO-2026-042"
                        value={poId}
                        onChange={(e) => setPoId(e.target.value.toUpperCase())}
                        className={inputClass}
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        Supplier ID{' '}
                        <span className={`normal-case font-normal ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                            (optional)
                        </span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. SUP-RW-001"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value.toUpperCase())}
                        className={inputClass}
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                        isDark ? 'text-stone-400' : 'text-slate-500'
                    }`}>
                        Date Received
                    </label>
                    <input
                        type="date"
                        value={transactionDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className={inputClass}
                    />
                </div>

                {/* Collapsible shipment + FX section */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(v => !v)}
                    className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Shipment &amp; FX details
                </button>

                {showAdvanced && (
                    <div className={`space-y-4 p-4 rounded-xl border ${
                        isDark ? 'border-stone-700 bg-stone-800/50' : 'border-slate-200 bg-slate-50'
                    }`}>
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                isDark ? 'text-stone-400' : 'text-slate-500'
                            }`}>Ship Type</label>
                            <select value={shipType} onChange={(e) => setShipType(e.target.value)} className={inputClass}>
                                <option value="">Select...</option>
                                {['Sea', 'Road', 'Air'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>Port</label>
                                <input type="text" placeholder="e.g. Dar es Salaam" value={portName}
                                    onChange={(e) => setPortName(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>Country</label>
                                <input type="text" placeholder="e.g. Tanzania" value={country}
                                    onChange={(e) => setCountry(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>Departure Date</label>
                                <input type="date" value={departureTime}
                                    onChange={(e) => setDepartureTime(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>Arrival Date</label>
                                <input type="date" value={arrivalTime}
                                    onChange={(e) => setArrivalTime(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>USD → RWF</label>
                                <input type="number" min={0} placeholder="e.g. 1285" value={usdToRwf}
                                    onChange={(e) => setUsdToRwf(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                                    isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>EUR → RWF</label>
                                <input type="number" min={0} placeholder="e.g. 1450" value={eurToRwf}
                                    onChange={(e) => setEurToRwf(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !product || qty < 1 || !region}
                    className={`
                        w-full py-3 rounded-xl font-semibold text-sm
                        flex items-center justify-center gap-2
                        transition-all duration-200
                        bg-emerald-600 text-white
                        hover:bg-emerald-700 active:scale-[0.98]
                        disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing…
                        </>
                    ) : (
                        <>
                            <PackagePlus className="w-4 h-4" />
                            Confirm Receipt
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
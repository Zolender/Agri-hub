'use client';

import { AlertTriangle, Ship, Clock, Anchor } from 'lucide-react';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type AlertProduct = {
    id: string;
    quantity: number;
    reorderPointUnits: number;
    coverageDays: number | null;
    regions: string[];
};

export type ShipmentDelay = {
    id: string;
    portDelays: number;
    portName: string | null;
    currentStatus: string | null;
    productId: string;
    region: string;
};

// ── Coverage badge — colour-codes urgency at a glance ─────────────────────────

function CoverageBadge({ days }: { days: number | null }) {
    if (days === null) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 shrink-0">
                <AlertTriangle className="w-3 h-3" />
                Low Stock
            </span>
        );
    }
    const isUrgent = days < 7;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
            isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
            <Clock className="w-3 h-3" />
            {days}d left
        </span>
    );
}

// ── Reorder alert card ─────────────────────────────────────────────────────────

function ReorderCard({ alerts, isDark }: { alerts: AlertProduct[]; isDark: boolean }) {
    return (
        <div className={`rounded-xl border ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? 'border-stone-700' : 'border-stone-100'}`}>
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
                    Reorder Alerts
                </h3>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {alerts.length}
                </span>
            </div>

            <ul className="divide-y divide-transparent px-3 py-2 space-y-1">
                {alerts.map(p => (
                    <li
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
                                {p.id}
                            </p>
                            {p.regions.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {p.regions.map(r => (
                                        <span
                                            key={r}
                                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-stone-700 text-stone-400' : 'bg-stone-200 text-stone-600'}`}
                                        >
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                                    No recent sales region
                                </p>
                            )}
                        </div>
                        <CoverageBadge days={p.coverageDays} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ── Shipment delay card ────────────────────────────────────────────────────────

function ShipmentCard({ delays, isDark }: { delays: ShipmentDelay[]; isDark: boolean }) {
    return (
        <div className={`rounded-xl border ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? 'border-stone-700' : 'border-stone-100'}`}>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Ship className="w-4 h-4" />
                </div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
                    Shipment Delays
                </h3>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {delays.length}
                </span>
            </div>

            <ul className="px-3 py-2 space-y-1">
                {delays.map(s => (
                    <li
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}
                    >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-stone-700 text-amber-400' : 'bg-amber-50 text-amber-500'}`}>
                            <Anchor className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
                                {s.productId}
                            </p>
                            <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                {s.portName ?? 'Unknown port'} · {s.region}
                                {s.currentStatus ? ` · ${s.currentStatus}` : ''}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 shrink-0">
                            +{s.portDelays}d delay
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AlertsPanel({
    reorderAlerts,
    shipmentDelays,
}: {
    reorderAlerts: AlertProduct[];
    shipmentDelays: ShipmentDelay[];
}) {
    const { isDark } = useDarkMode();

    if (reorderAlerts.length === 0 && shipmentDelays.length === 0) return null;

    const bothPresent = reorderAlerts.length > 0 && shipmentDelays.length > 0;

    return (
        <div className={`grid gap-4 ${bothPresent ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {reorderAlerts.length > 0 && (
                <ReorderCard alerts={reorderAlerts} isDark={isDark} />
            )}
            {shipmentDelays.length > 0 && (
                <ShipmentCard delays={shipmentDelays} isDark={isDark} />
            )}
        </div>
    );
}

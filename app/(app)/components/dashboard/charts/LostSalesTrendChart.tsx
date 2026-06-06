'use client';

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type LostTrendPoint = { week: string; units: number; value: number };

function formatRwf(v: number): string {
    return v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl shadow-lg bg-stone-800 text-stone-100 px-3 py-2 text-xs space-y-1">
            <p className="font-semibold">{label}</p>
            {payload.map(entry => (
                <p key={entry.name}>
                    {entry.name}:{' '}
                    <span className="font-medium">
                        {entry.name === 'Value (RWF)'
                            ? entry.value.toLocaleString() + ' RWF'
                            : entry.value + ' units'}
                    </span>
                </p>
            ))}
        </div>
    );
}

export default function LostSalesTrendChart({ data }: { data: LostTrendPoint[] }) {
    const { isDark } = useDarkMode();
    const gridColor  = isDark ? '#292524' : '#f5f5f4';
    const axisColor  = isDark ? '#78716c' : '#a8a29e';

    const cardBg  = isDark ? 'bg-stone-900' : 'bg-white';
    const isEmpty = data.every(d => d.units === 0);

    if (isEmpty) {
        return (
            <div className={`rounded-xl shadow ${cardBg} p-6 flex items-center justify-center h-75`}>
                <p className="text-stone-400 text-sm">No lost sales recorded in this period.</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl shadow ${cardBg} p-6`}>
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-4">
                Lost Sales Trend
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: axisColor }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: axisColor }}
                        axisLine={false}
                        tickLine={false}
                        unit=" u"
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: axisColor }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatRwf}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(168,162,158,0.08)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#a8a29e' }} />
                    <Bar
                        yAxisId="left"
                        dataKey="units"
                        name="Units lost"
                        fill="#f59e0b"
                        radius={[3, 3, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        dataKey="value"
                        name="Value (RWF)"
                        stroke="#fb7185"
                        dot={false}
                        strokeWidth={2}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

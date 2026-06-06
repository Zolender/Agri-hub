'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type RegionTrendPoint = { week: string; [region: string]: number | string };

// Warm-toned palette consistent with the app's emerald/amber/stone design language
const REGION_COLORS = ['#10b981', '#f59e0b', '#f97316', '#84cc16', '#06b6d4'];

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
                    <span className="font-medium">{entry.value.toLocaleString()} units</span>
                </p>
            ))}
        </div>
    );
}

export default function SalesByRegionBar({ data }: { data: RegionTrendPoint[] }) {
    const { isDark } = useDarkMode();
    const gridColor  = isDark ? '#292524' : '#f5f5f4';
    const axisColor  = isDark ? '#78716c' : '#a8a29e';

    if (data.length === 0) {
        return (
            <div className="rounded-xl shadow bg-white dark:bg-stone-900 p-6 flex items-center justify-center h-75">
                <p className="text-stone-400 text-sm">No regional sales data for this period.</p>
            </div>
        );
    }

    const regions = Object.keys(data[0]).filter(k => k !== 'week');

    return (
        <div className="rounded-xl shadow bg-white dark:bg-stone-900 p-6">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-4">
                Sales by Region
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: axisColor }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: axisColor }}
                        axisLine={false}
                        tickLine={false}
                        unit=" u"
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(168,162,158,0.08)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#a8a29e' }} />
                    {regions.map((region, i) => (
                        <Bar
                            key={region}
                            dataKey={region}
                            fill={REGION_COLORS[i % REGION_COLORS.length]}
                            radius={[3, 3, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type TrendPoint = {
    week: string;    // label like "Jan 6"
    units: number;   // units sold that week
    revenue: number; // RWF revenue that week
};

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={`px-3 py-2 rounded-lg shadow-lg text-xs border ${
            isDark
                ? 'bg-stone-800 border-stone-700 text-stone-200'
                : 'bg-white border-stone-200 text-stone-800'
        }`}>
            <p className={`font-semibold mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <span className="font-medium">{p.value.toLocaleString()}</span>
                    {p.name === 'Revenue' ? ' RWF' : ' units'}
                </p>
            ))}
        </div>
    );
};

export default function WeeklyTrendChart({ data }: { data: TrendPoint[] }) {
    const { isDark } = useDarkMode();

    const gridColor  = isDark ? '#292524' : '#f5f5f4';
    const axisColor  = isDark ? '#78716c' : '#a8a29e';
    const cardBg     = isDark ? 'bg-stone-900' : 'bg-white';
    const titleColor = isDark ? 'text-stone-300' : 'text-stone-700';
    const emptyColor = isDark ? 'text-stone-600' : 'text-stone-400';

    if (data.length === 0) {
        return (
            <div className={`rounded-xl p-5 shadow h-full flex flex-col items-center justify-center gap-2 ${cardBg}`}>
                <p className={`text-sm font-medium ${emptyColor}`}>No sales data in the last 12 weeks</p>
                <p className={`text-xs ${isDark ? 'text-stone-700' : 'text-stone-300'}`}>
                    Import transactions to see trends
                </p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-5 shadow ${cardBg}`}>
            <h3 className={`text-sm font-semibold mb-1 ${titleColor}`}>Weekly Sales Trend</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                Units sold per week over the last 12 weeks
            </p>

            <ResponsiveContainer width="100%" height={220}>
                {/* AreaChart = LineChart + a filled region below the line.
                    type="monotone" makes the curve smooth instead of angular. */}
                <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <defs>
                        {/* Gradient fill: solid emerald at the top, fades to transparent at the bottom */}
                        <linearGradient id="unitsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: axisColor }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: axisColor }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Area
                        type="monotone"
                        dataKey="units"
                        name="Units sold"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#unitsGradient)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        animationDuration={600}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

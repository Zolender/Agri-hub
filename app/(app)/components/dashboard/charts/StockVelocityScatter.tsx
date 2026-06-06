'use client';

import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type VelocityPoint = {
    id: string;
    velocity: number;   // avg units sold per day (30d window)
    stock: number;      // current quantity
    isLowStock: boolean;
};

const CustomTooltip = ({ active, payload, isDark }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as VelocityPoint;
    return (
        <div className={`px-3 py-2 rounded-lg shadow-lg text-xs border ${
            isDark
                ? 'bg-stone-800 border-stone-700 text-stone-200'
                : 'bg-white border-stone-200 text-stone-800'
        }`}>
            <p className="font-semibold mb-1">{d.id}</p>
            <p>Daily sales: <span className="font-medium">{d.velocity} units</span></p>
            <p>In stock: <span className="font-medium">{d.stock.toLocaleString()}</span></p>
        </div>
    );
};

export default function StockVelocityScatter({ data }: { data: VelocityPoint[] }) {
    const { isDark } = useDarkMode();

    // Split into groups so each gets a distinct colour.
    // Dead stock (no sales in 30d) → grey, fast but low stock → amber, healthy movers → emerald
    const dead    = data.filter(d => d.velocity === 0);
    const atRisk  = data.filter(d => d.velocity > 0 && d.isLowStock);
    const healthy = data.filter(d => d.velocity > 0 && !d.isLowStock);

    const gridColor    = isDark ? '#292524' : '#f5f5f4';
    const axisColor    = isDark ? '#78716c' : '#a8a29e';
    const cardBg       = isDark ? 'bg-stone-900' : 'bg-white';
    const title        = isDark ? 'text-stone-300' : 'text-stone-700';
    const empty        = isDark ? 'text-stone-600' : 'text-stone-400';

    if (data.length === 0) {
        return (
            <div className={`rounded-xl p-5 shadow h-full flex items-center justify-center ${cardBg}`}>
                <p className={`text-sm ${empty}`}>No product data yet</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-5 shadow ${cardBg}`}>
            <h3 className={`text-sm font-semibold mb-1 ${title}`}>Stock Velocity Matrix</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                Horizontal = how fast it sells · Vertical = how much is left
            </p>

            <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="velocity"
                        type="number"
                        name="Daily Sales"
                        tick={{ fontSize: 11, fill: axisColor }}
                        label={{ value: 'avg units/day', position: 'insideBottom', offset: -2, fontSize: 10, fill: axisColor }}
                        height={36}
                    />
                    <YAxis
                        dataKey="stock"
                        type="number"
                        name="Stock"
                        tick={{ fontSize: 11, fill: axisColor }}
                        width={48}
                    />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: axisColor }}
                    />

                    {/* Dead stock — grey */}
                    {dead.length > 0 && (
                        <Scatter name="Dead stock" data={dead} fill="#a8a29e" opacity={0.7} />
                    )}
                    {/* Moving but running low — amber */}
                    {atRisk.length > 0 && (
                        <Scatter name="At risk" data={atRisk} fill="#f59e0b" />
                    )}
                    {/* Healthy movers — emerald */}
                    {healthy.length > 0 && (
                        <Scatter name="Healthy" data={healthy} fill="#10b981" />
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

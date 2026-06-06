'use client';

import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '@/app/(app)/components/DarkModeContext';

export type StatusEntry = { name: string; value: number; fill: string };

// Custom tooltip — matches the app's card style
const CustomTooltip = ({ active, payload, isDark }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    return (
        <div className={`px-3 py-2 rounded-lg shadow-lg text-sm border ${
            isDark
                ? 'bg-stone-800 border-stone-700 text-stone-200'
                : 'bg-white border-stone-200 text-stone-800'
        }`}>
            <span className="font-semibold">{name}</span>
            <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                {' '}— {value} product{value !== 1 ? 's' : ''}
            </span>
        </div>
    );
};

export default function StockStatusDonut({ data }: { data: StatusEntry[] }) {
    const { isDark } = useDarkMode();
    const total = data.reduce((sum, d) => sum + d.value, 0);

    const cardBg  = isDark ? 'bg-stone-900' : 'bg-white';
    const title   = isDark ? 'text-stone-300' : 'text-stone-700';
    const empty   = isDark ? 'text-stone-600' : 'text-stone-400';

    if (total === 0) {
        return (
            <div className={`rounded-xl p-5 shadow h-full flex items-center justify-center ${cardBg}`}>
                <p className={`text-sm ${empty}`}>No stock data yet</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-5 shadow ${cardBg}`}>
            <h3 className={`text-sm font-semibold mb-3 ${title}`}>
                Stock Status Breakdown
            </h3>

            {/* Relative container lets us overlay the center label on the donut hole */}
            <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={58}
                            outerRadius={82}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={600}
                        >
                            {data.map((entry, i) => (
                                // Cell gives each slice its own colour — without this,
                                // all slices would share the same default colour
                                <Cell key={i} fill={entry.fill} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                fontSize: '11px',
                                color: isDark ? '#a8a29e' : '#78716c',
                                paddingTop: '4px',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center label sits inside the donut hole via absolute positioning.
                    The chart is 220px tall, legend is ~36px, pie center is at 45% of 184px ≈ 83px from top */}
                <div
                    className="absolute inset-x-0 pointer-events-none flex flex-col items-center justify-center"
                    style={{ top: 0, height: 184 }}
                >
                    <span
                        className={`text-2xl font-black leading-none ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                    >
                        {total}
                    </span>
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        products
                    </span>
                </div>
            </div>
        </div>
    );
}

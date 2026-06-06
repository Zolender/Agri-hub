'use client';

// This file exists solely to re-export chart components with ssr:false.
// next/dynamic({ ssr: false }) must live in a "use client" context —
// a Server Component cannot call it directly. The server page imports
// from here, not from the chart files directly.

import dynamic from 'next/dynamic';

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
    <div
        className="rounded-xl shadow bg-stone-100 dark:bg-stone-800 animate-pulse"
        style={{ height }}
    />
);

export const StockStatusDonut = dynamic(
    () => import('./StockStatusDonut'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

export const StockVelocityScatter = dynamic(
    () => import('./StockVelocityScatter'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

export const WeeklyTrendChart = dynamic(
    () => import('./WeeklyTrendChart'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

export const SalesByRegionBar = dynamic(
    () => import('./SalesByRegionBar'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

export const LostSalesTrendChart = dynamic(
    () => import('./LostSalesTrendChart'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

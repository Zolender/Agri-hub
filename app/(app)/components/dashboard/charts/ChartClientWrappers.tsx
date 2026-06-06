'use client';

// This file exists solely to re-export chart components with ssr:false.
// next/dynamic({ ssr: false }) must live in a "use client" context —
// a Server Component cannot call it directly. The server page imports
// from here, not from the chart files directly.

import dynamic from 'next/dynamic';

export const StockStatusDonut = dynamic(
    () => import('./StockStatusDonut'),
    { ssr: false }
);

export const StockVelocityScatter = dynamic(
    () => import('./StockVelocityScatter'),
    { ssr: false }
);

export const WeeklyTrendChart = dynamic(
    () => import('./WeeklyTrendChart'),
    { ssr: false }
);

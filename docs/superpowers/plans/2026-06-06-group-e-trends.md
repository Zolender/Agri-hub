# Group E — Trends Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stacked "Trends" section to the dashboard with a regional sales bar chart and a lost-sales composed chart, reusing the existing `weeklyTransactions` query.

**Architecture:** Two new `"use client"` Recharts components receive pre-computed arrays from the server page. The server page extends one existing Prisma query with two new fields and groups the data in JS. Both components are SSR-gated through `ChartClientWrappers.tsx` using the same `next/dynamic({ ssr: false })` pattern established in Group D.

**Tech Stack:** Next.js 15 App Router, Recharts, Prisma, TypeScript, Tailwind CSS, date-fns

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/(app)/components/dashboard/charts/SalesByRegionBar.tsx` | Create | Grouped bar chart, one bar per region per week |
| `app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx` | Create | ComposedChart — amber bars (units) + rose line (RWF value) |
| `app/(app)/components/dashboard/charts/ChartClientWrappers.tsx` | Modify | Add two `next/dynamic` SSR-safe exports |
| `app/(app)/dashboard/page.tsx` | Modify | Extend query select, add JS grouping, add imports, add Section 4 JSX |

---

## Task 1: Create SalesByRegionBar

**Files:**
- Create: `app/(app)/components/dashboard/charts/SalesByRegionBar.tsx`

- [ ] **Step 1: Write the component**

Create `app/(app)/components/dashboard/charts/SalesByRegionBar.tsx` with this exact content:

```tsx
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

export type RegionTrendPoint = { week: string; [region: string]: number | string };

const REGION_COLORS = ['#10b981', '#f59e0b', '#38bdf8', '#a78bfa', '#fb7185'];

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
    if (data.length === 0) {
        return (
            <div className="rounded-xl shadow bg-white dark:bg-stone-900 p-6 flex items-center justify-center h-[300px]">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#44403c" />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: '#a8a29e' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#a8a29e' }}
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
```

- [ ] **Step 2: TypeScript check**

Run from the project root:
```bash
npx tsc --noEmit
```
Expected: no output (clean). If errors appear, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/components/dashboard/charts/SalesByRegionBar.tsx
git commit -m "feat: add SalesByRegionBar grouped bar chart component"
```

---

## Task 2: Create LostSalesTrendChart

**Files:**
- Create: `app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx`

- [ ] **Step 1: Write the component**

Create `app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx` with this exact content:

```tsx
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
    const isEmpty = data.every(d => d.units === 0);

    if (isEmpty) {
        return (
            <div className="rounded-xl shadow bg-white dark:bg-stone-900 p-6 flex items-center justify-center h-[300px]">
                <p className="text-stone-400 text-sm">No lost sales recorded in this period.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl shadow bg-white dark:bg-stone-900 p-6">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-4">
                Lost Sales Trend
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#44403c" />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: '#a8a29e' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#a8a29e' }}
                        axisLine={false}
                        tickLine={false}
                        unit=" u"
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#a8a29e' }}
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output. Fix any errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx
git commit -m "feat: add LostSalesTrendChart composed bar+line chart component"
```

---

## Task 3: Add SSR wrappers to ChartClientWrappers

**Files:**
- Modify: `app/(app)/components/dashboard/charts/ChartClientWrappers.tsx`

The file currently ends after the `WeeklyTrendChart` export. Append two more exports using the identical `dynamic` pattern.

- [ ] **Step 1: Add the two new exports**

Open `app/(app)/components/dashboard/charts/ChartClientWrappers.tsx`. Append these two blocks after the existing `WeeklyTrendChart` export:

```tsx
export const SalesByRegionBar = dynamic(
    () => import('./SalesByRegionBar'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);

export const LostSalesTrendChart = dynamic(
    () => import('./LostSalesTrendChart'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
);
```

The full file after the edit should look like this:

```tsx
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/components/dashboard/charts/ChartClientWrappers.tsx
git commit -m "feat: add SSR wrappers for SalesByRegionBar and LostSalesTrendChart"
```

---

## Task 4: Update dashboard/page.tsx

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

Four changes in this file: (1) extend the query select, (2) add JS grouping, (3) add imports, (4) add Section 4 JSX.

- [ ] **Step 1: Extend the weeklyTransactions query select**

Find the `weeklyTransactions` query block (currently around line 103). Change its `select` from:

```ts
select: {
    quantityOrderedUnits: true,
    transactionDate: true,
    product: { select: { sellingPriceRwf: true } },
},
```

To:

```ts
select: {
    quantityOrderedUnits: true,
    lostSaleQtyUnits: true,
    region: true,
    transactionDate: true,
    product: { select: { sellingPriceRwf: true } },
},
```

- [ ] **Step 2: Add regionTrendData and lostTrendData computations**

Find the comment `// ── Alert data` (currently around line 226). Insert the following block **immediately before** it:

```ts
    // ── Regional trend data ────────────────────────────────────────────────
    // Build a week × region matrix, then cap to top-5 regions by total units

    const regionWeekMap = new Map<string, { label: string; byRegion: Map<string, number> }>();
    const regionTotals  = new Map<string, number>();

    for (const txn of weeklyTransactions) {
        const monday  = getWeekStart(txn.transactionDate);
        const weekKey = monday.toISOString().split('T')[0];
        const label   = format(monday, 'MMM d');

        if (!regionWeekMap.has(weekKey)) {
            regionWeekMap.set(weekKey, { label, byRegion: new Map() });
        }
        const slot = regionWeekMap.get(weekKey)!;
        slot.byRegion.set(txn.region, (slot.byRegion.get(txn.region) ?? 0) + txn.quantityOrderedUnits);
        regionTotals.set(txn.region, (regionTotals.get(txn.region) ?? 0) + txn.quantityOrderedUnits);
    }

    const topRegions = [...regionTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([r]) => r);
    const hasOther = regionTotals.size > 5;

    const regionTrendData: RegionTrendPoint[] = Array.from(regionWeekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, { label, byRegion }]) => {
            const point: RegionTrendPoint = { week: label };
            for (const region of topRegions) {
                point[region] = byRegion.get(region) ?? 0;
            }
            if (hasOther) {
                let other = 0;
                for (const [region, units] of byRegion.entries()) {
                    if (!topRegions.includes(region)) other += units;
                }
                point['Other'] = other;
            }
            return point;
        });

    // ── Lost sales trend data ──────────────────────────────────────────────
    // Group lostSaleQtyUnits and their RWF value by week

    const lostWeekMap = new Map<string, { label: string; units: number; value: number }>();

    for (const txn of weeklyTransactions) {
        const monday  = getWeekStart(txn.transactionDate);
        const weekKey = monday.toISOString().split('T')[0];
        const label   = format(monday, 'MMM d');

        if (!lostWeekMap.has(weekKey)) {
            lostWeekMap.set(weekKey, { label, units: 0, value: 0 });
        }
        const slot = lostWeekMap.get(weekKey)!;
        slot.units += txn.lostSaleQtyUnits;
        slot.value += txn.lostSaleQtyUnits * txn.product.sellingPriceRwf;
    }

    const lostTrendData: LostTrendPoint[] = Array.from(lostWeekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, { label, units, value }]) => ({
            week:  label,
            units,
            value: Math.round(value),
        }));

```

- [ ] **Step 3: Add imports**

Change the existing ChartClientWrappers import line (line 8) from:

```ts
import { StockStatusDonut, StockVelocityScatter, WeeklyTrendChart } from "../components/dashboard/charts/ChartClientWrappers";
```

To:

```ts
import { StockStatusDonut, StockVelocityScatter, WeeklyTrendChart, SalesByRegionBar, LostSalesTrendChart } from "../components/dashboard/charts/ChartClientWrappers";
```

Then add two type-only imports after the existing `import type` lines (currently lines 9–11):

```ts
import type { RegionTrendPoint } from "../components/dashboard/charts/SalesByRegionBar";
import type { LostTrendPoint } from "../components/dashboard/charts/LostSalesTrendChart";
```

- [ ] **Step 4: Add Section 4 JSX**

Find the `{/* ── Section 4: Alerts Panel */}` comment block. Insert the following **immediately before** it:

```tsx
            {/* ── Section 4: Trends ─────────────────────────────────────── */}
            <div>
                <SectionLabel title="Trends" />
                <div className="flex flex-col gap-6">
                    <SalesByRegionBar data={regionTrendData} />
                    <LostSalesTrendChart data={lostTrendData} />
                </div>
            </div>
```

Also update the Alerts comment to say Section 5:

```tsx
            {/* ── Section 5: Alerts Panel ──────────────────────────────────── */}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output. The two most common errors here and their fixes:
- `Property 'lostSaleQtyUnits' does not exist` → the query select in Step 1 was not saved correctly
- `Cannot find name 'RegionTrendPoint'` → the import in Step 3 is missing

- [ ] **Step 6: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: add Trends section with regional and lost-sales charts to dashboard"
```

---

## Task 5: Verify

- [ ] **Step 1: Final TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 2: Start the dev server and inspect**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. Scroll past the Financial Overview section. Confirm:

1. A "Trends" `SectionLabel` appears
2. `SalesByRegionBar` renders with coloured bars grouped by week, one colour per region, legend at bottom
3. `LostSalesTrendChart` renders below it with amber bars (units) and a rose line (RWF value), two Y-axes
4. Both charts show loading skeletons briefly before hydrating (this confirms `ssr: false` is working)
5. Hovering either chart shows the styled tooltip (dark stone card, no slide-in animation)
6. The Alerts panel still renders below the Trends section

- [ ] **Step 3: Commit verification note**

If all checks pass, no extra commit is needed — the feature is already committed in Tasks 1–4.

If any visual issue was found and fixed in Step 2, commit those fixes:

```bash
git add -p
git commit -m "fix: correct Trends section visual issues after review"
```

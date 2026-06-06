# Group E — Trends Section Design

**Date:** 2026-06-06
**Branch:** dev
**Status:** Approved

## Overview

Add a new "Trends" section to the dashboard between the Financial Overview and the Alerts panel. The section contains two stacked charts:

1. **SalesByRegionBar** — weekly grouped bar chart showing units sold per region
2. **LostSalesTrendChart** — weekly ComposedChart showing lost sales units (bars) and lost sales value in RWF (line)

## Data Layer

### Query change — `weeklyTransactions` in `dashboard/page.tsx`

Add `lostSaleQtyUnits` and `region` to the existing `select` block. No new query is added.

```ts
prisma.transaction.findMany({
    where: { movementType: "Sale", transactionDate: { gte: twelveWeeksAgo } },
    select: {
        quantityOrderedUnits: true,
        lostSaleQtyUnits: true,   // new
        region: true,              // new
        transactionDate: true,
        product: { select: { sellingPriceRwf: true } },
    },
    orderBy: { transactionDate: "asc" },
})
```

### JS grouping (same loop, three outputs)

After the existing `weeklyMap` loop, two additional maps are built from the same `weeklyTransactions` array:

**`regionMap: Map<week, Map<region, units>>`**
- Key: Monday ISO date string (reuses `getWeekStart()`)
- Value: a nested map of `region → total units sold that week`

**`lostMap: Map<week, { units: number; value: number }>`**
- Key: Monday ISO date string
- Value: `lostSaleQtyUnits` summed, and `lostSaleQtyUnits * sellingPriceRwf` summed

### Region cap logic

Before converting `regionMap` to an array, collect all region keys across all weeks. Sort regions by their total units sold across all 12 weeks, descending. Keep the top 5; sum the rest into `"Other"`. If 5 or fewer regions exist, no capping occurs.

### Output types

```ts
// passed to SalesByRegionBar
type RegionTrendPoint = { week: string; [region: string]: number | string }
// e.g. { week: "Jan 6", Musanze: 120, Nyagatare: 85, Kigali: 40 }

// passed to LostSalesTrendChart
type LostTrendPoint = { week: string; units: number; value: number }
```

## Components

### `SalesByRegionBar.tsx`

**Location:** `app/(app)/components/dashboard/charts/SalesByRegionBar.tsx`

- `"use client"` directive
- Props: `{ data: RegionTrendPoint[] }`
- Exports `RegionTrendPoint` type
- Recharts `BarChart` wrapped in `ResponsiveContainer` (height 300)
- One `<Bar>` per region key, rendered by mapping over the keys discovered from `data[0]` (excluding `"week"`)
- Color palette (in order): `['#10b981', '#f59e0b', '#38bdf8', '#a78bfa', '#fb7185']`
- `<CartesianGrid strokeDasharray="3 3" vertical={false}>`
- `<XAxis dataKey="week">`, `<YAxis>` with unit label "units"
- `<Legend>` at bottom
- Custom tooltip: card style matching existing charts (stone-800 bg, stone-100 text, 12px font)
- Empty state: centered text when `data.length === 0`

### `LostSalesTrendChart.tsx`

**Location:** `app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx`

- `"use client"` directive
- Props: `{ data: LostTrendPoint[] }`
- Exports `LostTrendPoint` type
- Recharts `ComposedChart` wrapped in `ResponsiveContainer` (height 300)
- `<Bar dataKey="units" fill="#f59e0b" yAxisId="left" name="Units lost">`
- `<Line dataKey="value" stroke="#fb7185" yAxisId="right" dot={false} name="Value (RWF)">`
- Left `<YAxis yAxisId="left">` label "Units"
- Right `<YAxis yAxisId="right" orientation="right">` — values formatted with `k` suffix (e.g. 450000 → "450k")
- `<CartesianGrid strokeDasharray="3 3" vertical={false}>`
- `<XAxis dataKey="week">`
- `<Legend>` at bottom
- Custom tooltip: shows units and formatted RWF value
- Empty state: centered text when all `data` entries have `units === 0`

### `ChartClientWrappers.tsx` additions

Two new dynamic exports using the existing pattern:

```ts
export const SalesByRegionBar = dynamic(
    () => import('./SalesByRegionBar'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
)

export const LostSalesTrendChart = dynamic(
    () => import('./LostSalesTrendChart'),
    { ssr: false, loading: () => <ChartSkeleton height={310} /> }
)
```

## Dashboard Layout

### Section order after Group E

| # | Section | Component |
|---|---------|-----------|
| 1 | Primary KPI cards | `AnimatedStatCard` ×4 |
| 2 | Stock Intelligence | `StockStatusDonut` + `StockVelocityScatter` |
| 3 | Financial Overview | `FinancialMiniCard` ×3 + `WeeklyTrendChart` |
| 4 | Trends *(new)* | `SalesByRegionBar` + `LostSalesTrendChart` |
| 5 | Alerts | `AlertsPanel` |

### New JSX block

```tsx
{/* Section 4: Trends */}
<div>
    <SectionLabel title="Trends" />
    <div className="flex flex-col gap-6">
        <SalesByRegionBar data={regionTrendData} />
        <LostSalesTrendChart data={lostTrendData} />
    </div>
</div>
```

## Error Handling and Edge Cases

| Case | Behaviour |
|------|-----------|
| No transactions in 12-week window | Both charts show empty state |
| All `lostSaleQtyUnits` are 0 | `LostSalesTrendChart` shows empty state |
| More than 5 regions | Excess grouped into "Other" bar |
| A region missing for some weeks | Recharts renders 0 (no bar) for that week naturally |
| Single week of data | Both charts render; they look sparse but do not break |

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/dashboard/page.tsx` | Add `lostSaleQtyUnits`, `region` to `weeklyTransactions` select; add region cap logic; add `regionTrendData` and `lostTrendData` computed values; import new wrappers; add Section 4 JSX |
| `app/(app)/components/dashboard/charts/SalesByRegionBar.tsx` | New file |
| `app/(app)/components/dashboard/charts/LostSalesTrendChart.tsx` | New file |
| `app/(app)/components/dashboard/charts/ChartClientWrappers.tsx` | Add two dynamic exports |

import type { Metadata } from 'next';
import prisma from "@/app/lib/db";
import AnimatedStatCard from "@/app/(app)/components/dashboard/AnimatedStatCard";

export const metadata: Metadata = { title: 'Dashboard | AgriHub' };
import AlertsPanel, { type AlertProduct, type ShipmentDelay } from "../components/dashboard/AlertsPanel";
import SectionLabel from "../components/dashboard/charts/SectionLabel";
import FinancialMiniCard from "../components/dashboard/charts/FinancialMiniCard";
import { formatDistanceToNow, format } from "date-fns";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { StockStatusDonut, StockVelocityScatter, WeeklyTrendChart, SalesByRegionBar, LostSalesTrendChart } from "../components/dashboard/charts/ChartClientWrappers";
import type { StatusEntry } from "../components/dashboard/charts/StockStatusDonut";
import type { VelocityPoint } from "../components/dashboard/charts/StockVelocityScatter";
import type { TrendPoint } from "../components/dashboard/charts/WeeklyTrendChart";
import type { RegionTrendPoint } from "../components/dashboard/charts/SalesByRegionBar";
import type { LostTrendPoint } from "../components/dashboard/charts/LostSalesTrendChart";

// Shipments delayed beyond this many days are surfaced as warnings
const PORT_DELAY_THRESHOLD = 2;

// Returns the Monday of the week containing `date`, at midnight UTC
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

export default async function DashboardPage() {
    const thirtyDaysAgo  = new Date(Date.now() - 30  * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo  = new Date(Date.now() - 90  * 24 * 60 * 60 * 1000);
    const twelveWeeksAgo = new Date(Date.now() - 84  * 24 * 60 * 60 * 1000);

    const [
        products,
        latestTransaction,
        lostSalesData,
        fulfillmentData,
        recentSaleIds,
        recentSalesUnits,
        salesByProduct,
        regionsByProduct,
        shipmentDelayData,
        weeklyTransactions,
    ] = await Promise.all([
        prisma.product.findMany({
            select: {
                id: true,
                categoryId: true,
                unitOfMeasure: true,
                unitCostRwf: true,
                sellingPriceRwf: true,
                landedCostRwf: true,
                quantity: true,
                reorderPointUnits: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.transaction.findFirst({
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        }),
        prisma.transaction.findMany({
            where: { lostSaleQtyUnits: { gt: 0 } },
            select: {
                lostSaleQtyUnits: true,
                product: { select: { sellingPriceRwf: true } },
            },
        }),
        prisma.transactionMetrics.aggregate({
            _avg: { fulfillmentRatio: true },
        }),
        prisma.transaction.findMany({
            where: { movementType: "Sale", transactionDate: { gte: ninetyDaysAgo } },
            select: { productId: true },
            distinct: ["productId"],
        }),
        prisma.transaction.aggregate({
            where: { movementType: "Sale", transactionDate: { gte: thirtyDaysAgo } },
            _sum: { quantityOrderedUnits: true },
        }),
        prisma.transaction.groupBy({
            by: ["productId"],
            where: { movementType: "Sale", transactionDate: { gte: thirtyDaysAgo } },
            _sum: { quantityOrderedUnits: true },
        }),
        prisma.transaction.groupBy({
            by: ["productId", "region"],
            where: { movementType: "Sale", transactionDate: { gte: thirtyDaysAgo } },
            _count: { productId: true },
        }),
        prisma.shipment.findMany({
            where: {
                portDelays: { gt: PORT_DELAY_THRESHOLD },
                transaction: { transactionDate: { gte: ninetyDaysAgo } },
            },
            orderBy: { portDelays: "desc" },
            take: 5,
            select: {
                id: true,
                portDelays: true,
                portName: true,
                currentStatus: true,
                transaction: { select: { productId: true, region: true } },
            },
        }),
        // Weekly sales — used for the trend chart and secondary KPI figures
        prisma.transaction.findMany({
            where: { movementType: "Sale", transactionDate: { gte: twelveWeeksAgo } },
            select: {
                quantityOrderedUnits: true,
                lostSaleQtyUnits: true,
                region: true,
                transactionDate: true,
                product: { select: { sellingPriceRwf: true } },
            },
            orderBy: { transactionDate: "asc" },
        }),
    ]);

    const lastUpdated = latestTransaction
        ? formatDistanceToNow(latestTransaction.createdAt, { addSuffix: true })
        : "Never";

    // ── Primary KPI calculations ───────────────────────────────────────────────

    const lostSalesValue = lostSalesData.reduce(
        (sum, t) => sum + t.lostSaleQtyUnits * t.product.sellingPriceRwf,
        0
    );

    const fulfillmentRate =
        fulfillmentData._avg.fulfillmentRatio !== null
            ? fulfillmentData._avg.fulfillmentRatio.toFixed(1)
            : null;

    const recentlySoldIds  = new Set(recentSaleIds.map(t => t.productId));
    const capitalLock      = products
        .filter(p => !recentlySoldIds.has(p.id) && p.quantity > 0)
        .reduce((sum, p) => sum + p.quantity * p.landedCostRwf, 0);

    const totalSalesUnits30d = recentSalesUnits._sum.quantityOrderedUnits ?? 0;
    const totalCurrentStock  = products.reduce((sum, p) => sum + p.quantity, 0);
    const turnoverRate =
        totalCurrentStock > 0
            ? Math.round((totalSalesUnits30d / totalCurrentStock) * 10) / 10
            : 0;

    // ── Coverage Days per product ──────────────────────────────────────────────

    const salesMap = new Map(
        salesByProduct.map(s => [s.productId, s._sum.quantityOrderedUnits ?? 0])
    );

    const productsWithMetrics = products.map(p => {
        const salesIn30d    = salesMap.get(p.id) ?? 0;
        const avgDailySales = salesIn30d / 30;
        return {
            ...p,
            coverageDays: avgDailySales > 0
                ? Math.round(p.quantity / avgDailySales)
                : null,
        };
    });

    // ── Secondary KPI figures ──────────────────────────────────────────────────

    // Working Capital: total value of all stock at landed cost
    const workingCapital = products.reduce(
        (sum, p) => sum + p.quantity * p.landedCostRwf,
        0
    );

    // Days Sales of Inventory: how many days before all current stock is sold at the 30d rate
    const dsi = totalSalesUnits30d > 0
        ? Math.round(totalCurrentStock / (totalSalesUnits30d / 30))
        : null;

    // ── Stock status categories (for donut chart) ──────────────────────────────
    // Priority: Obsolete > Overstocked > Low Stock > Healthy
    const counts = { Healthy: 0, 'Low Stock': 0, Overstocked: 0, Obsolete: 0 };

    for (const p of productsWithMetrics) {
        if (!recentlySoldIds.has(p.id) && p.quantity > 0) {
            counts.Obsolete++;
        } else if (p.coverageDays !== null && p.coverageDays > 90) {
            counts.Overstocked++;
        } else if (p.quantity <= p.reorderPointUnits || (p.coverageDays !== null && p.coverageDays < 14)) {
            counts['Low Stock']++;
        } else if (p.quantity > 0) {
            counts.Healthy++;
        }
    }

    const statusData: StatusEntry[] = [
        { name: 'Healthy',     value: counts.Healthy,      fill: '#10b981' },
        { name: 'Low Stock',   value: counts['Low Stock'],  fill: '#f59e0b' },
        { name: 'Overstocked', value: counts.Overstocked,   fill: '#60a5fa' },
        { name: 'Obsolete',    value: counts.Obsolete,      fill: '#ef4444' },
    ].filter(d => d.value > 0); // hide zero-value slices — they'd render as invisible slivers

    // ── Velocity data (for scatter chart) ─────────────────────────────────────

    const velocityData: VelocityPoint[] = productsWithMetrics.map(p => ({
        id:         p.id,
        velocity:   Math.round((salesMap.get(p.id) ?? 0) / 30 * 10) / 10,
        stock:      p.quantity,
        isLowStock: p.quantity <= p.reorderPointUnits,
    }));

    // ── Weekly trend data (for area chart) ────────────────────────────────────
    // Group transactions by ISO week, compute units sold and revenue per week

    const weeklyMap = new Map<string, { units: number; revenue: number }>();
    for (const txn of weeklyTransactions) {
        const monday = getWeekStart(txn.transactionDate);
        const key    = monday.toISOString().split('T')[0];
        const entry  = weeklyMap.get(key) ?? { units: 0, revenue: 0 };
        entry.units   += txn.quantityOrderedUnits;
        entry.revenue += txn.quantityOrderedUnits * txn.product.sellingPriceRwf;
        weeklyMap.set(key, entry);
    }

    const trendData: TrendPoint[] = Array.from(weeklyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateStr, data]) => ({
            week:    format(new Date(dateStr), 'MMM d'),
            units:   data.units,
            revenue: Math.round(data.revenue),
        }));

    // ── Regional trend data ────────────────────────────────────────────────────
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

    // ── Lost sales trend data ──────────────────────────────────────────────────
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

    // ── Alert data ─────────────────────────────────────────────────────────────

    const regionsMap = new Map<string, string[]>();
    for (const row of regionsByProduct) {
        const list = regionsMap.get(row.productId) ?? [];
        if (!list.includes(row.region)) list.push(row.region);
        regionsMap.set(row.productId, list);
    }

    const reorderAlerts: AlertProduct[] = productsWithMetrics
        .filter(p =>
            p.quantity <= p.reorderPointUnits ||
            (p.coverageDays !== null && p.coverageDays < 14)
        )
        .sort((a, b) => {
            if (a.coverageDays === null && b.coverageDays === null) return 0;
            if (a.coverageDays === null) return 1;
            if (b.coverageDays === null) return -1;
            return a.coverageDays - b.coverageDays;
        })
        .map(p => ({
            id:               p.id,
            quantity:         p.quantity,
            reorderPointUnits: p.reorderPointUnits,
            coverageDays:     p.coverageDays,
            regions:          regionsMap.get(p.id) ?? [],
        }));

    const shipmentDelays: ShipmentDelay[] = shipmentDelayData.map(s => ({
        id:            s.id,
        portDelays:    s.portDelays!,
        portName:      s.portName,
        currentStatus: s.currentStatus,
        productId:     s.transaction.productId,
        region:        s.transaction.region,
    }));

    return (
        <div className="space-y-8">
            <DashboardHeader lastUpdated={lastUpdated} />

            {/* ── Section 1: Primary KPI cards ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatedStatCard
                    title="Turnover Rate"
                    value={`${turnoverRate}×`}
                    iconName="RefreshCcw"
                    description="Stock turns in last 30 days"
                />
                <AnimatedStatCard
                    title="Fulfillment Rate"
                    value={fulfillmentRate !== null ? `${fulfillmentRate}%` : "No data"}
                    iconName="Target"
                    description="Avg demand actually met"
                />
                <AnimatedStatCard
                    title="Lost Sales Value"
                    value={`${lostSalesValue.toLocaleString()} RWF`}
                    iconName="TrendingDown"
                    description="Revenue lost to stockouts"
                />
                <AnimatedStatCard
                    title="Capital Lock"
                    value={`${capitalLock.toLocaleString()} RWF`}
                    iconName="Lock"
                    description="Stock idle 90+ days (landed cost)"
                />
            </div>

            {/* ── Section 2: Stock Intelligence ────────────────────────────── */}
            <div>
                <SectionLabel title="Stock Intelligence" />
                {/* 40 / 60 split: donut is compact, scatter needs horizontal room */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2">
                        <StockStatusDonut data={statusData} />
                    </div>
                    <div className="lg:col-span-3">
                        <StockVelocityScatter data={velocityData} />
                    </div>
                </div>
            </div>

            {/* ── Section 3: Financial Overview ────────────────────────────── */}
            <div>
                <SectionLabel title="Financial Overview" />
                {/* 30 / 70 split: mini-stats give context, trend chart dominates */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <FinancialMiniCard
                            title="Working Capital"
                            value={`${workingCapital.toLocaleString()} RWF`}
                            subtitle="Total stock at landed cost"
                        />
                        <FinancialMiniCard
                            title="Days Sales of Inventory"
                            value={dsi !== null ? `${dsi}d` : "No sales data"}
                            subtitle="Days until stock runs out at 30d rate"
                            highlight={dsi !== null && dsi < 14 ? 'warn' : 'neutral'}
                        />
                        <FinancialMiniCard
                            title="Sales Recovery Potential"
                            value={`${lostSalesValue.toLocaleString()} RWF`}
                            subtitle="Lost revenue recoverable by restocking"
                            highlight={lostSalesValue > 0 ? 'warn' : 'good'}
                        />
                    </div>
                    <div className="lg:col-span-7">
                        <WeeklyTrendChart data={trendData} />
                    </div>
                </div>
            </div>

            {/* ── Section 4: Trends ─────────────────────────────────────────── */}
            <div>
                <SectionLabel title="Trends" />
                <div className="flex flex-col gap-6">
                    <SalesByRegionBar data={regionTrendData} />
                    <LostSalesTrendChart data={lostTrendData} />
                </div>
            </div>

            {/* ── Section 5: Alerts Panel ───────────────────────────────────── */}
            <AlertsPanel
                reorderAlerts={reorderAlerts}
                shipmentDelays={shipmentDelays}
            />
        </div>
    );
}

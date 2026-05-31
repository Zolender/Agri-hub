import prisma from "@/app/lib/db";
import AnimatedStatCard from "@/app/(app)/components/dashboard/AnimatedStatCard";
import StockOnHandTable from "../components/dashboard/StockOnHandTable";
import AlertsPanel, { type AlertProduct, type ShipmentDelay } from "../components/dashboard/AlertsPanel";
import { formatDistanceToNow } from "date-fns";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { auth } from "@/app/lib/auth";

// Shipments delayed beyond this many days are surfaced as warnings
const PORT_DELAY_THRESHOLD = 2;

export default async function DashboardPage() {
    const session = await auth();
    const userRole = (session?.user?.role ?? 'ANALYST') as 'ADMIN' | 'MANAGER' | 'ANALYST';

    const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

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
        // Lost Sales Value: transactions that recorded unfulfilled demand
        prisma.transaction.findMany({
            where: { lostSaleQtyUnits: { gt: 0 } },
            select: {
                lostSaleQtyUnits: true,
                product: { select: { sellingPriceRwf: true } },
            },
        }),
        // Fulfillment Rate: average across all TransactionMetrics rows
        prisma.transactionMetrics.aggregate({
            _avg: { fulfillmentRatio: true },
        }),
        // Capital Lock: products that had a Sale in the last 90 days
        prisma.transaction.findMany({
            where: {
                movementType: "Sale",
                transactionDate: { gte: ninetyDaysAgo },
            },
            select: { productId: true },
            distinct: ["productId"],
        }),
        // Turnover Rate: total units sold in last 30 days
        prisma.transaction.aggregate({
            where: {
                movementType: "Sale",
                transactionDate: { gte: thirtyDaysAgo },
            },
            _sum: { quantityOrderedUnits: true },
        }),
        // Coverage Days: units sold per product in last 30 days
        prisma.transaction.groupBy({
            by: ["productId"],
            where: {
                movementType: "Sale",
                transactionDate: { gte: thirtyDaysAgo },
            },
            _sum: { quantityOrderedUnits: true },
        }),
        // Alert regions: where each product sold recently (for reorder alert context)
        prisma.transaction.groupBy({
            by: ["productId", "region"],
            where: {
                movementType: "Sale",
                transactionDate: { gte: thirtyDaysAgo },
            },
            _count: { productId: true },
        }),
        // Shipment delays above threshold, tied to recent transactions
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
                transaction: {
                    select: { productId: true, region: true },
                },
            },
        }),
    ]);

    const lastUpdated = latestTransaction
        ? formatDistanceToNow(latestTransaction.createdAt, { addSuffix: true })
        : "Never";

    // ── KPI metric calculations ────────────────────────────────────────────────

    const lostSalesValue = lostSalesData.reduce(
        (sum, t) => sum + t.lostSaleQtyUnits * t.product.sellingPriceRwf,
        0
    );

    const fulfillmentRate =
        fulfillmentData._avg.fulfillmentRatio !== null
            ? (fulfillmentData._avg.fulfillmentRatio * 100).toFixed(1)
            : null;

    const recentlySoldIds = new Set(recentSaleIds.map(t => t.productId));
    const capitalLock = products
        .filter(p => !recentlySoldIds.has(p.id) && p.quantity > 0)
        .reduce((sum, p) => sum + p.quantity * p.landedCostRwf, 0);

    const totalSalesUnits30d  = recentSalesUnits._sum.quantityOrderedUnits ?? 0;
    const totalCurrentStock   = products.reduce((sum, p) => sum + p.quantity, 0);
    const turnoverRate =
        totalCurrentStock > 0
            ? Math.round((totalSalesUnits30d / totalCurrentStock) * 10) / 10
            : 0;

    // ── Coverage Days per product ──────────────────────────────────────────────

    const salesMap = new Map(
        salesByProduct.map(s => [s.productId, s._sum.quantityOrderedUnits ?? 0])
    );

    const productsWithMetrics = products.map(p => {
        const salesIn30d     = salesMap.get(p.id) ?? 0;
        const avgDailySales  = salesIn30d / 30;
        return {
            ...p,
            coverageDays: avgDailySales > 0
                ? Math.round(p.quantity / avgDailySales)
                : null,
        };
    });

    // ── Alert data ─────────────────────────────────────────────────────────────

    // Build product → [region, …] map from recent sales
    const regionsMap = new Map<string, string[]>();
    for (const row of regionsByProduct) {
        const list = regionsMap.get(row.productId) ?? [];
        if (!list.includes(row.region)) list.push(row.region);
        regionsMap.set(row.productId, list);
    }

    // Products below reorder point OR with fewer than 14 coverage days, ranked by urgency
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
            id: p.id,
            quantity: p.quantity,
            reorderPointUnits: p.reorderPointUnits,
            coverageDays: p.coverageDays,
            regions: regionsMap.get(p.id) ?? [],
        }));

    const shipmentDelays: ShipmentDelay[] = shipmentDelayData.map(s => ({
        id: s.id,
        portDelays: s.portDelays!,
        portName: s.portName,
        currentStatus: s.currentStatus,
        productId: s.transaction.productId,
        region: s.transaction.region,
    }));

    return (
        <div className="space-y-8">
            <DashboardHeader lastUpdated={lastUpdated} />

            {/* ── Section 1: KPI cards ──────────────────────────────────── */}
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

            {/* ── Section 2: Alerts Panel (renders nothing when no alerts) ─ */}
            <AlertsPanel
                reorderAlerts={reorderAlerts}
                shipmentDelays={shipmentDelays}
            />

            {/* ── Section 5: Stock-on-Hand Table ────────────────────────── */}
            <StockOnHandTable products={productsWithMetrics} userRole={userRole} />
        </div>
    );
}

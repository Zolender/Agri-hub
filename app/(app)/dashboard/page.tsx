import prisma from "@/app/lib/db";
import AnimatedStatCard from "@/app/(app)/components/dashboard/AnimatedStatCard";
import StockOnHandTable from "../components/dashboard/StockOnHandTable";
import { formatDistanceToNow } from "date-fns";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { auth } from "@/app/lib/auth";

export default async function DashboardPage() {
    const session = await auth();
    const userRole = (session?.user?.role ?? 'ANALYST') as 'ADMIN' | 'MANAGER' | 'ANALYST';

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [
        products,
        latestTransaction,
        lostSalesData,
        fulfillmentData,
        recentSaleIds,
        recentSalesUnits,
    ] = await Promise.all([
        prisma.product.findMany({
            select: {
                id: true,
                categoryId: true,
                unitOfMeasure: true,
                unitCostRwf: true,
                sellingPriceRwf: true,
                landedCostRwf: true,        // ← Group A fix: was missing from select
                quantity: true,
                reorderPointUnits: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.transaction.findFirst({
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        }),
        // Lost Sales Value: every transaction that recorded lost demand
        prisma.transaction.findMany({
            where: { lostSaleQtyUnits: { gt: 0 } },
            select: {
                lostSaleQtyUnits: true,
                product: { select: { sellingPriceRwf: true } },
            },
        }),
        // Fulfillment Rate: average across all recorded metrics rows
        prisma.transactionMetrics.aggregate({
            _avg: { fulfillmentRatio: true },
        }),
        // Capital Lock: distinct products that had a Sale in the last 90 days
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
    ]);

    const lastUpdated = latestTransaction
        ? formatDistanceToNow(latestTransaction.createdAt, { addSuffix: true })
        : "Never";

    // ── Metric calculations ────────────────────────────────────────────────────

    // Revenue lost because stock ran out and the sale could not be fulfilled
    const lostSalesValue = lostSalesData.reduce(
        (sum, t) => sum + t.lostSaleQtyUnits * t.product.sellingPriceRwf,
        0
    );

    // null means no TransactionMetrics rows exist yet → show "No data"
    const fulfillmentRate =
        fulfillmentData._avg.fulfillmentRatio !== null
            ? (fulfillmentData._avg.fulfillmentRatio * 100).toFixed(1)
            : null;

    // Capital Lock: stock tied up in products with no outbound movement for 90+ days
    const recentlySoldIds = new Set(recentSaleIds.map(t => t.productId));
    const capitalLock = products
        .filter(p => !recentlySoldIds.has(p.id) && p.quantity > 0)
        .reduce((sum, p) => sum + p.quantity * p.landedCostRwf, 0); // ← Group A fix: landedCostRwf

    // Turnover Rate: how many times total stock "turned over" in the past 30 days
    const totalSalesUnits30d = recentSalesUnits._sum.quantityOrderedUnits ?? 0;
    const totalCurrentStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const turnoverRate =
        totalCurrentStock > 0
            ? Math.round((totalSalesUnits30d / totalCurrentStock) * 10) / 10
            : 0;

    return (
        <div className="space-y-8">
            <DashboardHeader lastUpdated={lastUpdated} />

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

            <div>
                <StockOnHandTable products={products} userRole={userRole} />
            </div>
        </div>
    );
}

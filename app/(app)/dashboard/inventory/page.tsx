import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import StockOnHandTable from "@/app/(app)/components/dashboard/StockOnHandTable";
import InventoryPageHeader from "@/app/(app)/components/inventory/InventoryPageHeader";

export const dynamic = 'force-dynamic';

// Shape returned by the raw fulfillment query
type FulfillmentRow = { product_id: string; avg_fulfillment: number | null };

export default async function InventoryPage() {
    const session = await auth();
    const userRole = (session?.user?.role ?? 'ANALYST') as 'ADMIN' | 'MANAGER' | 'ANALYST';

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [products, salesByProduct, fulfillmentRates] = await Promise.all([
        prisma.product.findMany({ orderBy: { id: 'asc' } }),

        // Coverage Days: units sold per product in last 30 days
        prisma.transaction.groupBy({
            by: ['productId'],
            where: {
                movementType: 'Sale',
                transactionDate: { gte: thirtyDaysAgo },
            },
            _sum: { quantityOrderedUnits: true },
        }),

        // Per-product fulfillment rate — requires a JOIN that Prisma groupBy
        // cannot express, so we use a raw query here
        prisma.$queryRaw<FulfillmentRow[]>`
            SELECT
                t."productId"           AS product_id,
                AVG(tm."fulfillmentRatio") AS avg_fulfillment
            FROM "Transaction" t
            JOIN "TransactionMetrics" tm ON t.id = tm."transactionId"
            WHERE tm."fulfillmentRatio" IS NOT NULL
            GROUP BY t."productId"
        `,
    ]);

    const salesMap = new Map(
        salesByProduct.map(s => [s.productId, s._sum.quantityOrderedUnits ?? 0])
    );

    const fulfillmentMap = new Map<string, number>(
        fulfillmentRates
            .filter(r => r.avg_fulfillment !== null)
            .map(r => [r.product_id, Number(r.avg_fulfillment)])
    );

    const productsWithMetrics = products.map(p => {
        const salesIn30d    = salesMap.get(p.id) ?? 0;
        const avgDailySales = salesIn30d / 30;
        return {
            ...p,
            coverageDays: avgDailySales > 0
                ? Math.round(p.quantity / avgDailySales)
                : null,
            fulfillmentRate: fulfillmentMap.get(p.id) ?? null,
        };
    });

    return (
        <div className="space-y-6">
            <InventoryPageHeader totalCount={products.length} />
            <StockOnHandTable products={productsWithMetrics} userRole={userRole} />
        </div>
    );
}

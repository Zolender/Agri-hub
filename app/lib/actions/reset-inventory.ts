"use server";

import prisma from "../db";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";

export async function resetInventoryAction(){
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Only admins can reset inventory data" };
    }

    try{
        const deleted = await prisma.$transaction(async (tx) => {
            const metricsCount = await tx.transactionMetrics.deleteMany({})
            const fxRateCount = await tx.fXRate.deleteMany({})
            const shipmentCount = await tx.shipment.deleteMany({})
            const transactionCount = await tx.transaction.deleteMany({})
            const productCount = await tx.product.deleteMany({})

            return {
                products: productCount.count,
                transactions: transactionCount.count,
                shipments : shipmentCount.count,
                fxRates: fxRateCount.count,
                metrics: metricsCount.count,
            }
        })
        revalidatePath("/dashboard")
        revalidatePath("/transactions")
        revalidatePath("/import");

        return {
            success: true,
            message: `✅ Database reset complete. Deleted: ${deleted.products} products, ${deleted.transactions} transactions, ${deleted.shipments} shipments, ${deleted.fxRates} FX rates, ${deleted.metrics} metrics.`,
            deleted,
        }
    } catch (error) {
        console.error('[resetInventoryAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }

}
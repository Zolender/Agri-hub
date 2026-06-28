"use server";

import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import { logAction } from "@/app/lib/utils/audit";
import { AuditAction } from "@/app/generated/prisma/enums";

export async function getProductPreview(id: string) {
    const session = await auth();
    if (!session) return null;

    return await prisma.product.findUnique({
        where: { id },
        select: {
            id: true,
            categoryId: true,
            quantity: true,
            sellingPriceRwf: true,
            unitCostRwf: true,
            unitOfMeasure: true,
            reorderPointUnits: true,
            leadTimeBufferDays: true,
        },
    });
}

export async function getPaginatedInventory(page: number = 1, search: string = "") {
    const session = await auth();
    if (!session) return { items: [], totalPages: 0, totalCount: 0 };

    const pageSize = 15;
    const skip = (page - 1) * pageSize;

    const whereClause = search
        ? {
            OR: [
                { id: { contains: search, mode: "insensitive" as const } },
                { categoryId: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [items, totalCount] = await Promise.all([
        prisma.product.findMany({
            where: whereClause,
            take: pageSize,
            skip,
            orderBy: { id: "asc" },
        }),
        prisma.product.count({ where: whereClause }),
    ]);

    return { items, totalPages: Math.ceil(totalCount / pageSize), totalCount };
}

export async function recordSaleAction(
    productId: string,
    quantitySold: number,
    region: string,
    options?: {
        lostSaleQty?: number;
        customerId?: string;
        transactionDate?: string;
    }
) {
    const session = await auth();
    if (!session) {
        return { success: false, error: "You must be signed in to record a sale." };
    }

    const lostSaleQty = options?.lostSaleQty ?? 0;
    const customerId = options?.customerId || null;
    const transactionDate = options?.transactionDate ? new Date(options.transactionDate) : new Date();

    try {
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });

            if (!product) throw new Error("Product not found.");
            if (product.quantity < quantitySold) throw new Error("Insufficient stock.");

            const updated = await tx.product.update({
                where: { id: productId },
                data: { quantity: { decrement: quantitySold } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    productId,
                    movementType: "Sale",
                    remainingStockUnits: updated.quantity,
                    quantityOrderedUnits: quantitySold + lostSaleQty,
                    lostSaleQtyUnits: lostSaleQty,
                    customerId,
                    region,
                    orderId: `SALE-${Date.now()}`,
                    transactionDate,
                },
            });

            const totalDemand = quantitySold + lostSaleQty;
            await tx.transactionMetrics.create({
                data: {
                    transactionId: transaction.id,
                    fulfillmentRatio: totalDemand > 0 ? (quantitySold / totalDemand) * 100 : 100,
                    stockPressure: product.reorderPointUnits > 0
                        ? updated.quantity / product.reorderPointUnits
                        : null,
                },
            });

            return updated;
        });

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.RECORD_SALE,
            targetId:   productId,
            targetType: "Product",
            detail:     `Sold ${quantitySold} units of ${productId} in ${region}${lostSaleQty > 0 ? `, ${lostSaleQty} lost` : ''}`,
        });

        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        return { success: true };
    } catch (error) {
        console.error('[recordSaleAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function recordPurchaseAction(
    productId: string,
    quantityReceived: number,
    region: string,
    options?: {
        supplierId?: string;
        poId?: string;
        transactionDate?: string;
        shipment?: {
            shipType?: string;
            portName?: string;
            country?: string;
            arrivalTime?: string;
            departureTime?: string;
        };
        fxRate?: {
            usdToRwf?: number;
            eurToRwf?: number;
        };
    }
) {
    const session = await auth();

    if (
        !session ||
        (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")
    ) {
        return { success: false, error: "Only Managers and Admins can receive stock." };
    }

    const supplierId = options?.supplierId || null;
    const poId = options?.poId || null;
    const transactionDate = options?.transactionDate ? new Date(options.transactionDate) : new Date();

    try {
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error("Product not found.");

            const updated = await tx.product.update({
                where: { id: productId },
                data: { quantity: { increment: quantityReceived } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    productId,
                    movementType: "Purchase",
                    remainingStockUnits: updated.quantity,
                    quantityOrderedUnits: quantityReceived,
                    region,
                    supplierId,
                    poId,
                    orderId: `PO-${Date.now()}`,
                    transactionDate,
                },
            });

            if (options?.shipment && (options.shipment.shipType || options.shipment.portName || options.shipment.country)) {
                await tx.shipment.create({
                    data: {
                        transactionId: transaction.id,
                        shipType: options.shipment.shipType || null,
                        portName: options.shipment.portName || null,
                        country: options.shipment.country || null,
                        arrivalTime: options.shipment.arrivalTime ? new Date(options.shipment.arrivalTime) : null,
                        departureTime: options.shipment.departureTime ? new Date(options.shipment.departureTime) : null,
                    },
                });
            }

            if (options?.fxRate && (options.fxRate.usdToRwf || options.fxRate.eurToRwf)) {
                await tx.fXRate.create({
                    data: {
                        transactionId: transaction.id,
                        usdToRwf: options.fxRate.usdToRwf || null,
                        eurToRwf: options.fxRate.eurToRwf || null,
                    },
                });
            }

            await tx.transactionMetrics.create({
                data: {
                    transactionId: transaction.id,
                    fulfillmentRatio: 100,
                    stockPressure: product.reorderPointUnits > 0
                        ? updated.quantity / product.reorderPointUnits
                        : null,
                },
            });
        });

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.RECORD_PURCHASE,
            targetId:   productId,
            targetType: "Product",
            detail:     `Received ${quantityReceived} units of ${productId} in ${region}${poId ? ` (PO: ${poId})` : ''}`,
        });

        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        return { success: true };
    } catch (error) {
        console.error('[recordPurchaseAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function updateProductAction(
    productId: string,
    data: {
        sellingPriceRwf?: number;
        unitCostRwf?: number;
        reorderPointUnits?: number;
        leadTimeBufferDays?: number;
    }
) {
    const session = await auth();

    if (
        !session ||
        (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")
    ) {
        return { success: false, error: "Only Managers and Admins can edit product details." };
    }

    if (Object.keys(data).length === 0) {
        return { success: false, error: "No fields provided to update." };
    }

    try {
        await prisma.product.update({
            where: { id: productId },
            data,
        });

        // Build a readable summary of what changed e.g. "sellingPriceRwf: 500, reorderPointUnits: 20"
        const changesSummary = Object.entries(data)
            .map(([key, val]) => `${key}: ${val}`)
            .join(", ");

        await logAction({
            userId:     session.user?.id,
            userEmail:  session.user?.email,
            userRole:   session.user?.role,
            action:     AuditAction.UPDATE_PRODUCT,
            targetId:   productId,
            targetType: "Product",
            detail:     `Updated ${productId} — ${changesSummary}`,
        });

        revalidatePath("/dashboard");
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error('[updateProductAction]:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}
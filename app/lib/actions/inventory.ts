"use server";

import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import { logAction } from "@/app/lib/utils/audit";
import { AuditAction } from "@/app/generated/prisma/enums";

export async function getProductPreview(id: string) {
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
    region: string
) {
    const session = await auth();
    if (!session) {
        return { success: false, error: "You must be signed in to record a sale." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });

            if (!product) throw new Error("Product not found.");
            if (product.quantity < quantitySold) throw new Error("Insufficient stock.");

            const updated = await tx.product.update({
                where: { id: productId },
                data: { quantity: { decrement: quantitySold } },
            });

            await tx.transaction.create({
                data: {
                    productId,
                    movementType: "Sale",
                    remainingStockUnits: updated.quantity,
                    quantityOrderedUnits: quantitySold,
                    region,
                    orderId: `SALE-${Date.now()}`,
                    transactionDate: new Date(),
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
            detail:     `Sold ${quantitySold} units of ${productId} in ${region}`,
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
    supplierId?: string
) {
    const session = await auth();

    if (
        !session ||
        (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")
    ) {
        return { success: false, error: "Only Managers and Admins can receive stock." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error("Product not found.");

            const updated = await tx.product.update({
                where: { id: productId },
                data: { quantity: { increment: quantityReceived } },
            });

            await tx.transaction.create({
                data: {
                    productId,
                    movementType: "Purchase",
                    remainingStockUnits: updated.quantity,
                    quantityOrderedUnits: quantityReceived,
                    region,
                    supplierId: supplierId || null,
                    orderId: `PO-${Date.now()}`,
                    transactionDate: new Date(),
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
            detail:     `Received ${quantityReceived} units of ${productId} in ${region}`,
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
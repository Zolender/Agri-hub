"use server";

import prisma from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import { TransactionCsvSchema, type TransactionRow } from "../validator/csv_schema";

export async function importInventoryAction(data: any[]){
    const session = await auth();
    if(!session || (session.user?.role !== "ADMIN" && session.user?.role !=="MANAGER")){
        return {success: false, error: "Unauthorized"}
    }
    try{
        const results: any[] = [];
        const errors: Array<{ productId: string; rowIndex: number; error: string }> = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            if (!rawRow.product_id) continue;

            const parsed = TransactionCsvSchema.safeParse(rawRow);
            if (!parsed.success) {
                errors.push({
                    productId: String(rawRow.product_id),
                    rowIndex: i,
                    error: parsed.error.issues[0]?.message ?? 'Validation failed',
                });
                continue;
            }

            const row = parsed.data;
            let attempts = 0
            const maxAttempts = 3
            let lastError = null
            while(attempts < maxAttempts){
                try{
                    const result = await prisma.$transaction(async (tx)=>{
                        const product = await tx.product.upsert({
                            where: {id: row.product_id},
                            update: {
                                quantity: row.remaining_stock_units,
                                unitCostRwf: row.unit_cost_rwf,
                                sellingPriceRwf: row.selling_price_rwf,
                                landedCostRwf: row.landed_cost_rwf,
                            },
                            create:{
                                id: row.product_id,
                                categoryId: row.category_id,
                                unitOfMeasure: row.unit_of_measure,
                                unitCostRwf: row.unit_cost_rwf,
                                sellingPriceRwf: row.selling_price_rwf,
                                landedCostRwf: row.landed_cost_rwf,
                                reorderPointUnits: row.reorder_point_units,
                                leadTimeBufferDays: row.lead_time_buffer_days,
                                quantity: row.remaining_stock_units
                            }
                        })

                        const existingTransaction = await tx.transaction.findFirst({
                            where: { orderId: row.order_id, productId: row.product_id },
                            select: { id: true },
                        });
                        if (existingTransaction) return { product, transaction: existingTransaction };

                        const transaction = await tx.transaction.create({
                            data: {
                                productId: row.product_id,
                                orderId: row.order_id,
                                movementType: row.movement_type,
                                quantityOrderedUnits: row.quantity_ordered_units,
                                remainingStockUnits: row.remaining_stock_units,
                                customerId: row.customer_id,
                                supplierId: row.supplier_id,
                                poId: row.po_id,
                                region: row.region,
                                lostSaleQtyUnits: row.lost_sale_qty_units,
                                transactionDate: new Date(row.transaction_date)
                            }
                        })
                        if(row.ship_type || row.port_name || row.country){
                            await tx.shipment.create({
                                data: {
                                    transactionId: transaction.id,
                                    shipType: row.ship_type,
                                    portName: row.port_name,
                                    country: row.country,
                                    cargoDescription: row.cargo_description,
                                    arrivalTime: row.arrival_time? new Date(row.arrival_time) : null,
                                    departureTime: row.departure_time? new Date(row.departure_time) : null,
                                    portDelays: row.port_delay_days,
                                    lastPort: row.last_port,
                                    nextPort: row.next_port,
                                    currentStatus: row.current_status,
                                }
                            })
                        }

                        if(row.USD_RWF || row.EUR_RWF){
                            await tx.fXRate.create({
                                    data: {
                                        transactionId: transaction.id,
                                        usdToRwf: row.USD_RWF,
                                        eurToRwf: row.EUR_RWF,
                                        timestamp: row.timestamp? new Date(row.timestamp): null,
                                        fxVolatility: row.fx_volatility,
                                    }
                                })
                            }

                            if(row.fulfillment_ratio !== undefined || row.stock_pressure !== undefined){
                                await tx.transactionMetrics.create({
                                    data: {
                                        transactionId : transaction.id,
                                        fulfillmentRatio : row.fulfillment_ratio,
                                        stockPressure: row.stock_pressure,
                                    }
                                })
                            }
                            return { product, transaction}
                        })
                        results.push(result);
                        break
                    }catch(error: any){
                        attempts++
                        lastError = error
                        if(attempts < maxAttempts){
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts)* 100))
                        }
                    }
                }
                if(lastError && attempts >= maxAttempts){
                    console.error(`[importInventoryAction] row ${row.product_id}:`, lastError);
                    errors.push({
                        productId: row.product_id,
                        rowIndex: i,
                        error: 'Row failed to import. Check the data and try again.',
                    })
                }
            }
        
            revalidatePath("/dashboard")
            revalidatePath("/transactions")
            return {
                success: true,
                count: results.length,
                errors: errors.length>0 ? errors : undefined,
                message: errors.length > 0? `Imported ${results.length} items, ${errors.length} failed`
                                            : `Successfully imported ${results.length} items`,
            }
        } catch (error) {
            console.error('[importInventoryAction]:', error);
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    }

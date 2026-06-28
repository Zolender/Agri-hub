import { z } from 'zod';

export const TransactionCsvSchema = z.object({
    product_id: z.string().min(1),
    product_name: z.string().optional(),
    category_id: z.string().min(1),
    unit_of_measure: z.string(),
    unit_cost_rwf: z.coerce.number(),
    selling_price_rwf: z.coerce.number(),

    reorder_point_units: z.coerce.number(),
    lead_time_buffer_days: z.coerce.number(),

    movement_type: z.enum(['Sale', 'Adjustment', 'Purchase']),
    quantity_ordered_units: z.coerce.number().optional().default(0),
    quantity_fulfilled_units: z.coerce.number().optional(),
    remaining_stock_units: z.coerce.number(),
    order_id: z.string(),
    customer_id: z.string().optional(),
    region: z.string(),
    lost_sale_qty_units: z.coerce.number().default(0),
    po_id: z.string().optional(),
    supplier_id: z.string().optional(),
    transaction_date: z.string(), // We will parse this string into a Date object next
    landed_cost_rwf: z.coerce.number(),

    ship_type: z.string().optional(),
    timestamp: z.string().optional(), // For FX rate timestamp
    USD_RWF: z.coerce.number().optional(),
    EUR_RWF: z.coerce.number().optional(),
    port_name: z.string().optional(),
    country: z.string().optional(),
    arrival_time: z.string().optional(),
    departure_time: z.string().optional(),
    current_status: z.string().optional(),
    last_port: z.string().optional(),
    next_port: z.string().optional(),
    cargo_description: z.string().optional(),
    port_delay_days: z.coerce.number().optional(),
    
    // NEW: Metrics fields
    fulfillment_ratio: z.coerce.number().optional(),
    stock_pressure: z.coerce.number().optional(),
    fx_volatility: z.coerce.number().optional(),
});

// This helps TypeScript know exactly what a "TransactionRow" looks like
export type TransactionRow = z.infer<typeof TransactionCsvSchema>;
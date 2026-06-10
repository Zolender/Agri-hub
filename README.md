# Rwanda AgriHub — Inventory Management System

A production-grade inventory management web app for agri-input distributors in Rwanda. Records and analyzes inventory transactions (Sales, Purchases, Adjustments), tracks stock-on-hand, and surfaces operational KPIs through an interactive dashboard.

**Live:** [agrihub-z.vercel.app](https://agrihub-z.vercel.app)

---

## What is built

### Authentication & Access Control
- NextAuth v5 (JWT sessions) with three roles: **ADMIN**, **MANAGER**, **ANALYST**
- Rate-limited login via Upstash Redis — blocks repeated failed attempts with a visible warning
- Audit log capturing every mutation: user CRUD, stock edits, sales, and purchases

### Dashboard
Four KPI cards:

| Card | What it measures |
|------|-----------------|
| Turnover Rate | `(units_sold_30d / avg_stock_30d) × (365/30)` — annualized |
| Fulfillment Rate | Percentage of ordered units actually delivered (stored as 0–100) |
| Lost Sales Value | Value of unmet demand in RWF (last 30 days) |
| Capital Lock | Current stock × landed cost per unit, in RWF |

Five chart/section groups:

| Group | Content |
|-------|---------|
| A — Stock Overview | Stock Status Donut (in-stock / low-stock / stockout breakdown) |
| B — Velocity | Stock Velocity Scatter (units moved vs. coverage days, per product) |
| C — Weekly Trend | Stacked area chart — fulfilled vs. ordered units over 12 weeks |
| D — Alerts | Reorder alerts (stock below reorder point) + Shipment delays (POs open > 2 days). Financial mini cards (margin, capital lock) |
| E — Trends | Sales by Region Bar (grouped, top 5 regions, 12 weeks) · Lost Sales Trend (ComposedChart — bars + line, dual Y-axis) |

### Inventory Page
Full stock-on-hand table with columns: Product ID, Category, Stock Level, Coverage Days, Fulfillment %, Reorder Point, Status, Landed Cost (RWF), Margin %. Click any row to open a detail modal; MANAGER/ADMIN see an edit form, ANALYST sees read-only.

### Transactions Page
Paginated transaction history with filters: date range, movement type (Sale / Purchase / Adjustment), region, and product search. CSV export (filter-aware, 10 k row limit).

### Import
CSV import with client-side chunking (handles 2,000+ rows), Zod row validation, per-row retry logic, partial success UI, and error report download.

### Admin
User management (ADMIN only): create users, change roles, delete users with self-protection guards. Audit log viewer at `/admin/audit`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Charts | Recharts 3 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 (PrismaPg driver adapter) |
| Auth | NextAuth v5 (JWT, Credentials provider) |
| Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Validation | Zod |
| Testing | Vitest |
| Deployment | Vercel |

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Animated landing page |
| `/login` | Public | Login with rate limiting |
| `/dashboard` | All roles | KPI cards + charts + alerts |
| `/inventory` | All roles | Stock-on-hand table |
| `/transactions` | All roles | Transaction history + CSV export |
| `/import` | ADMIN / MANAGER | CSV import |
| `/sale` | ADMIN / MANAGER | Record a sale |
| `/quick-add` | ADMIN / MANAGER | Receive stock (purchase) |
| `/admin/users` | ADMIN | User management |
| `/admin/audit` | ADMIN | Audit log |
| `/api/health` | Public | Health check endpoint |
| `/api/transactions/export` | Authenticated | Filter-aware CSV export |

---

## Data Contract (CSV format)

### Required columns

| Column | Type | Notes |
|--------|------|-------|
| `product_id` | string | SKU — unique product code |
| `category_id` | string | |
| `unit_of_measure` | string | |
| `unit_cost_rwf` | number | Purchase cost per unit |
| `selling_price_rwf` | number | |
| `reorder_point_units` | number | Manual reorder threshold |
| `lead_time_buffer_days` | number | |
| `movement_type` | enum | `Sale` / `Purchase` / `Adjustment` |
| `quantity_ordered_units` | number | Demand — what was requested |
| `quantity_fulfilled_units` | number | Supply met — what was delivered |
| `remaining_stock_units` | number | Stock AFTER this transaction |
| `order_id` | string | Currently unique per row |
| `customer_id` | string | |
| `region` | string | e.g. `Musanze`, `Nyagatare` |
| `lost_sale_qty_units` | number | `ordered − fulfilled` when positive |
| `po_id` | string | May appear on sale rows (batch lineage) |
| `supplier_id` | string | |
| `transaction_date` | date | Interpreted as Rwanda time (UTC+2) |
| `landed_cost_rwf` | number | Unit cost including 30% logistics surcharge |

### Key definitions

**`remaining_stock_units`** — stock level *after* the transaction (snapshot model).

**`quantity_ordered_units` vs `quantity_fulfilled_units`** — ordered reflects demand; fulfilled reflects supply actually met.

**`lost_sale_qty_units`** — `quantity_ordered_units − quantity_fulfilled_units` when positive; zero for fully fulfilled rows.

**`order_id`** — currently one SKU per order (unique per row). Multi-SKU orders are a future improvement.

**`transaction_date`** — interpreted as Rwanda time (UTC+2) unless otherwise specified.

---

## Import Validation Rules

- `movement_type` must be `Sale`, `Purchase`, or `Adjustment`
- Numeric columns must parse correctly (RWF costs, quantities)
- `transaction_date` must parse to a valid timestamp
- `remaining_stock_units >= 0`
- For `Sale` rows: `quantity_fulfilled_units <= quantity_ordered_units`; `lost_sale_qty_units >= 0`

Invalid rows are reported back to the user with row-level error messages. Valid rows are committed even if some rows fail (partial success).

---

## KPI Formulas

| KPI | Formula | Notes |
|-----|---------|-------|
| Turnover Rate | `(units_sold_30d / avg_stock_30d) × (365 / 30)` | Annualized |
| Fulfillment Rate | `sum(qty_fulfilled) / sum(qty_ordered) × 100` | Stored as 0–100, not 0–1 |
| Lost Sales Value | `sum(lost_sale_qty × selling_price_rwf)` | Last 30 days |
| Capital Lock | `sum(remaining_stock × landed_cost_rwf)` | Current snapshot |
| Coverage Days | `remaining_stock / (units_sold_30d / 30)` | Per product |
| Shipment Delay Threshold | PO open > 2 days | Triggers delay alert |

> `fulfillmentRatio` is stored as a **percentage (0–100)**, not a decimal ratio (0–1). Divide by 100 before using it as a multiplier.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local
# Required: DATABASE_URL, DIRECT_URL, AUTH_SECRET,
#           UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# 3. Run database migrations and generate the Prisma client
npx prisma migrate dev
npx prisma generate

# 4. Seed the database (creates the first Admin user)
npx tsx prisma/seed.ts

# 5. Start the dev server
npm run dev
```

---

## Glossary

- **SKU (`product_id`)**: unique code identifying a product
- **Inventory ledger**: chronological log of stock movements — the source of truth
- **fulfillmentRatio**: stored as a percentage (0–100), not a decimal ratio (0–1)
- **Coverage Days**: how many days of stock remain at the current run rate
- **Capital Lock**: cash tied up in unsold inventory, valued at landed cost
- **Corridor / Port Delay**: actual lead time exceeds `lead_time_buffer_days` — surfaces in the alerts panel
- **Season A / Season B**: Rwanda's two main agricultural seasons — the primary demand drivers

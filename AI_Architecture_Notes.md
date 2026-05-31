# Agri-Hub — Architecture & Design Notes
> **Source:** GitHub Copilot discussion session — 2026-05-24  
> **Author:** @Zolender  
> **Purpose:** Reference document covering ML feasibility, key metrics, dashboard design, and the full inventory process description.

---

## 1. ML / AI Layer — Is It Feasible?

**Short answer: Yes — and the project is already better positioned than most.**

### What's already in place (that helps)

| What | Why it matters |
|---|---|
| `TransactionMetrics` model (`fulfillmentRatio`, `stockPressure`) | Pre-computed ML features, already in schema |
| `FXRate` model (`usdToRwf`, `fxVolatility`) | Direct inputs for macro-economic hedging signal |
| `Shipment` model (`portDelays`, `arrivalTime`, `departureTime`) | Core of the lead-time forecasting model |
| `Transaction` (`lostSaleQtyUnits`, `remainingStockUnits`, `transactionDate`) | Time-series training data |
| CSV import pipeline + Zod validation | Clean, structured historical data ready for ML ingestion |
| Next.js Route Handlers | App is already an API — ML predictions can be consumed as endpoints |

### The real challenges

1. **The ML layer cannot live in Next.js.**  
   Python models (scikit-learn, XGBoost, Prophet) need a separate service.  
   Best option for this project: **FastAPI microservice on Railway or Render**, called by Next.js via HTTP.

2. **Data volume is still growing.**  
   Time-series forecasting needs 1–2 years of history per product/region.  
   `Shipment`, `FXRate`, `TransactionMetrics` rows are schema-ready but likely sparse — need a data collection strategy.

3. **The Back-Cast Engine is the easiest first win.**  
   It's purely analytical — no Python required.  
   You already have `reorderPointUnits` (manual baseline) and `lostSaleQtyUnits` + `remainingStockUnits` (outcomes).  
   Build it as a SQL/Prisma query layer to prove ROI before touching ML.

### Realistic implementation path

```
Phase 3 (current roadmap) — Analytics & Charts
        ↓
Phase 4 — Back-Cast Engine (pure SQL, no ML — prove ROI with existing data)
        ↓
Phase 5 — Python microservice (FastAPI):
           • Lead-time forecasting (regression on Shipment data)
           • Reorder signal (time-series on Transaction data)
        ↓
Phase 6 — FX hedging signal + weather/satellite integration
           (external API inputs → advisory UI in dashboard)
```

---

## 2. Key Metrics to Track & Why

### 🔴 Operational Alerts (Real-Time)

| Metric | Formula | Why |
|---|---|---|
| **Stock Coverage Days** | `remaining_stock / avg_daily_sales` | Tells managers "X days before stockout" — smarter than binary Low/In-Stock |
| **Fulfillment Rate %** | `sum(quantity_fulfilled) / sum(quantity_ordered)` | Measures stockout severity directly |
| **Lost Sales Value (RWF)** | `sum(lost_sale_qty * selling_price_rwf)` | Converts stockout pain into money — the language managers understand |
| **Low Stock Count** | Products where `quantity <= reorderPointUnits` | ✅ Already built — upgrade to coverage days |

### 🟡 Financial Health (Weekly / Monthly)

| Metric | Formula | Why |
|---|---|---|
| **Capital Lock (RWF)** | `sum(quantity * landed_cost_rwf)` per product | Identifies SKUs tying up cash unnecessarily |
| **Inventory Turnover Rate** | `total_sales_units / avg_stock_level` per period | Low = dead stock, high = stockout risk |
| **Gross Margin per SKU** | `(selling_price - landed_cost) / selling_price` | Prioritizes which products to protect during shortages |

### 🟢 Logistics Intelligence (Rwanda-Specific)

| Metric | Formula | Why |
|---|---|---|
| **Avg Lead-Time Deviation** | `avg(actual_arrival - expected_arrival)` from `Shipment` | Baseline for corridor unreliability |
| **Supplier Reliability Score** | `% of POs delivered on-time per supplier_id` | Data-driven ranking of suppliers (e.g. ETG Rwanda vs. Agrotech) |
| **Reorder Point Accuracy** | `% of manual reorderPoints that prevented stockouts` | The Back-Cast metric — validates or disproves current manual thresholds |

### ⚠️ Known Bug to Fix
> `DashboardPage` currently computes **Inventory Value** using `unitCostRwf`.  
> It should use **`landedCostRwf`** (includes the 30% logistics surcharge).  
> This is understating the real capital exposure. Fix this in `app/(app)/dashboard/page.tsx`.

---

## 3. Dashboard — Target Composition vs. Current State

### What exists today
- ✅ 4 KPI cards: Total Products, Low Stock Alerts, Inventory Value, Total Movements
- ✅ Stock-on-Hand table (searchable, sortable, click-to-modal with role-gated edit)
- ✅ Last import timestamp

### Target dashboard layout (full vision)

**Section 1 — Operational Command (top KPI row)**
```
[ Stock Coverage Days ]  [ Fulfillment Rate % ]  [ Lost Sales Value RWF ]  [ Capital Lock RWF ]
```

**Section 2 — Alerts Panel**
- Reorder Alert List — not just a count, but *which* products, *which region*, ranked by coverage days remaining
- Shipment Delay Warnings — when `Shipment.portDelays > threshold`, surface as a risk flag

**Section 3 — Trends (currently zero — needs Recharts or Chart.js)**
- 📈 Stock level over time per product (line chart)
- 📊 Sales by region (bar chart — Musanze vs. Nyagatare demand patterns)
- 📉 Lost sales trend over time (are stockouts getting worse or better?)

**Section 4 — Intelligence Panel (Phase ML)**
- 💱 FX Watch — current RWF/USD rate + volatility indicator (from `FXRate` table)
- 🚢 Corridor Risk — active port delay flag (from `Shipment` table)
- 🤖 "Buy Now" advisory signal

**Section 5 — Stock-on-Hand Table (upgraded columns)**

| Current | Target |
|---|---|
| Product ID | Product ID |
| Category | Category |
| Stock Level | Stock Level |
| Unit | **Coverage Days** ← new |
| Reorder Point | **Fulfillment Rate** ← new |
| Status | Reorder Point |
| Unit Cost (RWF) | Status |
| — | **Landed Cost (RWF)** ← fix |
| — | **Margin %** ← new |

---

## 4. Inventory Management Process — End-to-End

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL WORLD                                  │
│  Farmer demand (Season A/B) → Agro-dealer orders → Distributor     │
│  Supplier shipment → Port (Dar es Salaam) → Border → Warehouse     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 1 — DATA INGESTION                            │
│  Manager uploads CSV → /import page                                 │
│  → Zod validation (row-by-row, chunked 2000 rows)                   │
│  → importInventoryAction() → Prisma bulk insert                     │
│  → Products upserted, Transactions created                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 2 — SYSTEM OF RECORD                          │
│  Every movement is a Transaction row:                               │
│  • Sale       → quantity decreases, lost_sale_qty recorded          │
│  • Purchase   → quantity increases, PO linked                       │
│  • Adjustment → correction, breakage, write-off                     │
│  remaining_stock_units = stock AFTER the event (snapshot model)     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 3 — STOCK STATE                               │
│  Product.quantity = current stock on hand                           │
│  Compared against Product.reorderPointUnits (manual threshold)      │
│  → triggers "Low Stock" flag on dashboard                           │
│  → future: triggers AI reorder recommendation                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 4 — DECISION SUPPORT                          │
│  Dashboard surfaces:                                                │
│  • Which products are low / at risk                                 │
│  • What the inventory value is (Capital Lock)                       │
│  • Where lost sales are happening (by region)                       │
│  Manager acts: records a Sale or triggers a Purchase (restock)      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 5 — LOGISTICS TRACKING (schema-ready)             │
│  When a Purchase is made:                                           │
│  → Shipment record tracks port, corridor, delays                    │
│  → FXRate record captures RWF/USD at time of order                  │
│  → lead_time_buffer_days measures expected vs actual delivery       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 6 — AUDIT & ACCOUNTABILITY                        │
│  Every mutation (sale, purchase, user change) → AuditLog            │
│  Who did what, when, to which product                               │
│  Viewable by ADMIN at /admin/audit                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 7 — INTELLIGENCE (Future ML layer)                │
│  Back-Cast: was the manual reorderPoint actually right?             │
│  Lead-Time Model: predict when stock will arrive given port data     │
│  FX Signal: should we buy now before RWF weakens?                   │
│  Demand Sensing: is Season A starting early based on sales surge?   │
└─────────────────────────────────────────────────────────────────────┘
```

### One-sentence description
> **Agri-Hub is a transactional inventory ledger that records every stock movement, computes real-time stock health, surfaces financial exposure and stockout risk to managers — and is architected to progressively add predictive intelligence on top of that foundation.**

---

## 5. Immediate Action Items (Quick Wins)

- [ ] Fix `landedCostRwf` vs `unitCostRwf` in `dashboard/page.tsx` Capital Lock calculation
- [ ] Add **Stock Coverage Days** column to `StockOnHandTable`
- [ ] Add **Fulfillment Rate** as a KPI card on the dashboard
- [ ] Add **Lost Sales Value (RWF)** as a KPI card
- [ ] Replace Inventory Value card with **Capital Lock (RWF)** using correct cost field
- [ ] Add charts (Recharts) for stock trends and sales by region (Phase 3.3 in Roadmap)
- [ ] Build the **Back-Cast Engine** as a pure SQL/Prisma analytical page before touching ML
- [ ] Start populating `Shipment` and `FXRate` rows during Purchase imports for future ML readiness

---

*Last updated: 2026-05-24 — generated from GitHub Copilot architecture discussion*

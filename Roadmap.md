# Rwanda AgriHub: Development Roadmap

> **Status:** Phase 2 Mostly Complete ✅ → Phase 3 (Analytics) In Progress 🔧  
> **Last Updated:** 2026-06-10

---

## Mission
Build a production-ready inventory management system for agri-input distributors in Rwanda.

---

## Completed

### Foundation (2026-03-22)
- [x] Next.js 16 + TypeScript setup
- [x] Prisma 7 schema with PostgreSQL (Supabase)
- [x] NextAuth v5 with role-based access (ADMIN, MANAGER, ANALYST)
- [x] CSV import with chunking (handles 2,000+ rows)
- [x] Server Actions for secure mutations
- [x] Zod validation for data integrity
- [x] Edge Runtime compatibility (split auth config)
- [x] Database singleton pattern (Prisma 7 adapter)
- [x] Vitest testing infrastructure + CSV validation tests
- [x] Import retry logic (3 attempts with exponential backoff)
- [x] Public/protected route separation + middleware
- [x] Landing page with dynamic auth state

### Dashboard & Transactions (2026-03-25)
- [x] 4 KPI cards with correct calculations
- [x] Stock-on-hand table with search and sorting
- [x] Last import timestamp with refresh
- [x] Error boundaries (`error.tsx`) + loading skeletons (`loading.tsx`)
- [x] Transactions page with pagination, date/type/region/product filters
- [x] Empty states

### Admin & Auth Hardening (2026-03-28)
- [x] `ProductDetailModal` — click stock row for full details; role-gated editing
- [x] Admin User Management page (`/admin/users`)
- [x] Server actions: `createUserAction`, `updateUserRoleAction`, `deleteUserAction` with self-protection guards
- [x] `UsersTable`, `CreateUserModal`, `EditRoleModal`, `DangerModal`
- [x] CSV export for transactions (`/api/transactions/export` — filter-aware, 10k limit)
- [x] Sale page + QuickAdd (Receive Stock) page
- [x] Auth hardened on sale and purchase server actions
- [x] Deployed to Vercel (agrihub-z.vercel.app)
- [x] AuditLog model + `/admin/audit` page (dark mode, server fetch + client render)
- [x] Database indexes on products and transactions

### KPI Upgrade & Dashboard Charts (2026-04 to 2026-05)
- [x] Replaced placeholder KPI cards with correct business metrics:
  - Turnover Rate (annualized), Fulfillment Rate (%), Lost Sales Value (RWF), Capital Lock (RWF)
- [x] Fixed Capital Lock to use `landedCostRwf` (not `unitCostRwf`)
- [x] Recharts integrated (Group A): Stock Status Donut chart
- [x] Group B: Stock Velocity Scatter plot (units moved vs. coverage days)
- [x] Group C: Weekly Trend chart (stacked area — fulfilled vs. ordered, 12 weeks)
- [x] Group D: Alerts Panel (reorder alerts + shipment delays) + Financial Mini Cards
- [x] Group E: Sales by Region Bar chart (grouped, top 5 regions, 12 weeks)
- [x] Group E: Lost Sales Trend chart (ComposedChart — bars + line, dual Y-axis)
- [x] All charts wrapped with `next/dynamic` (`ssr: false`) via `ChartClientWrappers.tsx`

### Inventory Table Upgrade (2026-05)
- [x] Added Coverage Days, Fulfillment %, Landed Cost (RWF), Margin % columns to `StockOnHandTable`
- [x] Per-product fulfillment computed via raw SQL (avoids N+1)

### Sidebar & Dark Mode (2026-05)
- [x] Sidebar collapsible (state persisted to `localStorage`)
- [x] Dark mode via `DarkModeContext` + `localStorage` key `agri-dark-mode`
- [x] All dashboard pages and charts respond to dark mode toggle
- [x] Chart dynamic background colors (fills, strokes) adapt to dark/light

### Monitoring & Security (2026-05)
- [x] Sentry error tracking integrated
- [x] Upstash Redis rate limiting on login (with UI feedback)
- [x] Health check endpoint (`/api/health`)
- [x] UptimeRobot monitoring configured

### Landing & Login Redesign (2026-06)
- [x] Full landing page redesign — deep emerald gradient hero (Direction C)
- [x] Scroll-aware nav (transparent at top → themed on scroll)
- [x] Glassmorphism preview card in hero
- [x] Dark ticker strip, animated with Framer Motion
- [x] Removed all non-functional UI elements (Watch Demo, Learn More)
- [x] Login page dark mode (reads `agri-dark-mode` from localStorage)
- [x] Unified localStorage key across landing and login pages

---

## Phase 2: Production Readiness

### 2.1 Error Handling & Logging
- [x] Error tracking (Sentry)
- [ ] Structured logging (Pino)
- [ ] Improve Server Action error messages

### 2.2 Performance Optimization
- [x] Database indexes (products, transactions)
- [ ] Analyze slow queries (EXPLAIN ANALYZE)
- [ ] Add caching strategy (React Cache)

### 2.3 Security Hardening
- [x] Rate limiting on login (Upstash Redis)
- [x] Audit logs for all mutations
- [x] Password strength requirements
- [ ] Session timeout configuration
- [ ] 2FA (optional, future)

### 2.4 Deployment
- [x] Deployed to Vercel
- [x] Environment variables configured
- [x] Supabase connection pooling
- [x] Health check endpoint
- [x] UptimeRobot monitoring
- [ ] Database backup strategy documentation

---

## Phase 3: Analytics & Advanced Features

### 3.1 Data Export
- [x] CSV export for transactions
- [ ] CSV export for products / stock-on-hand table
- [ ] PDF report generation (optional)

### 3.2 Multi-SKU Order Support
- [ ] Design order schema (multiple products per order)
- [ ] Order entry UI
- [ ] Order fulfillment tracking
- [ ] Order history page

### 3.3 Analytics & Insights (core complete ✅)
- [x] Stock Status Donut chart
- [x] Stock Velocity Scatter
- [x] Weekly sales trend (stacked area)
- [x] Sales by region (grouped bar)
- [x] Lost sales trend (ComposedChart)
- [x] Inventory turnover rate KPI
- [ ] Group F: Shrinkage Rate, Supplier Reliability, Lead-Time Deviation charts
- [ ] Back-Cast Engine (pure SQL — did manual reorder points actually prevent stockouts?)
- [ ] Demand forecasting (simple moving average)

### 3.4 Supplier & Customer Management
- [ ] Supplier table (schema update)
- [ ] Customer table (schema update)
- [ ] Supplier/customer CRUD pages
- [ ] Link transactions to suppliers/customers

### 3.5 Mobile Responsiveness
- [ ] Audit mobile layout (all pages)
- [ ] Optimize tables for mobile
- [ ] Test on real devices

---

## Phase 4: Intelligence Layer (ML)

### 4.1 Back-Cast Engine (no Python required)
- [ ] Pure SQL query: did `reorderPointUnits` actually prevent stockouts per product?
- [ ] Surface as an "accuracy score" on the inventory page
- [ ] Prove ROI before touching ML

### 4.2 Python Microservice (FastAPI on Railway/Render)
- [ ] Lead-time forecasting (regression on `Shipment` data)
- [ ] Reorder signal (time-series on `Transaction` data)
- [ ] Called from Next.js via HTTP Route Handler

### 4.3 Intelligence Dashboard Panel
- [ ] FX Watch — current RWF/USD rate + volatility (from `FXRate` table)
- [ ] Corridor Risk — active port delay flag (from `Shipment` table)
- [ ] "Buy Now" advisory signal

### 4.4 External Enrichment
- [ ] FX hedging signal (external API)
- [ ] Weather / satellite data integration (Season A/B demand signal)

---

## Phase 5: UX Enhancements

### 5.1 Accessibility (a11y)
- [ ] axe-core audit
- [ ] Proper ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader testing (NVDA/JAWS)

### 5.2 Onboarding
- [ ] First-time user tour
- [ ] Sample data seeder (demo mode)

### 5.3 Internationalization
- [ ] English + French translations
- [ ] Kinyarwanda (optional)

---

## Testing Strategy

### Unit Tests
- [x] Zod schema validation (CSV rows)
- [ ] Utility functions (date formatters, price cleaners)
- [ ] Auth helper functions (role checks)

### Integration Tests
- [ ] Server Actions (import, product CRUD, user CRUD)
- [ ] Database queries (Prisma operations)
- [ ] API routes

### End-to-End Tests (Playwright)
- [ ] Login flow
- [ ] CSV import (happy path + error handling)
- [ ] Dashboard navigation
- [ ] Transaction filtering
- [ ] Role-gated product edit modal
- [ ] User management (Admin)

---

## Progress Log

### 2026-03-22 (Checkpoint 1) — Foundation & Testing Setup
Vitest, `.env.example`, retry logic, chunked import, route groups, landing page.

### 2026-03-25 (Checkpoint 2) — Dashboard Polish + Transactions Foundation
KPI corrections, stock table, error boundaries, loading skeletons, transactions page.

### 2026-03-28 (Checkpoint 3) — Role-Gated Modal + Admin User Management
`ProductDetailModal`, `UsersTable`, full user CRUD server actions, audit log, CSV export, Sale + QuickAdd pages.

### 2026-03-29 (Checkpoint 4) — Phase 1 Audit + Deployment
Phase 1 confirmed complete. Live on Vercel. `NEXTAUTH_URL` fixed after domain rename. `dev` branch workflow established.

### 2026-04 to 2026-05 (Checkpoint 5) — Dashboard Charts + KPI Upgrade
Full Recharts integration (Groups A–E). KPI cards replaced with correct business metrics (Turnover Rate, Fulfillment Rate, Lost Sales Value, Capital Lock). Alerts panel. Financial mini cards. Inventory table upgraded (Coverage Days, Fulfillment %, Landed Cost, Margin %). Collapsible sidebar. Dark mode via context + localStorage. Sentry + Upstash rate limiting deployed.

### 2026-06 (Checkpoint 6) — Landing & Login Redesign
Full landing page redesign (Direction C — deep emerald gradient). Scroll-aware nav. Glassmorphism hero card. Dark ticker. All non-functional UI elements removed. Login page dark mode. localStorage key unified to `agri-dark-mode`.

---

**Version:** 2.0  
**Maintainer:** @Zolender  
**License:** MIT

# Challenges & Solutions: Rwanda Agri-Hub

This log tracks the technical hurdles encountered during the development of the Rwanda Agri-Hub project and how they were resolved.

## 1. Prisma v7 Driver Adapter Conflict

* Challenge: After upgrading to Prisma v7, the standard PrismaClient initialization failed. TypeScript threw errors stating new PrismaClient() expected 1 argument (the adapter) and refused to accept the pg Pool due to a type mismatch.
* Solution:
	+ Implemented Driver Adapters using @prisma/adapter-pg and the pg library.
	+ Resolved the "Pool type mismatch" (caused by conflicting @types/pg versions) by using type casting: const adapter = new PrismaPg(pool as any).
	+ Moved to a Singleton pattern in lib/db.ts to prevent database connection exhaustion during Next.js hot-reloading.

## 2. The "Crypto" Module & Edge Runtime

* Challenge: When adding middleware.ts for route protection, the app crashed with the error: The edge runtime does not support Node.js 'crypto' module.
* Why it happened: Next.js Middleware runs on the "Edge Runtime" (a slimmed-down environment), while libraries like bcrypt and prisma require the full Node.js environment.
* Solution:
	+ Split the Auth Config: Created a "light" auth.config.ts for the Middleware and a "heavy" auth.ts for the server-side logic.
	+ Switched to bcryptjs: Replaced the native bcrypt with bcryptjs, which is written in pure JavaScript and more compatible with various runtimes.
	+ Session Strategy: Switched to strategy: "jwt" in the Auth config to ensure compatibility across the Edge.

## 3. Manual Database Seeding in Prisma 7

* Challenge: Running a seed script to create the first Admin user was failing because the script couldn't find the generated Prisma types or the database connection.
* Solution:
	+ Created prisma/seed.ts using tsx to handle TypeScript execution.
	+ Manually assembled the Prisma engine inside the script (Connection Pool -> Adapter -> Client).
	+ Added pool.end() in the .finally block to prevent the script from "hanging" after completion.

## 4. File Extension Sensitivity (.ts vs .tsx)

* Challenge: React components (like the Transactions page) showed cryptic syntax errors where HTML tags (e.g., <main>) were treated as "less than" operators.
* Solution:
	+ Ensured all files containing JSX/React components use the .tsx extension, while pure logic/utility files use .ts.

## 5. NextAuth (Auth.js) Role-Based Access (RBAC)

* Challenge: Needed a way to differentiate between Admin, Manager, and Analyst without querying the database on every single page load.
* Solution:
	+ Updated schema.prisma with a UserRole Enum.
	+ Used the Session Callback in auth.ts to "stamp" the user's role onto the session cookie. This allows the UI to instantly know the user's permissions.

## 6. Schema Mapping Discrepancy

* Challenge: Encountered Object literal may only specify known properties errors in Prisma.
* Why: The frontend code was using generic field names (sku, price) while the schema.prisma was using specific business names (id, unitCostRwf).
* Solution: Rewrote the Zod validation schema and Prisma upsert logic to strictly match the database model naming conventions.

## 7. The "Ghost Row" & Greedy Parsing

* Challenge: The CSV import kept crashing with a "Validation failed: expected string, received undefined" error, even though the data looked correct in the file.
* Discovery: CSV parsers often read the trailing "Enter" (newline) at the end of a file as a new, empty row.
* Solution:
	+ Implemented skipEmptyLines: 'greedy' in the Papaparse configuration to ignore whitespace-only rows.
	+ Added a .filter() method in the Server Action to manually strip out rows missing an id before processing.

## 8. The "Silent Bouncer" (Session Context)

* Challenge: Even when logged in, the Server Action was returning "Security Fail: No Session," preventing the import.
* Why it happened: In Next.js, Server Actions sometimes lose the session context if the "handshake" between the browser cookie and the server is stale or if the auth import is misconfigured.
* Solution:
	+ Performed a "Hard Reset" (Logout -> Restart Server -> Login) to refresh the JWT.
	+ Strengthened the auth() check inside the action to return a clean error message instead of crashing the process.

## 9. Zod v3.x Error Handling

* Challenge: TypeScript error: Property 'errors' does not exist on type 'ZodError'.
* Solution: Updated the catch block to use .issues (the modern Zod standard) instead of .errors.
* Example: error.issues[0].message.

## 10. Schema-Code Naming Alignment

* Challenge: Data was not saving because the frontend used sku and price while the database schema used id and unitCostRwf.
* Solution: Renamed all Zod schema keys and Prisma upsert keys to strictly match the schema.prisma file.

## 11. The "Too Many Redirects" Loop

Challenge:
* The application entered an infinite redirect loop when trying to access the dashboard, with the browser reporting "The page redirected you too many times."

Why it happened:
* A conflict between the Next.js Middleware and the App Layout guard. The Middleware was protecting the /login page from itself, or the Layout was redirecting unauthenticated users to a path that the Middleware then sent back, creating a circular logic trap.

Solution:

* Refined the middleware.ts matcher to explicitly exclude static assets and authentication API routes.
* Ensured the SessionProvider wrapped the root of the application so that the "Auth Status" was consistent across both Server and Client components.

## 12. Client-Side Context (The useSession hurdle)

Challenge:
* Encountered the runtime error: [next-auth]: useSession must be wrapped in a <SessionProvider />.

Why it happened:
* The new SidebarNav was converted to a Client Component to handle interactive navigation, but it was being rendered inside a Server Layout that lacked the necessary React Context.

Solution:

* Created a dedicated Providers.tsx Client Component.
* Wrapped the {children} in the root layout.tsx with this provider, ensuring every component in the tree has access to the user's session data.

## 13. The "Mega-Dataset" Body Limit (1MB Gate)

Challenge:
* Attempting to import the real-world dataset (2,000+ rows) triggered a 413 Payload Too Large error, specifically: Body exceeded 1 MB limit.

Why it happened:
* Next.js Server Actions have a default security limit of 1MB for incoming data to prevent DOS attacks. A 20-column CSV with thousands of rows easily exceeds this.

Solution:

* Implemented Client-Side Chunking. Instead of sending the whole file at once, the frontend now "slices" the data into batches of 100 rows.

This bypasses the 1MB limit and prevents the server from timing out during massive database operations.

## 14. Transaction Timeout & Expiry

Challenge:
* The import failed with Transaction API error: A rollback cannot be executed on an expired transaction.

Why it happened:
* Prisma's default interactive transaction timeout is 5 seconds. Processing 100 upsert operations (which include complex relational logic) was taking longer than the 5000ms limit.

Solution:

* Moved away from a strict $transaction for the bulk import.
* Switched to Promise.all() to process the validated chunk in parallel. This allows the database to handle the load more flexibly without a global "kill switch" timer.

## 15. Snake_Case vs. CamelCase Mapping

Challenge:
* The real-world CSV used standard database naming (product_id, unit_cost_rwf), but the Prisma schema used TypeScript standards (id, unitCostRwf). The import finished with "0 records" because no fields matched.

Solution:

* Updated the RowSchema (Zod) to act as a Translation Layer.
* It now captures the raw snake_case headers from the CSV and maps them manually to the camelCase fields required by the Prisma create and update methods.

## 16. The "Safety Lock" (Navigation Protection)

Challenge:
* If an admin navigated away or closed the tab during a 2,000-row import, the process would die halfway through, leaving the database partially updated.

Solution:

* Implemented the beforeunload browser event listener that triggers only while isUploading is true.
* Added a "Confirmation Question" (window.confirm) before the import starts.
* Implemented a fixed inset-0 UI overlay that visually locks the screen and shows a progress percentage, preventing accidental navigation within the app.

## 17. Schema Evolution & Missing Required Fields

Challenge:
* After making `quantityOrderedUnits` a required field (removing the `?` optional marker) in the Prisma schema, the CSV import began failing with cryptic "endpoint doesn't exist" errors.

Why it happened:
* The `recordSaleAction` function in `inventory.ts` was still written for the old schema and wasn't providing this field when creating transactions.
* The generated Prisma client was out of sync with the actual database schema.

Solution:
* Updated `recordSaleAction` in `inventory.ts` to include `quantityOrderedUnits: quantitySold`.
* Ran `npx prisma generate` to regenerate the Prisma client.
* Key rule: always run `prisma generate` after schema changes, even after `migrate dev`.

## 18. Error Boundary Implementation (Next.js 15)

* Challenge: Needed to handle errors gracefully without white screens.
* Solution: Created `error.tsx` file in route group for automatic error catching.
* Key Learning: Next.js 15 has built-in error boundaries at the route level.

## 19. Loading States with Skeletons

* Challenge: Tables showed blank screen while data loaded.
* Solution: Created `loading.tsx` with animated skeleton screens.
* Key Learning: `loading.tsx` automatically wraps async Server Components in Suspense.

## 20. Next.js 15 Async searchParams

* Challenge: Filters weren't working — searchParams not being read.
* Root Cause: Next.js 15 changed searchParams to async Promise for Partial Prerendering.
* Solution: Changed type to `Promise<SearchParams>` and added `await searchParams`.
* Key Learning: Next.js 15 made several params async (searchParams, params) for better performance.

## 21. `"use server"` Files Only Allow Async Exports

* Challenge: TypeScript/Next.js error — "Server action functions must be async" — thrown on `checkPasswordStrength`, a plain synchronous utility placed inside a `"use server"` file.
* Why it happened: The `"use server"` directive at the top of a file applies to **every exported function** in that file. Next.js enforces that all exports from a server action file are async, because they may be called as RPC endpoints.
* Solution:
  + Moved `checkPasswordStrength` to `app/lib/utils/password.ts` — a plain utility file with no directive.
  + Imported it from both `admin.ts` (server) and `createUserModal.tsx` (client) — one source of truth, zero duplication.
* Key rule: `"use server"` files = async server actions only. Pure utility functions → `lib/utils/`.

## 22. Stale Prisma Client After Schema Migration

* Challenge: After adding the `AuditLog` model and running `prisma migrate dev`, the app threw `TypeError: Cannot read properties of undefined (reading 'findMany')` on `prisma.auditLog`.
* Why it happened: `prisma migrate dev` creates the table in the database but doesn't always regenerate the TypeScript client automatically — especially with a custom `output` path (`../app/generated/prisma`). The client in memory still had the old schema with no `auditLog` property.
* Solution: Ran `npx prisma generate` manually after the migration, then restarted the dev server.
* Key rule: After every schema change → `prisma migrate dev` + `prisma generate`. When in doubt, generate.

## 23. Server Component Dark Mode (The Split Component Pattern)

* Challenge: A server component page (`/admin/audit`) ignored dark mode — it had no access to `useDarkMode()` since that hook reads from React Context, which only exists on the client.
* Why it happened: Server components run on the server at request time — there is no browser, no localStorage, no React Context available. Hooks like `useDarkMode()` simply cannot be called there.
* Solution: Split the page into two files:
    + `page.tsx` — server component: handles auth check + DB fetch, passes data as props.
    + `AuditLogTable.tsx` — client component (`"use client"`): receives data as props, calls `useDarkMode()`, renders the UI.
* Key rule: Server components fetch data. Client components handle interactivity and browser APIs. They compose — server renders client, never the other way.

## 24. Recharts Cannot Be Server-Side Rendered

* Challenge: Adding a Recharts chart component to a dashboard page caused a build crash: `SyntaxError: Cannot use import statement in a module`. Recharts (and most charting libraries) use browser-only APIs (`window`, `ResizeObserver`) that do not exist in Node during server rendering.
* Why it happened: The dashboard `page.tsx` is a Server Component. Importing a Recharts component directly means Next.js tries to render it on the server, where the browser APIs it depends on are absent.
* Solution:
  + Created `ChartClientWrappers.tsx` — a single client component file (`"use client"`) that re-exports every chart component wrapped with `next/dynamic` and `ssr: false`.
  + Imported charts only from `ChartClientWrappers.tsx`, never directly.
* Key rule: Any third-party component that touches `window`, `document`, or DOM APIs at import time needs `next/dynamic` with `ssr: false`. Centralizing those wrappers in one file (`ChartClientWrappers.tsx`) keeps the pattern DRY.

## 25. Dark Mode via Tailwind `dark:` vs. React Context

* Challenge: Adding `dark:` Tailwind classes to dashboard components had no effect — toggling the sidebar dark mode button changed the icon but nothing else responded.
* Why it happened: Tailwind's `dark:` prefix works by watching for a `dark` class on the `<html>` element (or `prefers-color-scheme` media query). The app's dark mode toggle writes to React state (`DarkModeContext`) and `localStorage` — it does NOT add a class to `<html>`. So `dark:` classes are permanently inactive.
* Solution: Removed all `dark:` class usage from dashboard components. All dark/light variants are expressed as inline conditionals: `isDark ? 'bg-stone-900' : 'bg-white'`. The `useDarkMode()` hook from `DarkModeContext` provides the boolean.
* Key rule: In this codebase, dark mode is state-driven, not class-driven. Never use Tailwind `dark:` prefix. Always use `isDark ? '...' : '...'` conditionals.

## 26. Public Pages Cannot Use the Dashboard's DarkModeContext

* Challenge: The landing page and login page ignored the dark mode toggle — clicking it had no effect on those pages.
* Why it happened: `DarkModeContext` is provided inside the `(app)` layout, which wraps only the authenticated dashboard routes. The public pages (`/` and `/login`) live in the `(public)` route group, which has its own layout with no context provider. Calling `useDarkMode()` on a public page would throw or return stale values.
* Solution:
  + Public pages read and write `localStorage` directly, using the same key: `agri-dark-mode`.
  + An `addEventListener('storage', ...)` listener keeps the login page in sync when the key changes in another tab.
  + The key was also unified (was `'darkMode'` on the old landing page) so toggling from one page carries over consistently.
* Key rule: Context providers do not cross route group layout boundaries. Public pages that need `localStorage`-persisted state must manage it themselves using the same key as the rest of the app.
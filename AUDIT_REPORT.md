# POS Pharmacy - Complete Codebase Audit Report

---

## CRITICAL ISSUES (Must Fix - Will Crash or Data Loss)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **`startServer().then()` called before function definition** — `startServer` is a `function` expression assigned to a `const` at line 169, but called at line 74. Throws `ReferenceError` at startup. | `server/src/index.ts:74-83` | **App crashes on launch.** Entire app non-functional. |
| C2 | **No authentication on 3 route groups** — Printing, H1 Register (sensitive patient drug data), and Audit Log routes have no auth middleware. | `server/src/routes/printing.ts`, `h1RegisterRoutes.ts`, `auditLogRoutes.ts` | **Unauthenticated access to patient data, audit trails, and printer control.** |
| C3 | **Shell injection in printer name** — User-controlled `printerName` interpolated into `copy /b "${tmpFile}" "${this.printerName}"` without escaping. | `server/src/services/printerService.ts:212` | **RCE via printer settings.** Attacker sets printer name to `& del /f /q *.* &`. |
| C4 | **Settings printer fields never persist** — Printer fields appended to `updateFields`/`values` *after* the SQL executes. They are lost. | `server/src/models/Settings.ts:70-88` | **Printer settings cannot be saved.** Every restart reverts printer config. |
| C5 | **Electron preload imports `'electron/main'`** — Invalid path that does not exist in the `electron` package. | `electron/preload.ts:2` | **Preload script crashes at runtime** in production builds. |
| C6 | **tailwind.config.js mixes ESM + CJS** — `export default` (ESM) with `require()` (CJS) in a `"type": "module"` project. | `tailwind.config.js:24` | **Tailwind build fails.** App has no styles. |
| C7 | **`dist-electron/` contains stale compiled files** — Outdated `main.cjs`, `main.js`, `preload.js` override correct source at build time. | `dist-electron/` directory | **Production build ships broken Electron main process.** |
| C8 | **4 migration files never run** — They export named functions (`addHsnCode`, `addAutoPrint`, etc.) but the migration runner looks for `up()`. These migrations are dead code. | `server/src/database/migrations/002_hsn.ts`, `003_auto_print.ts`, `004_products_upgrade.ts`, `005_soft_delete.ts` | **Missing columns in production databases.** Schema drift. |
| C9 | **Backup always uses `pos_billing.db`** — Hardcoded database name ignores `APP_TYPE` env var. Wrong DB gets backed up. | `server/src/database/backup.ts` | **Pharmacy mode backs up wrong database.** Restore is catastrophic. |
| C10 | **User role definitions inconsistent** — Schema default `'cashier'`, TypeScript interface `'admin' | 'staff'`, model code uses `'owner' | 'manager' | 'cashier'`. | `server/src/types/index.ts`, `models/User.ts`, DB schema | **Auth/authorization logic may malfunction.** Users created with mismatched roles. |

---

## HIGH PRIORITY (Should Fix - Degraded Experience or Risk)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | **Duplicate `useAuth` hook** — Zustand store at `src/auth/useAuth.ts` is never imported (dead code) but name-collides with context version. | `src/auth/useAuth.ts` | **Confusion risk.** Could accidentally import wrong one. |
| H2 | **Duplicate shadcn/ui directories** — `@/components/ui/` (19 components) vs `src/components/ui/` (5 components). Three different import patterns. Fragile resolution. | `@/components/ui/` vs `src/components/ui/` | **Build breaks** if imports don't resolve to the right directory. |
| H3 | **`window.location.href = "/login"` incompatible with HashRouter** — In Electron with HashRouter, this navigates to the wrong path. | `src/renderer/services/api.ts:24` | **Auth redirect broken** in production. Users stuck on 401. |
| H4 | **Triple duplicate backend build configs** — `rollup.config.js`, `build-backend.mjs`, and inline `build:backend` in package.json all build the same input. Only the inline script is used. | `rollup.config.js`, `build-backend.mjs` | **Confusion.** Developer may use wrong build script. |
| H5 | **Missing indexes on frequently queried columns** — `sale_items(product_uuid)`, `sale_items(batch_uuid)`, `product_units(product_uuid)`, `audit_logs(action_type)`, `audit_logs(entity_type, entity_uuid)`. | Various tables | **Slow queries on reports, product searches, and audit log filtering** — degrades with data growth. |
| H6 | **N+1 query patterns** — `ProductModel.findAll()` queries attributes per-product, `PurchaseModel.findAll()` fetches relations per-purchase, `CustomerModel.getAging()` queries ledger per customer. | `models/Product.ts`, `Purchase.ts`, `Customer.ts` | **O(N) extra queries per result.** Slows dashboards and reports. |
| H7 | **No `sandbox: true` in Electron BrowserWindow** — Renderer process is not sandboxed. | `electron/main.cjs:124-128` | **Security risk.** Renderer compromise could access Node.js APIs. |
| H8 | **No Content Security Policy** in Electron main process. | `electron/main.cjs` | **XSS risk.** No protection against injected scripts. |
| H9 | **`tsconfig.app.json` includes `server/` directory** — Backend Node.js code in frontend TypeScript config. | `tsconfig.app.json:28` | **Type-checking issues** and potential build confusion. |
| H10 | **Missing indexes on report-critical tables** — `stock_ledgers(product_uuid, type)`, `sale_items(product_uuid, sale_uuid)`. | Report-related tables | **Slow dashboard and report generation** as data scales. |
| H11 | **Non-atomic invoice number generation** — Reads last invoice, increments, writes — not in a transaction. | `server/src/models/Sale.ts` (invoice number) | **Duplicate invoice numbers** possible under concurrent sales. |
| H12 | **`asar: false` in electron-builder config** — Disables all asar benefits despite having `asarUnpack` for native modules. | `package.json:31` | **Slower app startup, more file handles.** |

---

## MEDIUM PRIORITY (Should Fix - Maintainability)

| # | Issue | Location |
|---|-------|----------|
| M1 | Dead file: `src/router/AppRouter.tsx` — never imported. | `src/router/AppRouter.tsx` |
| M2 | Dead import: `ProtectedRoute` imported but unused in JSX. | `src/App.tsx:24` |
| M3 | Dead file: `src/main/main.ts` — legacy Electron entry. | `src/main/main.ts` |
| M4 | Dead file: `src/pages/pos/modals/InvoiceModal.tsx` — placeholder only. | `src/pages/pos/modals/InvoiceModal.tsx` |
| M5 | Dead code: `config/database.ts` — never imported anywhere. | `server/src/config/database.ts` |
| M6 | Dead code: `runMigrations.ts` — proper migration system never called. | `server/src/database/migrations/runMigrations.ts` |
| M7 | `SaleModel` is 1607 lines — violates Single Responsibility Principle. | `server/src/models/Sale.ts` |
| M8 | `voidSale()` method in `SaleModel` never exposed via any route. | `server/src/models/Sale.ts` |
| M9 | Customer route uses inline `require()` instead of imported controller. | `server/src/routes/customers.ts:22-31` |
| M10 | Response format inconsistency — some endpoints return `{ error: '...' }`, others `{ success: false, data: ..., error: '...' }`. | All controllers |
| M11 | `is_deleted` column added by two separate migrations (004 + 005). | `004_products_upgrade.ts`, `005_soft_delete.ts` |
| M12 | `image` column added by two separate migrations (003 + 004). | `003_auto_print.ts`, `004_products_upgrade.ts` |
| M13 | `unit_uuid` column added by two paths (004 migration + runSingleMigration.ts). | `004_add_unit_uuid_to_cart_items.ts`, `runSingleMigration.ts` |
| M14 | Error messages leaked to client in `productController.ts`. | `server/src/controllers/productController.ts:397` |
| M15 | `console.log` statements left in production code (cartController, purchaseModel). | `cartController.ts:422`, `purchaseModel.ts` |
| M16 | No `down()` migrations — no rollback path. | All migration files |
| M17 | `StockLedger` interface defined twice in types/index.ts. | `server/src/types/index.ts:432, 453` |
| M18 | String interpolation (not parameterized) in Report.ts (low risk, safe input). | `server/src/models/Report.ts:37-40` |
| M19 | `medicine_returns` table has NO foreign key constraints. | DB schema |
| M20 | `h1_register` table has NO foreign key constraints. | DB schema |
| M21 | No CHECK constraints on any numeric/status columns. | DB schema |
| M22 | Missing transactions on `CartModel.clearCart()` and `deleteByUuid()`. | `models/Cart.ts` |
| M23 | `dist-electron/` not in `.gitignore`. | `.gitignore` |
| M24 | `meta.json` not in `.gitignore` — large build artifact committed. | `.gitignore` |

---

## LOW PRIORITY (Nice to Have)

| # | Issue | Location |
|---|-------|----------|
| L1 | Duplicate `StatCard` components defined inline in 6 admin pages. | `Staff.tsx`, `Customer.tsx`, `Supplier.tsx`, `PurchaseHistory.tsx`, `DailyReport.tsx`, `GSTReport.tsx` |
| L2 | `Product` type has duplicate `manufacturer` key in renderer types. | `src/renderer/types/product.ts` |
| L3 | Hardcoded URLs in `LicenseGate.tsx` alongside service imports. | `src/components/LicenseGate.tsx` |
| L4 | CSS boilerplate from starter template in `App.css`. | `src/App.css` |
| L5 | `CustomerStatement.tsx` uses `any` types for all props. | `src/pages/admin/CustomerStatement.tsx` |
| L6 | Preload bridge exposes `window.electron` but nothing consumes it. | `electron/preload.ts` |
| L7 | Author email is placeholder (`your.email@example.com`). | `package.json` |
| L8 | Both `better-sqlite3` and `sqlite3` listed as dependencies. | `package.json` |
| L9 | `@vercel/ncc` in devDependencies but not used. | `package.json` |
| L10 | `vite-tsconfig-paths` installed but unused in vite config. | `package.json`, `vite.config.ts` |

---

## Optimization Ranking (By Real-World Impact)

| Rank | Fix | Expected Impact |
|------|-----|-----------------|
| 1 | C1 — Fix `startServer()` hoisting bug | **App will actually start.** |
| 2 | C5 — Fix preload import | **Electron app won't crash on launch.** |
| 3 | C6 — Fix tailwind.config.js | **Styles will compile.** |
| 4 | C7 — Clean dist-electron/ and add to .gitignore | **Production build won't ship broken code.** |
| 5 | C4 — Fix printer settings save bug | **Printer configuration persists.** |
| 6 | C2 — Add auth to unauthenticated routes | **Security: patient data & audit logs protected.** |
| 7 | C3 — Escape printer name | **Security: prevents RCE.** |
| 8 | H3 — Fix auth redirect for HashRouter | **Users can actually log in in production.** |
| 9 | H2 — Consolidate shadcn directories | **Build reliability, consistent imports.** |
| 10 | C9 — Fix backup DB name resolution | **Backed up data matches running app.** |
| 11 | H5 + H10 — Add missing indexes | **Faster queries, reports, dashboards.** |
| 12 | H7 + H8 — Add sandbox + CSP to Electron | **Security hardening.** |
| 13 | C10 — Fix role type inconsistency | **Auth/authorization works correctly.** |
| 14 | H1 — Remove dead Zustand auth store | **Clean code, no confusion.** |
| 15 | H4 — Remove duplicate build configs | **Simpler build system.** |
| 16 | H6 — Fix N+1 queries | **Faster product/purchase/customer queries.** |
| 17 | H12 — Enable asar packaging | **Faster app startup.** |
| 18 | H9 — Fix tsconfig include | **Cleaner type-checking.** |

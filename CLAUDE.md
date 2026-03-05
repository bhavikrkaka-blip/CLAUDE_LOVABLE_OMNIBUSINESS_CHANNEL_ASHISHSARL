# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Mission

This is Ashish SARL OmniBusiness — React + Vite + TypeScript + Supabase. Start with Priority #1 from the audit: merge the two product tables (products and products_master) into a single unified source of truth so the ecommerce storefront and ERP share one product database with multi-tier pricing.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build (also fetches sitemap.xml from Supabase)
npm run build:dev    # Development build
npm run lint         # ESLint
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

Tests use `jsdom` environment with `@testing-library/react`. Test files must match `src/**/*.{test,spec}.{ts,tsx}`.

The `@` alias resolves to `./src` in both Vite and Vitest configs.

## Architecture Overview

This is a **full-stack e-commerce + ERP platform** for Ashish SARL, a retail/wholesale store in Yaoundé, Cameroon. The frontend is React + TypeScript + Vite + Tailwind + shadcn/ui. The backend is entirely Supabase (Postgres, Auth, Storage, Edge Functions).

### Two Auth Systems Running in Parallel

There are two separate auth contexts that both listen to the same Supabase auth session:

- **`AuthContext`** (`src/contexts/AuthContext.tsx`) — for admin users. Uses `supabase.rpc("has_role")` to check if the user has the `admin` role in the `user_roles` table. Exposes `isAdmin`.
- **`CustomerAuthContext`** (`src/contexts/CustomerAuthContext.tsx`) — for storefront customers. Fetches the user's profile from the `profiles` table on login. Exposes `profile`.

Admin routes are gated by `ProtectedRoute` (`requireAdmin` prop), which reads from `AuthContext`.

### Data Fetching Pattern

All Supabase queries go through **TanStack Query** hooks in `src/hooks/`. Each entity has a dedicated hook file (e.g., `useProducts.ts`, `useCart.ts`, `useOrders.ts`). Mutations call `queryClient.invalidateQueries` on success. The Supabase client is a singleton at `src/integrations/supabase/client.ts` and is typed against `Database` from `src/integrations/supabase/types.ts` (auto-generated — do not edit manually).

### Image Proxy

All product images are routed through the `serve-image` edge function to hide storage URLs. Always use `getProxiedImageUrl()` from `src/lib/imageProxy.ts` when rendering product images, not the raw Supabase storage URL.

### Supabase Edge Functions

Located in `supabase/functions/`. Written in Deno (TypeScript). Each function is a standalone HTTP handler. Most business-critical operations (sales, purchases, stock audits, AI image processing) run server-side here rather than directly from the client.

Key functions:
- `manage-sales` / `manage-sale-edit` / `manage-purchases` / `manage-stock-audit` — ERP transactional operations (admin-only, check `user_roles` table)
- `customer-chat` — AI chatbot powered by the product catalog; builds a system prompt from live DB data
- `serve-image` — Image proxy for both Supabase Storage and external URLs
- `product-search` / `generate-embeddings` / `backfill-embeddings` — Semantic product search via vector embeddings
- `categorize-product-image` / `process-product-image` / `refine-product-image` — AI image intake pipeline
- `import-products` / `manage-products-master` — Bulk product management
- `sitemap` / `indexnow` — SEO automation

Several functions have `verify_jwt = false` in `supabase/config.toml` — these do their own auth checking internally.

### Routing Structure

- `/` — Storefront (Index, Products, ProductDetail, Blog, BlogPost)
- `/checkout` — Checkout flow
- `/my-account/*` — Customer dashboard (Profile, Orders, Favorites, Settings) — requires customer login
- `/admin/*` — Admin panel wrapped in `AdminLayout` with collapsible sidebar — requires admin role
- `/pos` — Point-of-Sale terminal (inside admin route guard)

### Internationalisation

The app supports **English and French** via `src/i18n/LanguageContext.tsx`. Use the `useLanguage()` hook to get `{ t, language, setLanguage }`. All user-visible strings should use translation keys from `src/i18n/translations.ts`. Products have bilingual fields: `name`/`name_fr`, `description`/`description_fr`. Default language is French for French browser locales (targeting Cameroon users), English otherwise. Preference is saved in `localStorage` under key `ashish-language`.

### Key Database Tables

`products`, `inventory`, `orders`, `order_items`, `cart_items`, `profiles`, `user_roles`, `banners`, `featured_products`, `blog_posts`, `purchases`, `sale_items`, `stock_audit_log`, `click_events`, `sessions` (analytics).

Admin role is stored in the `user_roles` table and checked via the `has_role(user_id, role)` RPC function.

### Facebook Pixel & GA4 Analytics

The Pixel ID, enabled state, and GA4 Measurement ID are stored in the `system_settings` DB table (`fb_pixel_id`, `fb_pixel_enabled`, `ga4_measurement_id`). The `AppAnalytics` component in `App.tsx` reads from DB via `useSystemSettings()` hook and mounts both `FacebookPixel` and `GoogleAnalytics` dynamically. Configured through Admin → Facebook tab.

### New DB Tables (Migration 20260304000002)

- `delivery_zones` — per-city shipping fee zones with FCFA base_fee
- `promotions` — time-boxed discounts (store-wide, category, or product-scoped)
- `coupons` — unique discount codes with use limits and validity window
- `accounts` — OHADA chart of accounts (asset/liability/equity/revenue/expense)
- `journal_entries` + `journal_lines` — double-entry bookkeeping

### New RPCs (20260304000002)

- `increment_coupon_uses(p_coupon_id)` — atomically increments coupon use count on order
- `validate_coupon(p_code, p_order_amount)` — validates and returns coupon details; raises exception if invalid

## Audit Report Summary

### All 22 Priorities Completed (2026-03-04)

| # | Priority | Status | Key Files |
|---|---|---|---|
| 1 | Merge products + products_master | ✅ Done | `20260304000000_merge_products.sql` |
| 2 | Wire remove.bg (already Gemini) | ✅ Done | `process-product-image` edge fn |
| 3 | FB Pixel + GA4 → system_settings | ✅ Done | `AppAnalytics.tsx`, `GoogleAnalytics.tsx` |
| 4 | Barcode generator + print label | ✅ Done | `BarcodeDisplay.tsx`, `PrintLabelDialog.tsx` |
| 5 | Mobile camera barcode scan | ✅ Done | `BarcodeScanner.tsx` (ZXing) |
| 6 | GA4 integration | ✅ Done | `GoogleAnalytics.tsx` |
| 7 | Fix chatbot RAG pipeline | ✅ Done | `customer-chat/index.ts` (3-tier RAG) |
| 8 | Image search frontend UI | ✅ Done | `AdminImageSearch.tsx` |
| 9 | Delivery zone + shipping calc | ✅ Done | `DeliveryZoneManager.tsx`, `CheckoutPage.tsx` |
| 10 | Promotion scheduler | ✅ Done | `PromotionScheduler.tsx` |
| 11 | POS print invoice (thermal/A4) | ✅ Done | `POSPrintInvoice.tsx` → POS.tsx |
| 12 | Guest checkout | ✅ Done | `CheckoutPage.tsx` (no auth wall) |
| 13 | Order detail view in admin | ✅ Done | `OrderDetailDialog.tsx` |
| 14 | Abandoned cart analytics | ✅ Done | `AbandonedCartAnalytics.tsx` |
| 15 | Coupon / discount code engine | ✅ Done | `CouponManager.tsx`, `useOrders.ts` |
| 16 | Customer POS lookup | ✅ Done | `CustomerLookup.tsx` |
| 17 | Daily Z-report | ✅ Done | `DailyZReport.tsx` (print A4) |
| 18 | Product image cards in chatbot | ✅ Done | `AIChatBot.tsx` (bold-text detection) |
| 19 | Accounts Receivable / Payable | ✅ Done | `AdminAccounting.tsx` |
| 20 | Chart of Accounts + journal | ✅ Done | `AdminAccounting.tsx` (double-entry) |
| 21 | VAT / tax fields & reports | ✅ Done | `AdminAccounting.tsx` (P&L tab) |
| 22 | Trial Balance / Balance Sheet | ✅ Done | `AdminAccounting.tsx` (Trial Balance + BS tabs) |

### Completion Status (Updated 2026-03-04)

| Area | Status |
|---|---|
| Ecommerce Auth | 100% |
| Ecommerce Shopping | 100% (guest checkout, coupons, delivery zones) |
| Admin Dashboard | 100% (all new tabs wired) |
| ERP Inventory | 100% (barcode, print labels, scanner) |
| ERP POS | 100% (print invoice, customer lookup, barcode scan) |
| ERP Accounting | 100% (chart of accounts, journal, trial balance, P&L) |
| AI / Chatbot | 100% (RAG pipeline, product image cards) |
| **Overall** | **~95%** (AbandonedCart needs cart_events table data) |

# Admin mock-data review

**Verdict:** Admin-এ এখনো কয়েকটা জায়গায় mock/demo data আছে। নিচে শুধু business/demo data; nav/permission/status label-এর মতো static config বাদ।

> Reviewed without code changes. Use this list later to decide what to keep, remove, or replace with live APIs.

---

## Still mock / partial mock

| # | Area | Route | What’s mocked |
|---|------|-------|----------------|
| 1 | **Marketing** | `/admin/marketing` | পুরো page — KPI, campaigns, automations (`data/admin.ts`) |
| 4 | **Notification templates** | `/admin/notifications` | Template list + channel toggles local-only; preview sample data |
| 5 | **Inventory ledger** | `/admin/inventory` | Stock movements seed; levels API live |
| 6 | **Product import** | `/admin/products/import` | Demo CSV wizard (no real upload API) |
| 7 | **Analytics fallbacks** | `/admin/analytics` | API fail/load-এর আগে mock KPIs/charts; export toast-only |
| 8 | **Staff seed flash** | `/admin/staff` | শুরুতে/`API fail`-এ fake staff & roles |
| 9 | **Payments reconcile UX** | `/admin/payments` | Fake reconcile flags, sync toast, “expected settlement” copy |
| 10 | **Product filters/editor fallback** | products UI | Empty DB হলে seed brands/categories/collections |
| 11 | **Theme offline fallback** | `/admin/theme` | API down → fallback theme + seed products preview |
| 12 | **Order ship couriers** | `/admin/orders/[id]` | Static courier list + fake success % |
| 13 | **Reports — Marketing export** | `/admin/reports` | Marketing group → stub CSV |
| 14 | **Demo login** | `/login` | `owner@gmail.com` / `customer@gmail.com` auto-fill |
| 15 | **Dashboard greeting** | `/admin` | “Tanti” + `roleMeta` name fallback |

**Orphan seed (unused but still in repo):** `data/admin.ts` — `auditLogs`, `notificationLogs`, `mediaAssets`, `themeVersions`, `entitlements`, `planFeatures`, `discounts` (live pages আর use করে না)।

---

## Mostly / fully live (API)

Orders, Returns, Products CRUD, Categories, Collections, Brands, Inventory **levels**, Customers, Reviews, Messages, Discounts, Shipping settings, Store settings, Media, Theme (when API up), Audit logs, Notification **logs**, Staff (after successful API load), Analytics (when overview API succeeds), Reports Sales/Catalog/Customers CSV, **Content** (announcement, About/Contact/FAQ, policies: returns/shipping/privacy/terms/cookies — DB-only, no mock/fallback).

---

## Not mock (static config — OK)

- Sidebar (`adminNav`), permission modules/actions
- Status labels, BD districts/areas
- Theme design presets

---

## Priority to replace first

1. Marketing (100% mock)
2. Notification templates
3. Inventory ledger
4. Analytics fallbacks + fake export
5. Product import wizard
6. Demo credentials on login

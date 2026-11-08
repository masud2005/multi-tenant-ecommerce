# Admin mock-data review

**Verdict:** Admin business screens now load from live APIs (or show empty/error). Fake seed rows are no longer shown when the API fails or returns empty. Demo login credentials remain on purpose.

> Updated after removing frontend mock/fallback displays across inventory, analytics, staff, payments, products, theme, orders, reports, import, and dashboard greeting.

---

## Intentionally kept

| Area | Route | Notes |
|------|-------|--------|
| **Demo login** | `/login` | `owner@gmail.com` / `customer@gmail.com` auto-fill — keep for local/dev demos |
| Static config | nav, permissions, status labels, BD districts, theme presets, courier **name** options | Not business data |

---

## Fully live / empty-or-error (no mock fallback)

| Area | Route | Behavior |
|------|-------|----------|
| Notification templates + logs | `/admin/notifications` | DB CRUD; empty/error only |
| Inventory levels + **movement ledger** | `/admin/inventory` | `GET /owner/inventory` + `GET /owner/inventory/movements` |
| Analytics | `/admin/analytics` | Overview API; fail → empty/`—`, not seed KPIs |
| Staff & roles | `/admin/staff` | API only; fail/empty → empty states |
| Payments | `/admin/payments` | Order payment rows only; no fake reconcile/sync |
| Product editor taxonomies | products editor | Empty selects + “create first” hints |
| Theme | `/admin/theme` | Fail → error + retry (no invented theme) |
| Orders list / detail | `/admin/orders` | API only; no client-store fallback |
| Reports | `/admin/reports` | Only 3 DB CSV exports: Orders, Inventory variants, Customers |
| Content / policies | `/admin/content` | DB-only |
| Dashboard greeting | `/admin` | Auth name + tenant store name |

---

## Not available yet (honest UI — no fake success)

| Area | Route | UI |
|------|-------|-----|
| Product CSV import/export | `/admin/products/import` | “Not available yet” + optional blank template headers |
| Analytics / inventory / payments export & gateway sync | various | Toast: not available yet |
| Physical stock count workflow | `/admin/inventory` | Toast: not available yet |

---

## Orphan seed files (unused by live pages; safe to delete later)

`data/admin.ts` leftovers: `stockMovements`, `auditLogs`, `notificationLogs`, `mediaAssets`, `themeVersions`, `entitlements`, `planFeatures`, `discounts`, person fields in `roleMeta`  
`data/analytics.ts` — seed series/KPIs (no longer imported by analytics page/service)

---

## Priority leftovers (optional cleanup)

1. Delete unused seed arrays in `data/admin.ts` / `data/analytics.ts`
2. Wire real CSV import when backend exists
3. Payments reconcile / gateway sync when APIs exist
4. Add more report types only when dedicated accurate aggregations exist

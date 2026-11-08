# Admin / storefront functional status

**Verdict:** Core **owner-operated** store is functional for **COD + manual bKash/Nagad** (checkout → order → verify/collect → cancel/refund ledger → fulfill → payments → CSV exports). Fake-success polish items (cancel, refund, invoice, list exports) and dashboard StoreContext leftovers were fixed.

> Last reviewed after cancel/refund APIs, export honesty, dashboard live panels, FAQ seed alignment, and dead payment helper cleanup. Demo login stays intentional.

---

## Payment model (product truth)

No SSLCommerz / Stripe / auto gateway.

| Method | Customer | Owner |
|--------|----------|--------|
| **COD** | Order `CONFIRMED`, pay on delivery | Mark COD collected → `PAID` + `codCollected` (also auto on Delivered) |
| **bKash / Nagad** | Phone + TrxID → `PENDING_PAYMENT` | Verify → PAID + CONFIRMED; Reject → FAILED + stock restore + notify |
| **Cancel** | Self-cancel until packed (`PATCH /customer/orders/:id/cancel`) | Owner status → `CANCELLED` restores stock |
| **Refund** | Via returns or owner records ledger | `POST /owner/orders/:id/refund` — **records** amount; payout is manual MFS |
| **`/pay` gateway page** | Removed (redirects to confirmation) | N/A |

Checkout API: only COD/bKash/Nagad, must be enabled in Settings → Payments, TrxID + sender required for MFS.

---

## What is fully live (OK)

| Area | Notes |
|------|--------|
| Checkout + order create | Live APIs; method/TrxID enforced |
| Customer cancel + invoice PDF | Real cancel API + real PDF download |
| Admin orders (list/detail) | Owner API; MFS verify/reject; COD collect; refund ledger |
| Admin payments | Owner orders ledger + real CSV |
| Reports | 3 DB CSVs: Orders, Inventory variants, Customers |
| List Exports | Products / Customers / Inventory / Orders / Audit — client CSV from loaded rows |
| Inventory levels + ledger | Live overview + movements |
| Analytics charts/KPIs | Overview API (page Export removed — use Reports) |
| Staff list/roles CRUD | Live staff API (see RBAC caveat below) |
| Theme, content/policies, discounts, shipping settings, returns admin | Live APIs |
| Notification templates | DB CRUD |
| Dashboard | Owner orders + analytics + returns counts + inventory low-stock + top from orders |

---

## Remaining honest limitations (not bugs)

| Item | Status |
|------|--------|
| Product CSV **import** | “Not available yet” (template download only) |
| Staff module permissions vs `@Roles(OWNER)` on most owner routes | Staff may see pages → API 403; fine if only Owner runs the store |
| Notification “logs” | User inbox, not delivery audit log |
| Seed FAQ/policies | Aligned to COD/MFS in seed file; **existing DB content** needs re-seed or Content editor update |
| `sslcommerz` / `stripe` in types/labels | Legacy enum compatibility; not offered in checkout |

---

## Intentionally kept (not business mock)

| Item | Notes |
|------|--------|
| Demo login | `owner@gmail.com` / `customer@gmail.com` |
| RBAC label config | `data/admin.ts` titles + permission matrices |
| Districts, courier **names**, `sizeGuide`, payment method marks | Static config |
| `data/tenants.ts` bootstrap | Until public store-info loads |

---

## Ops assumption

**Production path = Owner account.** Multi-staff with real module permissions needs backend role expansion before it is truthful.

---

## Cleanup done this pass

- Customer cancel API + stock restore; account invoice → real PDF  
- Owner refund API (ledger + optional restock); reject payment restores stock  
- Fake Export toasts → real CSV (products, customers, inventory); analytics Export removed  
- Dashboard returns / low-stock / top products from live APIs (no empty StoreContext)  
- FAQ/privacy/returns seed wording → COD + manual bKash/Nagad  
- Removed dead `completePayment` / `retryPayment` / local-only `refundOrder` / `cancelOrder` helpers  
- Removed unused inventory “Start count” and import “Export unavailable” panel  

# Section 06 — Reports & Visibility

> Read-only visibility over stock and every movement. **Channel:** ERP. See `00_Project_Overview.md`.
> **Status:** 10 report screens built & verified in the mockups (see `mockups/MOCKUP_STATUS.md`). This spec
> was rewritten 2026-06-17 to match what was actually built (the original named only 6 and listed aging /
> utilization as out-of-scope — both are now in v1).

## Purpose
Because stock is client-owned, the emphasis is **traceability and accountability**: what is on hand, where,
for whom, in which lot/serial — and a complete, reconciling history of everything that happened to it. No
report creates data; all read the entities maintained by Sections 02–05, with the append-only transaction
log (`DB.txns[]`, written by `logTxn()`) as the audit/ledger backbone.

## In Scope (v1) — the 10 reports
All use the shared **report pattern**: KPI tiles → filter grid → dense grouped funnel table → toolbar
(Excel / Excel+ / **Print**) with a global `@media print` block. File naming `erp-rpt-<screen>.html`.

| # | Report (`file`) | Purpose | Reads |
|---|-----------------|---------|-------|
| 1 | **Stock on Hand** `erp-rpt-soh.html` | Current inventory by client / site / area / product, available vs blocked vs expired, qty rollups | derived LPNs (`onHandLpns`, `isBlocked`, `isExpired`, `lpnAvail`) |
| 2 | **Transaction History / Stock Ledger** `erp-rpt-txns.html` | Every mutation — the audit/reconciliation backbone | `DB.txns[]` |
| 3 | **Expiry & Aging** `erp-rpt-expiry.html` | Expiring 30/60/90d, already-expired, slow/dead stock by age (expiry-centric WMS) | LPNs (`isExpired`, expiry) + first `receive` txn for age |
| 4 | **Inbound / Receipts** `erp-rpt-inbound.html` | Received vs ASN-expected, over/short, fill %, by client & period | ASN (`asnTotals`/`asnStatus`) |
| 5 | **Outbound / Shipments** `erp-rpt-outbound.html` | Shipped vs ordered, short / back-orders, by client & period | Outbound (`outTotals`, `lineShipped`, `clientAllowsBackorder`) |
| 6 | **Adjustments & Variances** `erp-rpt-variance.html` | Shrinkage / accuracy KPI — qty adjustments + count / physical variances by reason | `adjustments` + `counts` + `physicals` |
| 7 | **Bin / Location Utilization** `erp-rpt-utilization.html` | Slotting health + space accountability — occupancy vs capacity per bin / area | LPNs + `binLoad` vs bin capacity |
| 8 | **Lot / Serial Traceability** `erp-rpt-trace.html` | Trace one lot/serial across receive→putaway→move→pick→dispatch→return (recall) | `DB.txns[]` + LPNs keyed by lot/serial |
| 9 | **Stock Card / Product Ledger** `erp-rpt-stockcard.html` | Per-product (or per-lot) chronological ledger with a running on-hand balance | `DB.txns[]` + live on-hand |
| 10 | **Client Stock Statement** `erp-rpt-statement.html` | 3PL accountability — per client: opening → receipts → issues → adjustments → closing over a period | `DB.txns[]` per client |

Plus the **Operations dashboard** (`erp-dashboard.html`) as the landing view: open tasks (to-putaway, to-pick),
today's inbound/outbound, on-hand, items on hold/quarantine. *(Mock dashboard tiles are currently static —
wiring them to live `DB` rollups is a remaining build item, see below.)*

## Out of Scope (v2 backlog)
- **Billing / activity-based charges** (storage occupancy over time, handling-unit counts, value-added job counts) — billing is out of v1.
- **Low-stock / reorder alerts**, **scheduled / emailed reports**, **labor & carrier productivity / SLA dashboards**.
*(Stock aging & expiry, and location occupancy / utilization — originally listed here as v2 — were pulled into v1 and built as reports 3 and 7.)*

## Business Rules
- Every report is filterable by **client + site + date range** (where applicable); lot / expiry / serial detail shown where relevant.
- Numbers must **reconcile with the transaction history** (single source of truth). Ledger-style reports (2, 8, 9, 10) anchor their balances to live on-hand and derive opening so they reconcile. *(Note: the seed `DB.txns[]` is intentionally minimal; most history materialises at runtime as Section-05 actions append rows.)*
- **Multi-tenant confidentiality [coding phase]:** reports must be **hard-scoped to the user's permitted clients**, not merely client-filterable. The mock shows all clients; production enforces `User.clients` scope on every query.

## Remaining build items (flagged, not yet done)
- **Export** — Excel / CSV is **stubbed** across all reports (only browser **Print** → PDF works). The spec lists Excel/CSV export in scope; wire it in the build.
- **Operations dashboard** — currently static tiles; wire to live `DB` rollups so it reconciles with the reports.
- **Per-client scope enforcement** on report queries (above).

## Dependencies
Reads from all of Sections 02–05. No downstream dependency.

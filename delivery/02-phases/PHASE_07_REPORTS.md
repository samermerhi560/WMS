# Phase 7 — Reports & Visibility

> Read-only over the stock read model (Phase 4) + the `WmsTxn` ledger (CC-03). Each report is an independent card —
> start each as soon as its source data exists. ERP only (no PWA).
> Functional spec: `../../docs/06_Reports.md`. Mock: `erp-rpt-*.html`.

## Objective
Deliver client- and operations-facing reports: stock on hand, transactions, expiry, inbound/outbound, variance, utilization, traceability, stock card, and client statement — all client+site scoped, exportable.

## Consumes (cross-cutting)
CC-03 audit ledger (the data source for most), CC-08 scoping (every report defaults to in-scope).

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P07-S01 | **Stock on Hand** (by client/site/product/lot/area/status) | M |
| P07-S02 | **Transaction History** (ledger query, all `type`s, filters) | M |
| P07-S03 | **Expiry / shelf-life** (FEFO horizon, near-expiry warnings vs WMS_TODAY) | S–M |
| P07-S04 | **Inbound** & **Outbound** activity | M |
| P07-S05 | **Variance** (count/physical results) & **Utilization** (bin/area capacity) | M |
| P07-S06 | **Traceability** (genealogy across receive→…→dispatch) & **Stock Card** (per product/lot ledger) | L |
| P07-S07 | **Client Statement** (per-client activity summary) | M |

## Depends on
Phase 4 (stock read model) + the producing phases for the data each report shows. Phase 0 ledger + scoping.

## Key references
`../../docs/06_Reports.md`, `../../docs/DATA_MODEL.md` (txn ledger), `PERFORMANCE_RULES.md` (these are the heavy queries).

## Open questions
**Export (CSV/Excel)** is stubbed in the mock (Print only) → it's a **Phase-8** deliverable; decide whether each report ships print-only first then gains export in P8, or export inline here.

## Estimation note
Mostly query + Kendo grid/print — moderate, parallel. Trace + Stock Card are the L cards (genealogy walk across the ledger). Performance is the main risk (large ledger) — lean on indexes + capped ranges.

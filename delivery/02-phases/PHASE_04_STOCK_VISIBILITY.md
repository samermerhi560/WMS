# Phase 4 — Stock Visibility & Status

> The read model + the manual status-change engine. **Stock-Out and Reports both depend on this** — build it before them.
> Functional spec: `../../docs/05_Inventory_Operations.md` (Stock Status), `../../docs/06_Reports.md`. Mock: `erp-inv-status.html`, PWA lookups.

## Objective
Expose stock-on-hand (derived from `available` LPNs by product/lot/location), the per-LPN detail with **blocked/frozen/expiry status surfaced**, and the reason-coded + approval-aware **status-change** engine.

## Consumes (cross-cutting)
CC-03 audit, CC-05 tracking flags, CC-07 reason+approval, CC-08 scoping. Surfaces CC-01 (frozen) and blocked statuses in queries.

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P04-S01 | **Stock query/SoH API** — derived on-hand, filters (client/site/product/lot/area/status), reservation-aware free qty; the shared read model for Stock-Out + Reports + PWA lookups | L |
| P04-S02 | **Stock Status screen** + **status-change** (reason-coded, skip system-set states, release→available confirm, warn when blocking a reserved plate) | M |
| P04-S03 | Expose **blocked / frozen / expiry / in-transit** flags consistently in every stock payload (the cross-process requirement so later screens already respect them) | S |

## Depends on
Phase 0 (audit, scoping, freeze read, reasons), Phase 1 (products/locations), Phases 2–3 (stock exists to show).

## Key references
`../../docs/DATA_MODEL.md` (LPN status enum, derived SoH note), `../../docs/BLOCKING_RULES.md` (status-change row), `../../docs/06_Reports.md`.

## Open questions
Whether to materialize SoH (DATA_MODEL gap #1) — default: derived for v1. Reservation visibility detail (partial-LPN reservations — DATA_MODEL gap #4).

## Estimation note
S04-S01 is the load-bearing read model — get its query shape + indexes right (it's the hot path for allocation and reports). The flag-exposure card (S03) is small but **cross-cutting**: it's why later screens "already respect blocked stock" without rework.

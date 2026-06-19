# Phase 5 — Stock-Out (Outbound)

> The most complex process: orders → allocation (FEFO/FIFO) → pick/dispatch → delivery notes, with back-order/
> short-close, two fulfilment paths, ad-hoc dispatch, and RTV. Dual-channel.
> Functional spec: `../../docs/04_Stock_Out.md`. Mock: `erp-so-*.html`, `pwa-so-*.html`.

## Objective
Fulfil outbound requests: allocate the right lots/serials (FEFO), pick by scan, confirm dispatch (issue stock), and produce delivery notes — honouring per-client back-order policy, ship-to consignee, serial-on-issue, and role-gated express/ad-hoc paths.

## Consumes (cross-cutting)
CC-01 freeze-exclude, CC-03 audit, CC-04 conservation, CC-06 FEFO/FIFO + reservation, CC-07 reason, CC-08 scoping, CC-09 assignment, CC-10 role-gating (Express, Ad-hoc).

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P05-S01 | **Outbound orders** (CRUD, lines, **ship-to consignee**, `fullStockOut`, cancel order / cancel line, status flow) | M–L |
| P05-S02 | **Allocation** engine surface (FEFO if expiry else FIFO, reservation-aware, short-pick, manual override) | L |
| P05-S03 | **Pick / Dispatch** (classic) — scan-confirm pick, serials-on-issue, short-pick, **carrier + proof-of-load**, issue stock, **Delivery Note** | L |
| P05-S04 | **Express Fulfil** (one-pass allocate→pick→dispatch) — **role-gated** | L |
| P05-S05 | **Back-order vs short-close** remainder handling + multi-shipment delivery notes (immutable `shipments[]`) | M |
| P05-S06 | **Ad-hoc / emergency dispatch** (inline order, governance gate, role-gated, post-hoc approval) + **ERP approval-queue surfacing** of the `approval:'pending'` flag (mock carry-over) | L |
| P05-S07 | **Return-to-vendor / client (RTV)** — non-consignee outbound, scan-confirm & ship | M |
| P05-S08 | PWA pick/dispatch + ad-hoc + RTV parity | L |

## Depends on
Phase 0 (allocation, freeze, audit, conservation, reasons, scoping, roles), Phase 1 (consignees, carriers, clients incl. `allowBackorder`), Phase 4 (stock read model). Stock from Phases 2–3.

## Key references
`../../docs/04_Stock_Out.md` (the long build notes — two paths, remainder policy, consignee/carrier, de-allocation/cancel, ad-hoc), `../../docs/BLOCKING_RULES.md` (allocation row), `../../EDGE_CASE_TRACKER.md` (dispatch re-validation, damage-at-pick, serial count/dup).

## Open questions
Partial-LPN reservation persistence (DATA_MODEL gap #4); delivery-note immutability (snapshot vs re-derive); the full WMS role/right matrix for Express/Ad-hoc/Self-claim.

## Estimation note
Several L cards; allocation (CC-06) is the riskiest engine — its interface was started in Phase 0 but matures here. Dual-channel doubles the pick/dispatch UI. Back-order/short-close + multi-shipment is fiddly state. This phase likely the largest single estimate.

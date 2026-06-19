# Phase 6 — Inventory Operations

> The in-warehouse stock operations, including the **Freeze (Physical Inventory) workflow** — which, thanks to the
> Phase-0 `IFreezeService`, adds **zero rework** to earlier phases. Highly parallelizable (each sub-phase ~independent).
> Functional spec: `../../docs/05_Inventory_Operations.md`. Mock: `erp-inv-*.html`, `pwa-inv-*.html`.

## Objective
Move, transfer, count, freeze-count-reconcile, adjust/correct, repack, return, and dispose stock — all reason-coded, approval-gated where required, conserving quantity and writing the ledger.

## Consumes (cross-cutting)
CC-01 freeze, CC-02 capacity+segregation, CC-03 audit, CC-04 conservation, CC-07 reason+approval+maker-checker, CC-08 scoping, CC-09 assignment.

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P06-S01 | **Move** (intra-site relocation, partial split, freeze/capacity/segregation guards) | M–L |
| P06-S02 | **Transfer** (inter-site ship → in-transit → receive; freeze-source guard; receive capacity/segregation) | L |
| P06-S03 | **Cycle Count** (multi-location sheet → `pending-approval` → approve corrects stock; found/missing) | L |
| P06-S04 | **Physical Inventory** — **the Freeze workflow** (freeze→count→post→unfreeze; no overlapping takes; cross-screen block already honoured by other phases) | L |
| P06-S05 | **Adjustments (qty)** + **Corrections (attributes)** — approval-gated, reason-coded, frozen-scope refusal | M |
| P06-S06 | **Repack / split / merge / re-kit** (consume sources, mint outputs, genealogy, balance guard; add the frozen-source check the mock ERP omitted — carry-over) | L |
| P06-S07 | **Returns / put-back** (dispositions: restock-direct / via-putaway / quarantine/damaged) | M |
| P06-S08 | **Disposal / Scrap** (approval-gated, terminal `disposed`, maker-checker) | M |

## Depends on
Phase 0 (all guard services + approval framework), Phase 1, Phase 4 (stock read model). Stock from 2–3.

## Key references
`../../docs/05_Inventory_Operations.md`, `../../docs/BLOCKING_RULES.md` (move/transfer/count/physical/repack/returns rows), `../../EDGE_CASE_TRACKER.md` (freeze-on-adjust/repack, in-transit loss, disposal, RTV-adjacent).

## Open questions
Serial-level counts for serial-tracked products (DATA_MODEL count gap). RMA credit/billing explicitly out of scope (physical re-entry only).

## Estimation note
This is where the **freeze payoff** is realized: Physical Inventory (S04) only *sets* the freeze state others already respect. Each sub-phase is largely standalone → assign in parallel after Phase 0. Repack/Count/Transfer/Physical are the L cards (conservation + multi-step + approval).

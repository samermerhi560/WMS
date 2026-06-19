# Phase 2 — Goods Reception (Inbound)

> First stock-creating process: ASN → receive → inspect → GRN, minting LPNs. Dual-channel.
> Functional spec: `../../docs/02_Goods_Reception.md`. Mock: `erp-gr-*.html`, `pwa-gr-*.html`.

## Objective
Receive goods against an ASN or blind, mint LPNs (with split + mixed-pallet models), inspect with partial accept/reject + dispositions, and produce GRNs and labels — all with full traceability and the unhappy paths.

## Consumes (cross-cutting)
CC-03 audit, CC-04 conservation+genealogy, CC-05 tracking flags, CC-07 reason codes (inspect/refuse/receipt), CC-08 scoping, CC-09 assignment.

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P02-S01 | ASN management (CRUD, lines, derived `open/partial/closed` status, blind vs open) | M |
| P02-S02 | **Receive against ASN + blind** → mint LPNs, **LPN split** (per-each / per-pack), close-short, wrong-client guard | L |
| P02-S03 | **Mixed-pallet build** (aggregate LPN, post-hoc add lines, manifest label) + decomposition hand-off to Putaway | L |
| P02-S04 | **Inspect** — partial accept/reject (`inspectionSplit`), dispositions quarantine/hold/damaged, reason codes | L |
| P02-S05 | **GRN** (document/print, per-receipt) | M |
| P02-S06 | **Labels / reprint** (LPN + pallet, recovery by ASN/recent) — audit every reprint | M |
| P02-S07 | Edge cases: **refuse delivery at door** (no stock, ASN→refused), over-receipt approval, duplicate-receipt guard, damaged/short receive + write-off, expired-stock-blocked-at-receipt, temp-excursion/seal-broken reasons, cold-chain carrier warning | L |

## Depends on
Phase 0 (audit, conservation, tracking, reasons, scoping), Phase 1 (clients, products, packaging, suppliers, locations/staging).

## Key references
`../../docs/02_Goods_Reception.md`, `../../docs/BLOCKING_RULES.md`, `../../EDGE_CASE_TRACKER.md` (refuse/over/duplicate/damaged/expired rows), `../../docs/DATA_MODEL.md` (ASN, LPN, Pallet, GRN, Refusal).

## Open questions
Label printer integration (hardware/format) — mock prints Code-128 client-side; production needs a print service. Mixed-pallet line-reject was deferred in the mock.

## Estimation note
Receive + Inspect + Mixed-pallet are the L cards (split/genealogy/conservation + dual-channel). Edge-case card bundles many EDGE_CASE rows — could split per-risk if estimating granularly.

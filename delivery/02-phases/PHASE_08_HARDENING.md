# Phase 8 — Hardening & Cross-Cutting Closure

> Closes the **known limitations carried into the coding phase** (`../../mockups/MOCKUP_STATUS.md`) and the
> non-functional requirements. Runs partly in parallel with late feature work, finishes last.

## Objective
Make the WMS production-grade: complete the audit/scoping guarantees, export, performance at scale, security review, live dashboards, and (if in scope) PWA offline sync.

## Planned sub-phase cards
| Card | Scope | Tier |
|---|---|---|
| P08-S01 | **Export (CSV/Excel)** across all reports (mock = Print only) | M |
| P08-S02 | **Performance pass** — index review, query tuning, large-dataset load tests against SQL 2014, grid paging audits | M–L |
| P08-S03 | **Security review** — server-side scoping (CC-08) on every endpoint, full role/right matrix verification (CC-10), authz negative tests, transport/secret review | L |
| P08-S04 | **Audit completeness** — `WmsTxn` strictly immutable + before/after snapshots (DATA_MODEL gap #6), reprint/override auditing (mock carry-over) | M |
| P08-S05 | **Operations dashboard** — wire the static mock tiles to live `DB`/ledger rollups | M |
| P08-S06 | **PWA offline sync** (if decision #5 = yes) — IndexedDB queue, sync-on-reconnect, conflict resolution | XL (conditional) |
| P08-S07 | **Carry-over alignment sweep** — `erp-pa-tasks`→shared capacity service; classic pick/ERP dispatch `logTxn('dispatch')` parity; ad-hoc approval surfacing; reprint audit (all flagged in MOCKUP_STATUS) | M |

## Depends on
All producing phases (it hardens what they built). Some cards (perf, security) can start mid-project as a continuous track.

## Key references
`../../mockups/MOCKUP_STATUS.md` → *Known limitations carried into the coding phase*; `../../docs/DATA_MODEL.md` → *Production gaps to design later*; `../01-orchestrator/CROSS_CUTTING_CONCERNS.md`.

## Open questions
Decision #5 (offline) gates S06 — the single biggest swing in this phase. Per-client scope enforcement depth (reports/lists default-all in the mock → must enforce `User.clients` server-side).

## Estimation note
Mostly contained except **S06 (offline sync)** which, if required, is an XL workstream of its own — estimate and decide it explicitly. Treat S02/S03 as a continuous track, not a big-bang at the end.

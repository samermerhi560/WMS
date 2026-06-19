# Phase Dependency Matrix

> What blocks what, and what can run in parallel. The unit of truth for **sequencing and staffing**.
> Phase-level here; card-level dependencies live in each build card's `Depends on` / `Consumes`.

---

## 1. Phase dependency graph

```
                 ┌─────────────────────────────────────────────┐
                 │  Phase 0 — Foundation / Kernel               │
                 │  (skeleton, DB, scoping, + CC services)      │
                 └───────────────┬─────────────────────────────┘
                                 │  interfaces frozen
                 ┌───────────────▼─────────────────────────────┐
                 │  Phase 1 — Master Data                       │
                 └───────────────┬─────────────────────────────┘
            ┌────────────────────┼───────────────────────────────┐
            ▼                    ▼                                 ▼
   Phase 2 Receiving ──► Phase 3 Putaway ──► Phase 4 Stock Visibility
                                                      │
                                       ┌──────────────┴──────────────┐
                                       ▼                             ▼
                              Phase 5 Stock-Out            Phase 6 Inventory Ops
                                       └──────────────┬──────────────┘
                                                      ▼
                                            Phase 7 Reports
                                                      ▼
                                            Phase 8 Hardening
```

## 2. Hard dependencies (Phase X cannot start until …)

| Phase | Requires (Done) | Cross-cutting services it needs available (CC-IDs) |
|---|---|---|
| 0 Foundation | host access, decisions #1–#5 resolved | builds CC-01…CC-12 |
| 1 Master Data | 0 (skeleton, scoping, CRUD base) | CC-05, CC-07, CC-08 |
| 2 Receiving | 0, 1 | CC-03, CC-04, CC-05, CC-08, CC-09 |
| 3 Putaway | 0, 1, 2 | CC-01, CC-02, CC-03, CC-04, CC-08, CC-09 |
| 4 Stock Visibility | 0, 1, 2, 3 | CC-03, CC-05, CC-08 |
| 5 Stock-Out | 0, 1, 4 (+ stock from 2/3) | CC-01, CC-03, CC-04, CC-06, CC-07, CC-08, CC-09, CC-10 |
| 6 Inventory Ops | 0, 1, 4 | CC-01, CC-02, CC-03, CC-04, CC-07, CC-08, CC-09 |
| 7 Reports | all producing phases | CC-03, CC-08 |
| 8 Hardening | all | all |

## 3. The critical gate

> **No process phase (2–6) may start until the cross-cutting services it `Consumes` are merged and their interfaces frozen.** This is the entire defence against rework. The matrix above is the checklist.

Practically: Phase 0 must deliver, early and stable, the **interfaces** for `IFreezeService`, `ICapacityService`, `IStockLedgerService`, `IAllocationService`, `ITenantScopeService`, `IReasonService` + the `assignee` facet. Implementations can follow, but **the contracts must be frozen** so process teams code against them in parallel.

## 4. What can run in parallel (once 0 + 1 interfaces are frozen)

| Parallel track | Phases/cards | Note |
|---|---|---|
| **Inbound track** | 2 Receiving → 3 Putaway | sequential within; one team |
| **Outbound track** | 5 Stock-Out | needs Stock Visibility (4) read model; can design against it while 2/3 build stock |
| **Inv-Ops track** | 6 (move, count, repack, returns, transfer, physical, adjust, disposal) | each sub-phase is largely independent once CC services exist — high parallelism |
| **Reports track** | 7 | read-only; can start per-report as soon as its source data exists |
| **PWA scanner shell** | greenfield foundation | can be set up in parallel with Phase 0 (workspace, service worker, scan engine) |

**Contended upstreams to staff first:** Phase 0 (the kernel) and Phase 1 Master Data (every screen references it). Freeze their DTO/interface contracts before fanning out.

## 5. Per-card matrix (to be filled during decomposition)

When sub-phase cards are written, append a card-level table here:

| Card | Depends on | Consumes | Blocks | Parallel-safe with |
|---|---|---|---|---|
| P00-S01 … | | | | |
| … | | | | |

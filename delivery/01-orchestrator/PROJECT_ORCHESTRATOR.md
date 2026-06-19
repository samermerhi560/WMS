# WMS Delivery — Project Orchestrator

> **This is the entry point for the cost-estimation and development-execution phases (Phase 3).**
> Read this first. It maps every document, defines the reading order, and holds the live status board.
> It does **not** restate business rules — those live in `../../docs/` (the functional source of truth).

---

## 1. The two-layer model (read this once, then never confuse them)

| Layer | Where | Owns | Status |
|---|---|---|---|
| **Functional layer** ("what / why") | `../../docs/` + `../../mockups/` | Business rules, vocabulary, data model, the agreed UX | **Locked.** Treat as source of truth. Don't duplicate it. |
| **Execution layer** ("how / how much / in what order") | `../` (this `delivery/` tree) | Common rules, phase & sub-phase build cards, dependency matrix, estimation, governance | **Being built now.** |
| **Cross-cutting kernel** | `02-phases/PHASE_00_FOUNDATION.md` + `01-orchestrator/CROSS_CUTTING_CONCERNS.md` | The shared services every process consumes (freeze, capacity, audit, scoping, allocation, …) | Built **once** in Phase 0; interfaces frozen before any consumer phase starts. |

**The golden anti-duplication rule:** an execution document **links** to the functional rule by anchor; it never copies it. It adds only *execution* detail (files, endpoints, steps, acceptance, estimate). The only business text allowed in an execution doc is a **pinned decision** that resolves a gap or ambiguity the functional spec left open.

---

## 2. The integration reality (this is a brownfield build)

The WMS is **not** greenfield. It is a new **module** inside an existing system:

- **Backend:** a new `WMS` module added to the existing ASP.NET Core **3.1** modular monolith at `D:\CODE\TLC\sds-erp-back` (behind the Ocelot gateway). It **reuses** the host's identity/roles, data-access, response-envelope and grid conventions.
- **Frontend (ERP):** a new lazy-loaded project `projects/wms` added to the existing Angular **14** workspace at `D:\CODE\TLC\sds-erp-front`, reusing NgRx, the Swagger-generated client pipeline, the auth guards and the Nebular/Kendo UI kit.
- **Frontend (PWA):** a **new** Angular PWA scanner (`projects/wms-scanner`) — greenfield within the workspace, sharing models + the generated API client.
- **Database:** **SQL Server 2014** — a hard constraint that shapes the schema (see `00-common-rules/COMMON_DATABASE_RULES.md`).

➡ **The host conventions are documented in [`HOST_INTEGRATION_MAP.md`](HOST_INTEGRATION_MAP.md).** Every backend/frontend rule file references it. This is what prevents "search the host repo blindly."

---

## 3. Document map

```
delivery/
  00-common-rules/      ← rules that apply to ALL phases & developers
  01-orchestrator/      ← you are here: index, registry, matrix, template, estimation, governance
  02-phases/            ← one file per delivery phase + the sub-phase build cards
```

| Document | Purpose |
|---|---|
| `01-orchestrator/PROJECT_ORCHESTRATOR.md` | **This file** — index, reading order, status board. |
| `01-orchestrator/HOST_INTEGRATION_MAP.md` | Concrete host conventions (backend + frontend) with exact paths/classes. |
| `01-orchestrator/PROCESS_MAP.md` | The end-to-end flow across all processes (one picture). |
| `01-orchestrator/CROSS_CUTTING_CONCERNS.md` | **The registry** — every invariant that spans processes + which Phase-0 service owns it. The freeze-stock safety mechanism. |
| `01-orchestrator/PHASE_DEPENDENCY_MATRIX.md` | Which phase/slice blocks which; what can run in parallel. |
| `01-orchestrator/SUBPHASE_TEMPLATE.md` | The build-card template to clone for every sub-phase + a worked example. |
| `01-orchestrator/ESTIMATION_GUIDE.md` | Complexity tiers, effort dimensions, roll-up method, cost-model shape. |
| `01-orchestrator/DEVELOPMENT_EXECUTION_GUIDE.md` | Definition of Ready/Done, the vertical-slice workflow, ownership, parallelization. |
| `01-orchestrator/ADR/` | Architecture Decision Records (one per locked-anchor change). |
| `00-common-rules/*` | The 15 common-rule files — see `00-common-rules/README.md`. |
| `02-phases/PHASE_0N_*.md` | Per-phase objective, sub-phase list, consumed cross-cutting concerns, dependencies. |
| `02-phases/sub-phases/P0X-SYY_*.md` | The build cards — the unit of assignment, estimation, and "done". |

---

## 4. Reading order

- **New developer joining a slice:** `00-common-rules/README.md` → the relevant `PHASE_0N` file → your `P0X-SYY` card → the functional spec section the card links to.
- **Estimator:** `ESTIMATION_GUIDE.md` → every `P0X-SYY` card's *Estimation* block → `COST_MODEL`.
- **Architect / lead:** this file → `HOST_INTEGRATION_MAP.md` → `CROSS_CUTTING_CONCERNS.md` → `PHASE_DEPENDENCY_MATRIX.md`.
- **Anyone, for the "why":** always the functional layer (`../../docs/`), never an execution doc.

---

## 5. Delivery sequence & status board

> **Live status + restart prompt → [`../DELIVERY_STATUS.md`](../DELIVERY_STATUS.md)** — the rolling status file for Phase 3 (post-mockup specs delivery), successor to `../../mockups/MOCKUP_STATUS.md`.
>
> **Locked delivery sequence:** (1) **Client documentation** (Word `.docx` + print screens) → (2) **Technical documentation + Man/Days cost estimation** (simple, by page/functionality) → (3) **Finalize the build cards** (decompose Phase 0 + 1 → `COST_MODEL.xlsx` calibrated vs `BUILD_LOG.md` → fan out the rest in dependency order).
>
> **Framework status (2026-06-19):** all phase files written with planned-card lists; 1 reference card (`P03-S01`); full sub-phase decomposition is step 3 of the sequence above.

Legend: ⬜ not started · 🟦 cards drafted · 🟨 in build · ✅ done

| Phase | File | Cards drafted? | Build status |
|---|---|---|---|
| 0 — Foundation / Kernel | `PHASE_00_FOUNDATION.md` | ⬜ | ⬜ |
| 1 — Master Data | `PHASE_01_MASTER_DATA.md` | ⬜ | ⬜ |
| 2 — Goods Reception | `PHASE_02_RECEIVING.md` | ⬜ | ⬜ |
| 3 — Putaway | `PHASE_03_PUTAWAY.md` | ⬜ | ⬜ |
| 4 — Stock Visibility | `PHASE_04_STOCK_VISIBILITY.md` | ⬜ | ⬜ |
| 5 — Stock-Out | `PHASE_05_STOCK_OUT.md` | ⬜ | ⬜ |
| 6 — Inventory Ops | `PHASE_06_INVENTORY_OPS.md` | ⬜ | ⬜ |
| 7 — Reports | `PHASE_07_REPORTS.md` | ⬜ | ⬜ |
| 8 — Hardening | `PHASE_08_HARDENING.md` | ⬜ | ⬜ |

---

## 6. Open decisions blocking full scaffolding

These came out of the host recon and must be confirmed before the dependent docs can be finalized. Tracked in detail in `HOST_INTEGRATION_MAP.md` §"Integration decisions".

1. **Schema authoring:** EF Core migrations for the WMS module **vs** DBA-owned SQL scripts reverse-engineered (the host appears DB-first).
2. **Tenant/site scoping:** add `SiteId`/`ClientId` scope to the host `User`/`UserClaim` **vs** a WMS-side user-scope table. (Touches the shared Auth module — sensitive.)
3. **.NET 3.1:** stay on 3.1 (host parity, but EOL) **vs** target a supported runtime for the WMS module.
4. **PWA placement:** `projects/wms-scanner` in the host workspace **vs** a separate repo.
5. **PWA offline:** is offline-capable scanning a hard v1 requirement (drives a large sync/IndexedDB effort) **vs** online-only v1.

---

*Functional source of truth: `../../docs/`. Live mock state: `../../mockups/MOCKUP_STATUS.md`. This execution layer references them — it never overrides them.*

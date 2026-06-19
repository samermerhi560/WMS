# Estimation Guide

> How to turn build cards into a defensible cost figure. **Bottom-up** (sum of cards) + a **reference class**
> (the mock build) + a **risk buffer** keyed to each card's unknowns. Produces `COST_MODEL` (one row per card).

---

## 1. Effort dimensions (estimate each card on these)

| Dimension | What it covers (this stack) |
|---|---|
| **BE** | Domain + service logic, controllers, validation, transactions, Phase-0 service calls (C#/.NET 3.1) |
| **DB** | SQL 2014 DDL, EF entities/config, migration, indexes, seed/fixtures |
| **FE-ERP** | Angular `projects/wms` screen(s): NgRx (actions/effects/reducers/selectors) + Nebular/Kendo components + Reactive Forms |
| **FE-PWA** | `projects/wms-scanner` screen(s): scan flow + offline considerations |
| **Integration** | Swagger publish → client regen, gateway route, DI wiring, auth/roles, host plumbing |
| **Test** | Unit (services/guards), integration (endpoints), e2e (critical flows), fixtures |
| **Mgmt/overhead** | Review, PM, ceremonies, fixes — applied as a % at roll-up, not per card |

> Keep **FE-ERP and FE-PWA separate** — dual-channel doubles the UI surface; estimating them as one hides ~40% of front-end cost.

## 2. Complexity tiers (starter ranges — calibrate to team velocity)

> ⚠ **Placeholder ranges in person-days.** Replace with your team's real velocity after the first 2–3 cards. The structure matters more than the seed numbers.

| Tier | Profile | BE | DB | FE-ERP | FE-PWA | Test | Example |
|---|---|---|---|---|---|---|---|
| **S** | CRUD master, generic base service | 1–2 | 0.5 | 1–2 | n/a | 0.5–1 | Carriers/Suppliers master |
| **M** | CRUD + non-trivial rules / one guard | 2–4 | 1 | 2–3 | 1–2 | 1–2 | Products (tracking flags), ASN |
| **L** | Multi-step flow, 3+ cross-cutting calls, dual-channel | 4–6 | 1–2 | 3–4 | 3–4 | 2–3 | Putaway, Receive, Move |
| **XL** | Engine / orchestration, heavy edge cases | 6–12 | 2–3 | 5–8 | 4–6 | 3–5 | Allocation (FEFO), Express Fulfil, Physical Inventory |

## 3. Stack accelerators (drive estimates **down** — apply honestly)

- **Generic `ConcreteBaseService`/`IGenericBaseRepository`** → CRUD masters are near-boilerplate (Phase 1 mostly tier S/M).
- **Swagger-generated Angular client** → the FE API/service layer is *generated*, not hand-written (Integration cost, once per slice, not per call).
- **Nebular + Kendo + Material present** → **no design-system build**; grids/forms/dialogs are off-the-shelf.
- **Mock helpers = service signatures** → domain API is pre-designed (`fefoAllocate`, `binCapacityForAdd`, …): less analysis, fewer unknowns.
- **`data.js` = DDL + fixtures**, **`BLOCKING_RULES.md` = test suite**, **`EDGE_CASE_TRACKER.md` = negative tests** → test design is largely pre-written.

## 4. Stack cost-drivers (drive estimates **up** — don't forget)

- **NgRx per screen** (actions/reducers/effects/selectors) — real FE-ERP overhead vs a simple service.
- **Dual-channel** — every operation ships on ERP **and** PWA.
- **SQL 2014** — the mock's nested arrays (`alloc[]`, `serials[]`, `levels[]`, `lines[]`) become **child tables**; no JSON columns, no temporal tables (audit is hand-rolled).
- **Touching the shared Auth module** for tenant/site scoping (CC-08) — coordination + regression risk.
- **PWA offline sync** (if decision #5 = yes) — IndexedDB queue + conflict resolution is its own XL workstream.
- **.NET Core 3.1 / Angular 14** constraints — older tooling, EOL runtime risk.

## 5. Reference class — calibrate against the mock

`../../docs/BUILD_LOG.md` records what each mock screen/feature took to build. Use it as an analog:
- Rank each mock screen S/M/L/XL; note its build effort.
- The **real build multiplier** over the mock is large (real = persistence + API + auth + tests + 2 channels vs a vanilla-JS click-through). Pick a multiplier per dimension with the team and **document it in COST_MODEL** so the assumption is visible and adjustable.

## 6. Roll-up

```
Phase total      = Σ(card dimensions) for the phase
Kernel (Phase 0) = estimated once; amortized (it's enabling work, not per-feature)
Project subtotal = Σ phase totals + kernel
Risk buffer      = per-card: +15% (known) · +30% (open question) · +50%+ (technical unknown / shared-module change)
Overhead         = +X% mgmt/review/ceremonies (team-specific)
ESTIMATE         = subtotal × (1 + weighted risk) × (1 + overhead)
```
Give a **range** (e.g. P50–P80), not a point. The buffer is **keyed to each card's `Estimation > risks/unknowns`** — so risk is bottom-up and auditable, not a flat fudge.

## 7. COST_MODEL shape (one row per card)

| Card | Phase | Tier | BE | DB | FE-ERP | FE-PWA | Integ | Test | Risk% | Card total | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P01-S01 | 1 | S | 1.5 | 0.5 | 1.5 | – | 0.5 | 0.5 | 15% | … | generic base service |
| … | | | | | | | | | | | |
| **Phase n** | | | Σ | Σ | Σ | Σ | Σ | Σ | | **Σ** | |

> Generate `COST_MODEL.xlsx` from the cards once decomposition is complete (summary sheet + per-phase sheets + assumptions sheet holding the tier ranges and the mock multiplier).

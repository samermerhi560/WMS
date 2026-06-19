# Development Execution Guide

> How the team builds from the cards: readiness gates, the vertical-slice workflow, ownership, and parallelization.
> Keep this short — the cards carry the detail; this is the operating manual.

---

## 1. Definition of Ready (a card may be assigned only when ALL are true)
- [ ] All 9 card sections filled; `Functional spec` links resolve.
- [ ] `Depends on` cards are **Done**.
- [ ] `Consumes` cross-cutting services are **merged with frozen interfaces** (per `PHASE_DEPENDENCY_MATRIX.md`).
- [ ] Acceptance criteria are concrete and testable; edge cases traced to `EDGE_CASE_TRACKER.md` rows.
- [ ] Estimate present; open questions either resolved or explicitly accepted as risk.

## 2. Definition of Done
- [ ] Acceptance criteria pass (functional · FE both channels · BE · data-integrity · security · edge · perf).
- [ ] `BLOCKING_RULES.md` guard tests for the consumed concerns pass.
- [ ] Unit + integration tests green; critical-flow e2e green.
- [ ] Server-side scoping (CC-08) and role-gating (CC-10) verified — **not just UI**.
- [ ] Every stock mutation writes a `logTxn` row (CC-03).
- [ ] Code review approved; no change to a **locked anchor** without an ADR (see `00-common-rules/CHANGE_CONTROL.md`).
- [ ] Swagger published; Angular client regenerated; both ERP and PWA surfaces updated.

## 3. The vertical-slice workflow (one card, in order)

```
1. DB     DDL + EF entity + migration (SQL 2014 child-table modeling)
2. BE     DTOs → AutoMapper profile → repo → service (calls Phase-0 CC services) → controller
3. INTEG  publish WMS Swagger  →  regenerate Angular client (projects/commons)  →  DI + gateway route
4. FE-ERP NgRx (actions/effects/reducers/selectors) → Nebular/Kendo screen → forms → permission gating
5. FE-PWA scanner screen against the same generated client (+ offline if in scope)
6. TEST   unit (services/guards) → integration (endpoints) → e2e (critical flow) → acceptance
```

**Backend leads each slice** (it owns the contract). The moment Swagger is published, FE-ERP and FE-PWA can proceed in parallel against the generated client.

## 4. Ownership & parallelization
- **One owner per card.** A vertical slice may split into BE / FE-ERP / FE-PWA sub-owners once the API contract is frozen.
- **Staff the contended upstreams first:** Phase 0 (kernel) and Phase 1 (master data). Freeze their interfaces before fan-out.
- **Then parallelize by track** (see `PHASE_DEPENDENCY_MATRIX.md` §4): Inbound, Outbound, Inv-Ops, Reports, PWA-shell.
- **Avoid two cards editing the same locked anchor concurrently** (the shared CC services, the WMS DbContext config, the gateway route file, `app-routing.module.ts`). Sequence anchor edits; everything else runs free.

## 5. Branching, commits, PRs
- **Follow the host repo's existing git conventions** (`D:\CODE\TLC\...`) — branch naming, PR template, reviewers. *(Confirm and record them here once known — flagged open.)*
- One card → one branch → one PR where feasible; reference the card id (`P0X-SYY`) in the branch and PR title.

## 6. Cadence
- Decompose a phase into cards **before** building it; review the cards (cheap) before code (expensive).
- Re-estimate a card if its open questions resolve in a way that changes scope; update `COST_MODEL`.
- Keep `PROJECT_ORCHESTRATOR.md` §5 status board current.

## 7. What developers may NOT change without an ADR
See `00-common-rules/CHANGE_CONTROL.md`. Summary: the **data model**, the **cross-cutting service interfaces**, the **API contracts/Swagger**, and the **design-system usage** are locked anchors. Everything inside a card's own files is the owner's to shape within the common rules.

# Common Application Rules

> The big-picture structure every developer must hold. Detail in the backend/frontend/db rule files.

## What the WMS is (one paragraph)
A new **module** in an existing system: a `WMS` backend module (ASP.NET Core 3.1, behind the Ocelot gateway), a `projects/wms` Angular feature (ERP back-office), and a new `projects/wms-scanner` Angular PWA (warehouse floor). It manages **client-owned stock in a 3PL warehouse** — traceability, location, accountability per client; **never** valuation. Multi-client, multi-site, dual-channel.

## The unit of work = a vertical slice
A feature is delivered as a **slice**: `[DB + BE API] → [ERP screen] → [PWA screen] → [tests]`, built in that order (the backend owns the contract; both UIs consume the generated client). One slice = one or more build cards in `02-phases/sub-phases/`.

## Layered, reuse-first
- Backend: Controller → Service → Repository → DbContext; extend host base classes.
- Frontend: Component → NgRx (action/effect/selector) → generated API client.
- **Cross-cutting concerns are shared services built once** (Phase 0) and consumed everywhere — see `../01-orchestrator/CROSS_CUTTING_CONCERNS.md`.

## Where things live
- Business truth → `../../docs/`. Host conventions → `../01-orchestrator/HOST_INTEGRATION_MAP.md`. How/when/how-much → this `delivery/` tree.
- Code → the host repos (`D:\CODE\TLC\sds-erp-back`, `sds-erp-front`) following their layout.

## Non-negotiables (the invariants)
1. Every stock mutation: validate-at-commit, conserve quantity, carry genealogy, write a `logTxn` row, respect freeze/capacity/segregation, scope by client+site. (`../../docs/BLOCKING_RULES.md`)
2. Tracking-flag-driven lot/expiry/serial everywhere.
3. Dual-channel: every operation works on ERP **and** PWA.
4. Server is authoritative; the UI mirrors, never owns, the rules.

## What's OUT of v1 (don't build)
Client portal, billing/valuation (per `../../docs/00_Project_Overview.md`). Export (CSV/Excel) is a Phase-8 item.

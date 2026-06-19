# Performance Rules

> WMS data grows unbounded (LPNs, txns, allocations). Design for it from card one; don't retrofit.

## Lists & queries
- **Always server-side paging/filter/sort** via Kendo `DataSourceRequest`/`DataSourceResult`. Never return an unbounded collection to the client.
- Project to DTOs in the query (`Select`) — don't load full graphs then map in memory.
- Index every scope + worklist filter (`COMMON_DATABASE_RULES.md`): `(SiteId, Status)`, `WmsLpn(SiteId, Status, ProductId)`, `WmsTxn(Lpn)`, `WmsTxn(Ts)`, FKs.
- Avoid N+1: include/join the child tables (allocations, lines, serials) you'll render.

## Stock-on-hand & reports
- SoH is derived (`available` LPNs grouped) — back it with a tuned query/view; if a report is heavy, paginate or pre-aggregate. Revisit materialization only on evidence (DATA_MODEL gap #1).
- Heavy reports (variance, utilization, trace, stock card) run off the `WmsTxn` ledger — keep it indexed; cap date ranges.

## Budgets (starting targets — tune)
- Grid page (≤50 rows) p95 < 800 ms server. Single-record fetch < 300 ms. Commit (with guards + txn) < 1.5 s.
- SQL 2014 `CommandTimeout(180)` exists for batch ops, but interactive endpoints must be far under it — a 180 s interactive call is a design failure.

## Frontend
- Lazy-load every feature module (bundle budget: host warns at 2 MB, errors at 10 MB). Use `@ngrx/entity` for normalized large lists. `trackBy` on grids. Unsubscribe (takeUntil) to avoid leaks.

## PWA
- Cache only in-scope reference data; keep the offline queue bounded; sync incrementally. Scanning UI must stay responsive on low-end handhelds.

## Concurrency
- High-contention plates: optimistic concurrency (`rowversion`) + re-validate at commit (CC-11) so two pickers can't double-issue.

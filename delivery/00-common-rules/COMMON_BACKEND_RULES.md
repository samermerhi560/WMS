# Common Backend Rules (ASP.NET Core 3.1 — WMS module)

> Host conventions: `../01-orchestrator/HOST_INTEGRATION_MAP.md` §A. **Mirror an existing module** (Finance/EDM/Operation).

## Module layout (mandatory)
```
WMS/WMS.API/                  controllers, Startup, ConfigureDependencies()
WMS-Common/WMS.Entities/      EF entities + WmsDbContext (+ Migrations/)
WMS-Common/WMS.DTO/           {Entity}DTO / CreationDTO / EditorDTO / FilterDTO
WMS-Common/WMS.Services/      service implementations
WMS-Common/WMS.Infrastructure/ IServices/, IRepositories/, repo impls, MappingProfiles/
WMS-Common/WMS.DIContainerCore/ ContainerExtension.Initialize(services)
WMS-Common/WMS.Test/          xUnit
```
- Namespaces and entity `Wms`-prefix per HOST_MAP §A1. **Group entities/DTOs/services by sub-domain folder** (`Receiving/`, `Putaway/`, `Outbound/`, `Inventory/`, `MasterData/`) to keep the 25-entity context navigable.

## Layering (do not skip a layer)
`Controller → Service (interface in WMS.Infrastructure.IServices) → Repository (IGenericBaseRepository<T> / per-entity) → WmsDbContext`.
- **Extend the host base classes:** `IBaseService<TDTO>` / `ConcreteBaseService<TDTO,TEntity,TContext>` and `IGenericBaseRepository<T>` give CRUD for free. Add domain methods on the interface (`AllocateOrder`, `PlacePutaway`, `PostCount`, …).
- **No business logic in controllers.** Controllers: bind → call service → return `OperationResult`/`DataSourceResult`.
- **No EF queries in controllers.** Repositories own data access.

## Cross-cutting services (Phase 0) — call, never reimplement
Services consume the registry interfaces (`../01-orchestrator/CROSS_CUTTING_CONCERNS.md`): `IFreezeService`, `ICapacityService`, `IStockLedgerService`, `IAllocationService`, `IReasonService`, `ITenantScopeService`. A card's `Consumes` list = exactly the services it injects.

## Transactions
- Any **multi-write mutation** (split + place + log; allocate across LPNs; post a count) runs in **one transaction**. Use an EF transaction (`context.Database.BeginTransaction()`) around the service operation; commit only if all guards pass.
- **CC-11:** re-read the LPN/stock **inside** the transaction and re-assert preconditions before writing (state can change between form-open and commit). Approval handlers re-assert `status=='pending'` before posting.
- **CC-04 conservation:** any split/move/transfer/repack asserts `Σ(outputs)+remainder == source` before commit; mint child LPNs, never create/lose units.
- **CC-03 audit:** every committed mutation calls `IStockLedgerService.LogTxn(...)` in the same transaction. No txn row = bug.

## DI registration
All repos (`AddScoped`) + services (`AddTransient`) + `AddDbContext<WmsDbContext>` go in `WMS.DIContainerCore.ContainerExtension.Initialize(services)`, called from `WMS.API.Startup`. No inline registration in Startup. Add the gateway route in `APIGateway/configuration.json`.

## Logging
NLog (`nlog.config`). Log at service boundaries for mutations + errors. **Audit (`logTxn`) is domain data, not a log line** — they are different things (see `LOGGING_AUDIT_RULES.md`).

## Async
Services and controllers are `async Task<...>` (host convention). Use async EF methods.

## .NET 3.1 constraint
Target `netcoreapp3.1` for host parity (decision #3). Avoid C# features > 8.0 and APIs added after 3.1. Log the EOL risk as an ADR.

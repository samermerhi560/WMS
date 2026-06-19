# Common API Rules (WMS module)

> Match the host exactly (`../01-orchestrator/HOST_INTEGRATION_MAP.md` §A4). Consistency with the existing
> ERP modules is mandatory — the Angular client is generated from these contracts.

## Routing & controllers
- `[ApiController]`, `ControllerBase`, `[Route("api/[controller]")]`. Verb attributes per action.
- Reachable through the gateway as `/wms/{controller}/...` (add the downstream route in `APIGateway/configuration.json`).
- One controller per sub-domain aggregate (e.g. `PutawayController`, `OutboundController`, `AsnController`).

## Response envelope (mandatory — not ProblemDetails)
- **Single object / command result:** return `OperationResult { ErrorOccured, Message, Data, ExtraData }` via `OperationResult.of(isSuccess, message, data)`.
- **Grid / list:** accept `[DataSourceRequest] DataSourceRequest`, return `DataSourceResult` (Kendo — server-side filter/sort/page). This is the mock's filter-grid + funnel-table, server-side.
- **Errors:** never return a 500 body ad-hoc — `throw new APICustomException(message, APICustomReturnType.X)`; `ErrorHandlingMiddleware` shapes the response. Pick the right code (`DataNotFound`, `NotAuthorized`, `RequiredField`, `CodeAlreadyExist`, `ForeignKeyConflict`, …). Add WMS-specific codes to the enum if needed (e.g. capacity/segregation/freeze violations) — coordinate as it's a shared enum.

## DTOs
- Naming: `{Entity}DTO` (read), `{Entity}CreationDTO` (POST), `{Entity}EditorDTO` (PUT), `{Entity}FilterDTO` (search). Live in `WMS.DTO`.
- **Command DTOs** for operations that aren't CRUD: `PutawayCommitDTO`, `AllocateRequestDTO`, `DispatchConfirmDTO`, `CountSubmitDTO`, etc. — shaped around the operation, not the entity.
- DTO↔entity via **AutoMapper** profiles in `WMS.Infrastructure.MappingProfiles`, registered in `WMS.API.Config.AutoMapperConfig`. No manual mapping in controllers/services.

## Tracking-flag-driven payloads (CC-05)
Lot/expiry/serial fields are present in DTOs but **meaningful only when the product's flag is on**. The DTO carries the product's `track` flags (or the client resolves via the product) so the UI shows/hides correctly. Server validates serial count == qty only when `track.serial`.

## Idempotency & concurrency
- Commit endpoints re-validate against live stock (CC-11). For approval endpoints, re-assert `pending` before posting.
- Consider an optimistic concurrency token (`rowversion`) on `WmsLpn` for high-contention plates (Phase 0 decision).

## Versioning & Swagger
- The WMS module **publishes Swagger**; the Angular client is **regenerated** from it (don't hand-write FE services). Keep DTO/endpoint changes deliberate — a breaking change ripples to both channels' generated client.
- Document each endpoint (XML comments / `[ProducesResponseType]`) so the generated client + types are accurate.

## Pagination / large lists (CC perf)
Always server-side via `DataSourceRequest`/`DataSourceResult`. Never return an unbounded list (LPNs/txns can be huge). See `PERFORMANCE_RULES.md`.

## Security on every endpoint
- `[Authorize]` by default; `[AllowAnonymous]` only with justification.
- Role-gate sensitive actions with `[Authorize(Roles="WMS_ExpressFulfil")]` etc. (CC-10).
- Every handler asserts **tenant+site scope** (CC-08) before reading/writing — server-side, not just the UI.

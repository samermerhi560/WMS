# Host Integration Map — where the WMS plugs into the existing system

> Distilled from a read-only recon of `D:\CODE\TLC\sds-erp-back` (ASP.NET Core) and
> `D:\CODE\TLC\sds-erp-front` (Angular). **Purpose:** so no developer or AI assistant re-discovers
> the host's conventions. Every backend/frontend rule and every build card references this file.
> **Verify against the live host before coding** — this is a recon snapshot, not a contract.

---

## A. Backend — `sds-erp-back` (ASP.NET Core 3.1, modular monolith + Ocelot gateway)

### A1. Where the WMS module goes
Mirror an existing module (Finance/EDM/Operation). Create at the solution root:
```
WMS/
  WMS.API/                 ← controllers, Startup, the web entry point
WMS-Common/
  WMS.Entities/            ← EF Core entities + WmsDbContext (+ Migrations/ if EF-first)
  WMS.DTO/                 ← {Entity}DTO / {Entity}CreationDTO / {Entity}EditorDTO / {Entity}FilterDTO
  WMS.Services/            ← business-logic implementations
  WMS.Infrastructure/      ← IServices/, IRepositories/, repo implementations, MappingProfiles/
  WMS.DIContainerCore/     ← ContainerExtension.Initialize(services)
  WMS.Test/                ← xUnit
GlobalConfigs/WMS/         ← env-specific config
APIGateway/configuration.json  ← add a /wms/{controller} downstream route
```
Namespaces: `WMS.API.Controllers.*`, `WMS.Entities`, `WMS.DTO.*`, `WMS.Infrastructure.IServices/IRepositories.*`, `WMS.Services.*`. **Entity prefix `Wms`** to avoid clashes (`WmsLpn`, `WmsLocation`, `WmsOutboundOrder`).

### A2. Identity / roles (reuse — do NOT build)
- `D:\CODE\TLC\sds-erp-back\Authentication\AU.*` — custom JWT identity. Entities: `User` (`int Id`, …, `IsAdmin`), `Role` (`int Id`, `Name`, `FamilyId`), `UserRole`, `UserClaim` (`ClaimType`/`ClaimValue`).
- **Enforce on a controller action:** `[Authorize(Roles = "WMS_ExpressFulfil")]` (or a policy for finer logic). Reject in services with `throw new APICustomException("Not authorized", APICustomReturnType.NotAuthorized)`.
- **WMS rights to register as roles/claims** (the mock's flagged "role-gated" carry-overs): `WMS_ExpressFulfil`, `WMS_AdHocDispatch`, `WMS_SelfClaim`, plus the standard `Administrator/Supervisor/Operator` tiers.
- ⚠ **No tenant/site scoping exists on `User` today.** Adding client/site scope is a Phase-0 cross-cutting task (decision #2 below).

### A3. Data access
- **EF Core 3.1.4**, **per-module `DbContext`** (`WmsDbContext`). Fluent config (host uses reverse-engineered entities). `int` PKs. Optional audit fields `AddNewTime?`/`EditTime?` on entities (no global interceptor).
- **Generic repo** `IGenericBaseRepository<T>` + `ConcreteERPGenericRepository<TEntity,TContext>`; per-entity repos extend it. **Service base** `IBaseService<TDTO>` + `ConcreteBaseService<TDTO,TEntity,TContext>` (gives `GetById/GetAll/GetAllFilterDTO/Create/Update/Delete` for free → **CRUD masters are cheap**).
- No formal Unit-of-Work; `SaveChanges` in the service layer. `CommandTimeout(180)`. Connection strings in `appsettings.{env}.json`.
- ⚠ **Migrations:** none clearly present (host looks DB-first / DBA-owned). Schema-authoring approach is **decision #1**.

### A4. API conventions (mandatory for WMS)
- `ControllerBase`; `[Route("api/[controller]")]`, `[ApiController]`.
- **Response envelope `OperationResult`** `{ ErrorOccured, Message, Data, ExtraData }` — factory `OperationResult.of(isSuccess, message, data)`. **Not ProblemDetails.**
- **Errors:** `throw new APICustomException(msg, APICustomReturnType.X)` (enum has 30+ codes: `DataNotFound`, `NotAuthorized`, `RequiredField`, `CodeAlreadyExist`, `ForeignKeyConflict`, …). Caught by `ErrorHandlingMiddleware`.
- **Lists/grids:** accept `[DataSourceRequest] DataSourceRequest`, return `DataSourceResult` (Kendo) — this is the mock's "funnel table" + filter grid pattern, server-side.
- **Mapping:** AutoMapper `Profile` classes in `WMS.Infrastructure.MappingProfiles`, registered in `WMS.API.Config.AutoMapperConfig`.
- **Validation:** DataAnnotations on DTOs + business checks in services (host has no FluentValidation — adopting it for WMS is optional, flag if so).

### A5. Wiring a new module
- `WMS.DIContainerCore.ContainerExtension.Initialize(services)` registers repos (`AddScoped`), services (`AddTransient`), `AddDbContext<WmsDbContext>(… UseSqlServer …)`. Called from `WMS.API.Startup`.
- Add the gateway route in `APIGateway/configuration.json` (`/wms/{controller}/{everything}` → WMS.API host:port).
- Logging via **NLog** (`nlog.config`). `IMemoryCache` available.

---

## B. Frontend ERP — `sds-erp-front` (Angular 14, NgRx, multi-project workspace)

### B1. Where the WMS ERP UI goes
- `angular.json` is a **multi-project workspace** (`finance`, `operations`, `crm`, … each a lazy-loaded micro-app). Add **`projects/wms`** the same way.
- Register in `src/app/app-routing.module.ts` with `loadChildren` + `canLoad:[AuthGuard, ModuleGuard]` + `data:{ title, translatedTitle, featureModuleName }`.
- Component selector prefix **`sds-wms-`**, kebab-case files. Sub-feature folders: `goods-reception/`, `putaway/`, `stock-out/`, `inventory/`, `reports/`, `master-data/` — each its own lazy module + `state/` (actions/reducers/effects/selectors).
- Add path alias `@wms/*` in root `tsconfig.json`.

### B2. State, API, auth, UI (reuse)
- **NgRx 14.3.2** — all server data flows component → action → **effect → API → store → selector**. **No direct HTTP in components.** Each sub-feature gets `EffectsModule.forFeature([...])`. *(This is real per-screen effort — see estimation.)*
- **API client is Swagger-generated** (`swagger-api*` packages, `ApiModule.forRoot(ConfigFactory)`, base URL in `environment.ts`). ➡ **Workflow: backend publishes the WMS Swagger → regenerate the WMS Angular client → screens consume it.** Hand-written services only if no spec.
- **Interceptors are automatic** (commons): Auth (Bearer + 401 refresh + 403 redirect), HttpErrors (ngx-toastr), Language, Module. Don't reinvent.
- **Auth in UI:** route-gate with `PermissionGuard` + `data:{ roles:[...] }`; button-gate with `SdsAccessChecker.isGranted(['WMS_ExpressFulfil'])` → `*ngIf`. (No `*hasPermission` directive exists.)
- **UI kit:** **Nebular 8** (layout/cards/tabs/forms/badges/dialogs) + **Kendo Angular 2022.3** (data grids, charts, export) + **Angular Material 13**. **Reactive Forms** (`UntypedFormBuilder`). `ToastrService` for messages. The mock's `wireframe.css` maps to the Nebular theme — **no new design system**.
- **i18n:** `$localize` + XLF (`en/fr/pt/es`). Mark all WMS strings `i18n="@@wms.*"`.

---

## C. Frontend PWA — `wms-scanner` (greenfield, Angular)

- **No PWA tooling in the host today** (`@angular/service-worker` absent). Recommended: a **new Angular app `projects/wms-scanner`** in the same workspace.
- **Share** with the ERP via `projects/commons/`: the generated WMS API client + model/DTO interfaces (one source of truth for both channels).
- Add `@angular/service-worker` + `ngsw-config.json` **in the scanner only**.
- Scanning: native `BarcodeDetector` + ZXing fallback + manual + pick-from-list (mirror the mock's `pwa-scan.js`).
- **Offline (decision #5):** if required → IndexedDB queue + sync-on-reconnect + server-side conflict handling (significant effort). If not → online-only v1, much cheaper.

---

## D. What the mockups already give the build (accelerators)

| Mock artifact | Becomes |
|---|---|
| `assets/data.js` entity shapes + `[mock]→production` flags | WMS **SQL DDL** + EF entities + **test fixtures/seed**. |
| `data.js` helpers (`fefoAllocate`, `binCapacityForAdd`, `isLocFrozen`, `putawayPlace`, `inspectionSplit`, …) | **Service method signatures** — the domain API is already designed. |
| Each ERP/PWA screen | The **FE acceptance baseline** ("must behave like this"). |
| `../../docs/BLOCKING_RULES.md` | The **guard/validation test suite**, verbatim. |
| `../../EDGE_CASE_TRACKER.md` (25 paths) | The **negative-test catalogue**, pre-written. |
| `../../docs/BUILD_LOG.md` | The **estimation reference class**. |

---

## E. Integration decisions (confirm before finalizing dependent docs)

| # | Decision | Default recommendation | Affects |
|---|---|---|---|
| 1 | Schema authoring: EF migrations vs DBA SQL scripts | EF migrations for the WMS module (own its schema; DDL seeded from `data.js`) | `COMMON_DATABASE_RULES`, Phase 0 |
| 2 | Tenant/site scoping: extend host `User`/`UserClaim` vs WMS-side scope table | WMS-side `UserSiteScope` + a claim, to avoid editing the shared Auth schema | `COMMON_SECURITY_RULES`, Phase 0 |
| 3 | Runtime: stay on .NET Core 3.1 vs upgrade WMS module | Stay on 3.1 for host parity; log the EOL risk as an ADR | all backend |
| 4 | PWA placement: same workspace vs separate repo | Same workspace (`projects/wms-scanner`) to share models + client | Phase "PWA" cards |
| 5 | PWA offline: hard requirement vs online-only v1 | Confirm with client; large cost delta | PWA cards, estimate |

> When any of these is decided, record it as an ADR in `ADR/` and update the affected rule file.

# Common Rules — index

> Rules that apply to **every phase and every developer**. A build card never restates these — it links here.
> Concrete to the host stack (ASP.NET Core 3.1 · EF Core 3.1 · SQL Server 2014 · Angular 14 · NgRx · Nebular/Kendo).
> Authority for the host's actual conventions: `../01-orchestrator/HOST_INTEGRATION_MAP.md`.

| File | Covers | Maturity |
|---|---|---|
| `COMMON_APP_RULES.md` | Module structure, where things live, what is a "slice" | ✅ concrete |
| `COMMON_BACKEND_RULES.md` | .NET module layering, services, transactions, DI | ✅ concrete |
| `COMMON_FRONTEND_RULES.md` | Angular project layout, NgRx, components, forms | ✅ concrete |
| `COMMON_DATABASE_RULES.md` | SQL 2014 schema rules, EF, the array→child-table rule, audit table | ✅ concrete |
| `COMMON_API_RULES.md` | Routes, `OperationResult`, `DataSourceResult`, Swagger, AutoMapper | ✅ concrete |
| `COMMON_CRUD_RULES.md` | The repeatable list+form recipe using the generic base service | ✅ concrete |
| `COMMON_SECURITY_RULES.md` | Authn/authz reuse, role/claim gating, **tenant+site scoping** | ✅ concrete (1 open decision) |
| `COMMON_UI_UX_RULES.md` | Nebular/Kendo usage, the 8 screen patterns, flag-driven fields | 🟦 concise |
| `NAMING_CONVENTIONS.md` | Ids, files, endpoints, DB, namespaces, NgRx | 🟦 concise |
| `VALIDATION_RULES.md` | Where validation lives, shared patterns | 🟦 concise |
| `ERROR_HANDLING_RULES.md` | `APICustomException` codes, toastr, error shape | 🟦 concise |
| `LOGGING_AUDIT_RULES.md` | NLog, the `logTxn` invariant (CC-03), audit fields | 🟦 concise |
| `TESTING_RULES.md` | Test layers, fixtures from `data.js`, coverage gates | 🟦 concise |
| `PERFORMANCE_RULES.md` | Query budgets, server-side paging, list caps | 🟦 concise |
| `CHANGE_CONTROL.md` | **Locked anchors** + the ADR process (what devs may/may not change) | ✅ concrete |

**Maturity:** ✅ = ready to follow · 🟦 = scaffolded with the key decisions captured, finalize during Phase 0.

# Change Control — what developers may and may not change

> Answers requirement #17. Mirrors the mock's "anchors — change carefully, note it" discipline, carried into
> the build. Protects the things that, if changed silently, break other people's work.

## Locked anchors (change ONLY via an ADR + lead sign-off)
| Anchor | Why locked | Where |
|---|---|---|
| **Data model / schema** | every slice + the generated client depend on it | `../../docs/DATA_MODEL.md`, `WmsDbContext`, migrations |
| **Cross-cutting service interfaces** | every process phase codes against them | `IFreezeService`, `ICapacityService`, `IStockLedgerService`, `IAllocationService`, `IReasonService`, `ITenantScopeService` |
| **API contracts / Swagger** | breaking change ripples to ERP **and** PWA generated client | controllers + DTOs |
| **Shared host files** | shared across all host modules | `APIGateway/configuration.json`, `src/app/app-routing.module.ts`, the shared `APICustomReturnType` enum, the Auth/scoping model |
| **Locked vocabulary** | terminology is agreed; renaming causes confusion | `../../docs/GLOSSARY.md` |
| **Blocking-rules invariant** | the system's correctness contract | `../../docs/BLOCKING_RULES.md` |
| **Common rules** | apply to everyone | this folder |

## Freely changeable (the owner's discretion, within the common rules)
- Anything inside a card's **own** new files: internal service logic, private methods, component internals, local styles, test details.
- Adding a **new** endpoint/DTO/entity for your slice (it doesn't break others) — still follow the conventions and publish Swagger.

## The ADR process (for a locked-anchor change)
1. Write `ADR/ADR-NNN_<slug>.md`: context · the change · alternatives · impact on consumers · migration.
2. Lead + affected-phase owners sign off.
3. Update the locked artifact **and** every consumer; bump Swagger; regenerate the client.
4. Note it in `PROJECT_ORCHESTRATOR.md` (so the change is visible).

## Concurrency discipline
Two cards must not edit the same locked anchor at once. Sequence anchor edits through the lead; everything else runs in parallel (`PHASE_DEPENDENCY_MATRIX.md` §4).

## Golden rule
> If a change would surprise another developer who is coding against your output, it needs an ADR. If it only affects your own files, just do it well.

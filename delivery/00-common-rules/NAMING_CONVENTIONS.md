# Naming Conventions

> Consistency lets developers and the generated client predict names. Match the host; the rows below are WMS-specific.

## Backend (.NET)
| Thing | Convention | Example |
|---|---|---|
| Entity | `Wms<Pascal>` | `WmsOutboundOrder`, `WmsLpn` |
| DbContext | `WmsDbContext` | |
| DTO | `Wms<Entity>DTO/CreationDTO/EditorDTO/FilterDTO` | `WmsLpnDTO` |
| Command DTO | `<Operation>DTO` | `PutawayCommitDTO` |
| Service iface / impl | `IWms<Entity>Service` / `Wms<Entity>Service` | |
| CC service | `I<Concern>Service` | `IFreezeService` |
| Repo | `IWms<Entity>Repository` | |
| Controller | `<Aggregate>Controller` | `PutawayController` |
| Namespace | `WMS.<Layer>.<SubDomain>` | `WMS.Services.Outbound` |

## Database (SQL 2014)
- Tables `Wms<Entity>` (child tables `Wms<Parent><Child>`, e.g. `WmsOutboundLine`). Columns `PascalCase` (host style) — keep consistent with the host's casing once confirmed.
- PK `Id` (int identity); business key `Code`; FK `<Entity>Id`; scope `ClientId`/`SiteId`.

## Business id codes (user-facing, the `Code` column)
Keep the mock prefixes (`../../docs/DATA_MODEL.md`): `C- S- LOC- P- LPN- ASN- OUT- U- CAT- SUB- PKG- SUP- CAR- CNE- TRF- MOV- CNT- PHY- RPK- RET- ADJ- DSP- RTV- DN- GRN- TXN-`.

## API routes
`/api/<aggregate>/<action>` lower-case; grid action `gridfilter`. Through gateway: `/wms/<aggregate>/...`.

## Frontend (Angular)
| Thing | Convention | Example |
|---|---|---|
| Project | `wms` (ERP), `wms-scanner` (PWA) | |
| Selector | `sds-wms-<kebab>` / `sds-wms-scanner-<kebab>` | `sds-wms-asn-list` |
| Files | `<kebab>.component.ts/html/scss`, `.service.ts`, `.module.ts`, `.effects.ts`, `.reducer.ts`, `.actions.ts` | |
| NgRx action | `[WMS <Area>] <Event>` | `[WMS Putaway] Load Tasks` |
| i18n key | `wms.<area>.<key>` | `wms.putaway.confirm` |

## Build cards & docs
Cards: `P0X-SYY_<slug>.md` (e.g. `P03-S01_single-lpn-putaway.md`). Cross-cutting ids `CC-NN`. ADRs `ADR-NNN_<slug>.md`.

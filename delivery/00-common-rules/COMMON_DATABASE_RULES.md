# Common Database Rules (SQL Server 2014 · EF Core 3.1)

> **SQL Server 2014 is a hard constraint.** It shapes the schema more than any other single decision.
> Entity field definitions live in `../../docs/DATA_MODEL.md` — this file is the *how to persist it* rules.

## SQL Server 2014 — what you do NOT have (design around it)
| Not available in 2014 | Consequence for WMS |
|---|---|
| System-versioned **temporal tables** (2016+) | **Audit is hand-rolled** — the `WmsTxn` ledger table (CC-03) + optional before/after snapshot columns. |
| **JSON** functions / `OPENJSON` (2016+) | **No JSON columns.** The mock's nested arrays become **child tables** (see below). |
| `STRING_AGG`, `TRIM`, `STRING_SPLIT` (2016/2017+) | Aggregate/split in C#/LINQ, not T-SQL. |
| `OFFSET/FETCH` is fine (2012+) | Server-side paging via EF `Skip/Take` works (Kendo `DataSourceRequest`). |
| Sequences exist (2012+) | OK for id generation if used; host uses `int IDENTITY` — match it. |

## The array → child-table rule (most important)
The mock dataset (`data.js`) stores nested arrays on a record. In SQL 2014 each becomes a child table with an FK:

| Mock nested array | Becomes table |
|---|---|
| `Outbound.lines[]` + `line.alloc[]` | `WmsOutboundLine`, `WmsAllocation` |
| `Outbound.shipments[]` + shipment lines | `WmsShipment`, `WmsShipmentLine` |
| `ASN.lines[]` | `WmsAsnLine` |
| `LPN.serials[]` | `WmsLpnSerial` (**explicit unique rows**, not a display range — closes DATA_MODEL gap #2) |
| `Site.areas[]`, `Site.levels[]` | `WmsStorageArea`, `WmsSiteLevel` |
| `Packaging.levels[]` | `WmsPackagingLevel` |
| `Physical.locations[].lines[]`, `Count.locations[].lines[]` | `WmsPhysicalLocation`/`Line`, `WmsCountLocation`/`Line` |
| `Repack.sources[]/outputs[]`, `Return.lines[]`, `Transfer.lines[]` | child tables each |

## Keys, types, conventions
- **PK:** `int IDENTITY` (host convention; `User.Id` is int). The human prefix ids (`LPN-…`, `ASN-…`, `OUT-…`) are a **separate `Code` column** (business key, unique per scope) — not the PK.
- **Money:** none (3PL — quantity/location/genealogy only).
- **Quantities:** `decimal(18,3)` (UoM `dec` flag allows decimals) — never `float`.
- **Dates:** `datetime2`. **Enums:** persist as `varchar` status codes (match the enum strings in `DATA_MODEL.md`), or a lookup table; do not use magic ints.
- **Audit fields** on mutable entities: `CreatedBy/CreatedAt/EditBy/EditTime` (host uses `AddNewTime?/EditTime?` — match).
- **Scoping columns:** `ClientId` and/or `SiteId` on every scoped entity (CC-08) — and **indexed**, because every query filters by them.

## Indexing (baseline)
- Every FK. Every `(SiteId, Status)` used by a worklist. `WmsLpn(SiteId, Status, ProductId)` for SoH/allocation. `WmsTxn(Lpn)`, `WmsTxn(Ts)` for stock card / reports. Business-key `Code` columns unique.

## Stock-on-hand
**Derived, not stored** (SoH = `available` LPNs grouped by product/lot/loc) — per DATA_MODEL. 📌 DECISION (Phase 0): keep derived (a view/query) for v1; revisit materialization only if Reports perf needs it (DATA_MODEL gap #1).

## Audit ledger `WmsTxn` (CC-03)
Append-only. Columns per `DATA_MODEL.md` §Transaction history. **No updates/deletes** — enforce by convention + (optionally) a DENY on UPDATE/DELETE for the app login. Production intent: strictly immutable with full actor + before/after (DATA_MODEL gap #6).

## Schema authoring (decision #1)
EF Core migrations owned by `WMS.Entities` **vs** DBA SQL scripts. **Recommendation:** EF migrations for the WMS module; **seed the initial DDL from `data.js` shapes**. Record the choice as an ADR. Either way: one migration per card where schema changes; never edit a shipped migration.

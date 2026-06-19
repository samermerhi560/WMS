# Phase 1 — Master Data

> Everything else references these entities. Mostly the **CRUD recipe** (`../00-common-rules/COMMON_CRUD_RULES.md`)
> → mostly tier S/M and highly parallelizable once Phase 0's base classes exist.
> Functional spec: `../../docs/01_Master_Data.md`. Mock: `erp-md-*.html`, `pwa-md-lookup-*.html`.

## Objective
Deliver the master data the operational processes depend on: clients, sites (+ addressing levels + storage areas), locations, products (+ tracking flags + preferred storage), categories, UoM, packaging, partners, consignees, reason codes, users (+ WMS roles/scope), and import.

## Consumes (cross-cutting)
CC-05 (tracking flags on Product), CC-07 (reason domains), CC-08 (scoping), CC-09 (assignment filter where a master is a work-item — minimal here).

## Planned sub-phase cards
| Card | Scope | Notes | Tier |
|---|---|---|---|
| P01-S01 | Clients (+ `allowBackorder`), Suppliers, Carriers, Consignees | CRUD recipe | S–M |
| P01-S02 | Sites (+ `levels[]` addressing, `areas[]` storage areas), Locations (+ capacity, area) | areas/levels are child tables; feeds CC-02 | M |
| P01-S03 | Products (+ `track` flags, category/subcat, weight, **preferred storage** per site), Categories, UoM | tracking flags drive CC-05 everywhere | M |
| P01-S04 | Packaging (shared templates + product packaging w/ per-level barcodes) | nested levels → child table; clone provenance (DATA_MODEL gap #5) | M |
| P01-S05 | Reason codes (`DB.reasonDomains` — status/adjust/correct/return/dispose/refuse/rtv/receipt/dispatch) | drives CC-07; generic editor | S |
| P01-S06 | Users + WMS role/right assignment + **client/site scope** mapping; client–user map | ties to CC-08/CC-10 (Phase 0) | M |
| P01-S07 | PWA lookups (location, product) — read-only | reuse generated client | S |
| P01-S08 | Bulk **import** (master data) | mock `erp-md-import` is stubbed; scope CSV import | M |

## Depends on
Phase 0 (skeleton, scoping, CRUD base, reason framework).

## Key references
`COMMON_CRUD_RULES.md`, `../../docs/DATA_MODEL.md` (entity fields), `../../docs/GLOSSARY.md` (Zone vs Area — do not conflate).

## Open questions
Which masters are WMS-owned vs shared with the host ERP (products/suppliers may already exist in `Common/GDB` — reconcile to avoid duplication). Import file formats & validation depth.

## Estimation note
Bulk of cards are S/M via the generic base service. Watch: Products (tracking-flag conditional UI/validation), Sites/Locations (areas + levels + capacity child tables), Packaging (nested levels), Users (scoping touches the shared Auth model). Highly parallel — staff several at once after Phase 0.

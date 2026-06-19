# Warehouse Management System (3PL / Customer-Owned Stock) — Project Overview

> High-level charter. Each functional section gets its own detailed spec file (created **after** features are selected). This file stays intentionally small and just points to the others.

## 1. Purpose
A WMS to manage **client-owned stock in a third-party logistics (3PL) warehouse**. Goods belong to the clients, not to the warehouse operator, so they never affect the operator's assets or balance sheet. The system covers: master data, inbound (reception), storage (putaway), outbound (stock-out), inventory control, and reporting.

## 2. Operating Principles
- **Multi-client (multi-tenant):** every stock record, movement, and report is segregated by owning client.
- **Customer-owned stock:** no inventory valuation on the operator's books; focus is traceability and accountability to each client.
- **Full traceability:** lot/batch + expiry + serial tracking is **flag-driven per product** (default: lot + expiry ON, serial OFF — serials only for serialised goods; **expiry ⇒ lot**). Drives FEFO and full genealogy across all sections. See `GLOSSARY.md`.
- **Multi-site:** operations, stock, and reporting span multiple warehouses/sites; stock is always site-scoped.
- **Two delivery channels:**
  - **ERP module** — back-office (master data, orders, reporting).
  - **PWA scanning app** — warehouse floor (scan locations / products / license plates for receiving, putaway, picking, counting, moves).
- **Dual-channel, ERP-complete:** every operational action (receive, putaway, pick, move, transfer, count, adjust) is available **both** on the PWA scanner and in the ERP with manual entry. If scanners are offline, the warehouse stays fully operable from the ERP alone.
- **Token-efficient spec strategy (for Fable 5):** the project is split into phases; each phase is self-contained and ships with *only* the specs and code samples needed for that phase.

## 3. Functional Sections (map)
| # | Section | What it does | Detail spec |
|---|---------|--------------|-------------|
| 1 | Master Data | Clients, products, categories, locations, Storage Areas, UoM, users | `01_Master_Data.md` |
| 2 | Goods Reception | Inbound / receiving against ASN or blind | `02_Goods_Reception.md` |
| 3 | Putaway | Allocate received goods to storage locations | `03_Putaway.md` |
| 4 | Stock-Out | Outbound requests, full or per-line exit | `04_Stock_Out.md` |
| 5 | Inventory Operations | Moves, adjustments, counts | `05_Inventory_Operations.md` |
| 6 | Reports & Visibility | Stock on hand, movements, client statements | `06_Reports.md` |

*(Detail files are created once the MUST / NICE-to-have features per section are confirmed.)*

**Cross-cutting references** (not feature sections — read alongside the specs):
| File | What it holds |
|------|---------------|
| `GLOSSARY.md` | Locked vocabulary — the single source of truth for terminology. |
| `DATA_MODEL.md` | Entities, fields, status values, and `data.js` helper functions. |
| `BLOCKING_RULES.md` | The locked invariant every stock-mutating action must satisfy (cross-cutting). |
| `../mockups/MOCKUP_STATUS.md` | Live mockup build state + the PWA roadmap. |
| `BUILD_LOG.md` | Chronological build history + feedback resolutions (the "why"). |

Possible later phases: **Client Portal** (client self-service) and **Billing** (activity-based charges) — out of scope for v1 unless decided otherwise.

## 4. Channel Split
| Section | ERP module | PWA scanning |
|---------|:----------:|:------------:|
| Master Data | ● | lookup only |
| Goods Reception | ● full (manual) | ● scan |
| Putaway | ● full (manual) | ● scan |
| Stock-Out | ● full (manual) | ● scan |
| Inventory Operations | ● full (manual) | ● scan |
| Reports | ● | — |

## 5. Delivery Phases
1. **Specification** *(done)* — this overview + per-section detail files.
2. **Mockups** *(current)* — HTML mockup per section (ERP screens + PWA screens).
3. **Technical implementation plan** — architecture, data model, APIs, then phase-by-phase build specs for Fable 5.

## 6. Confirmed Scope Decisions (v1)
- **Lot/batch + expiry + serial tracking:** YES — **flag-driven per product** (default lot + expiry ON, serial OFF; expiry ⇒ lot).
- **Multi-site:** YES.
- **Client portal:** OUT of v1 (back-office only).
- **Billing:** OUT of v1 (no hook reserved).
- **Stock movements:** intra-site (location → location) AND inter-site transfers are both IN v1.

# WMS — 3PL Warehouse Management System

A Warehouse Management System for **client-owned stock in a third-party logistics (3PL) warehouse** —
an **ERP module** (back-office) plus a **PWA scanning app** (warehouse floor). Goods belong to the
clients, never to the operator's balance sheet; the system tracks traceability, location, and
accountability per client.

**Current phase:** Mockups (click-through HTML wireframes). ERP is complete for Master Data, Goods
Reception, Putaway, and Stock-Out; Inventory Operations is next. See `mockups/MOCKUP_STATUS.md`
for live build state.

## Repository layout
```
.
├─ README.md                  ← you are here
├─ docs/                      ← functional source of truth
│  ├─ 00_Project_Overview.md  ← charter + section map + scope decisions
│  ├─ 01_Master_Data.md
│  ├─ 02_Goods_Reception.md
│  ├─ 03_Putaway.md
│  ├─ 04_Stock_Out.md
│  ├─ 05_Inventory_Operations.md
│  ├─ 06_Reports.md
│  ├─ GLOSSARY.md             ← locked vocabulary — read first (Zone vs Area, LPN, FEFO, …)
│  └─ DATA_MODEL.md           ← consolidated entities, fields, enums, relationships
└─ mockups/                   ← the agreed UX reference (click-through wireframes)
   ├─ index.html              ← sitemap / launcher — open this first
   ├─ assets/                 ← wireframe.css, data.js, erp-shell.js, pwa-shell.js
   ├─ erp-*.html              ← ERP screens
   ├─ pwa-*.html              ← PWA scanner screens
   └─ MOCKUP_STATUS.md        ← mockup-phase build status + locked decisions
```

## Where to start
- **New to the project?** Read `docs/00_Project_Overview.md`, then `docs/GLOSSARY.md`.
- **Building / coding?** `docs/DATA_MODEL.md` is the schema bridge; each `docs/0N_*.md` is the
  functional spec for one section (Purpose, In/Out of Scope, Entities, Process Flow, Business
  Rules, Screens, Dependencies).
- **Continuing the mockups?** Open `mockups/MOCKUP_STATUS.md` — it has the restart prompt and the
  full list of built screens and locked decisions.

## Running the mockups
Plain HTML + one shared CSS + vanilla JS — **no build step**. Open `mockups/index.html` in a
browser (works over `file://`). Every HTML file must stay **beside** the `assets/` folder, or the
CSS/JS won't load. Data is a single linked mock dataset (`assets/data.js`) so IDs cross-reference
across screens — an LPN received in Goods Reception appears as a Putaway task, then as stock.

## Key principles (see `docs/00_Project_Overview.md`)
- **Multi-client, multi-site;** every record scoped by owning client and site.
- **Full traceability:** lot/batch + expiry + serial on every product → FEFO and full genealogy.
- **Dual-channel, ERP-complete:** every operation works on both the PWA scanner and the ERP
  (manual entry). If scanners are offline, the ERP alone keeps the warehouse operable.
- **Vocabulary discipline:** *Zone* = an addressing-path level; *Storage Area* = a slotting group.
  Don't conflate them — see `docs/GLOSSARY.md`.

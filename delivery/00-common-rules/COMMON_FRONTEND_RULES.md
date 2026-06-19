# Common Frontend Rules (Angular 14 · NgRx · Nebular/Kendo)

> Host conventions: `../01-orchestrator/HOST_INTEGRATION_MAP.md` §B. The WMS ERP UI is a new lazy-loaded
> project in the existing workspace; the PWA scanner is a new app sharing models + the generated client.

## Project & module layout
- **ERP:** `projects/wms` (mirror `projects/finance`). Register in `src/app/app-routing.module.ts` with `loadChildren` + `canLoad:[AuthGuard, ModuleGuard]` + `data:{title, translatedTitle, featureModuleName}`. Path alias `@wms/*`.
- **PWA:** `projects/wms-scanner` (new app, same workspace; `@angular/service-worker`).
- Sub-features (`goods-reception/`, `putaway/`, `stock-out/`, `inventory/`, `reports/`, `master-data/`): each a **lazy-loaded NgModule** + `-routing.module.ts` + `state/` + `components/` + `services/`. Do **not** statically import sub-features.
- Selectors **`sds-wms-*`** (ERP) / **`sds-wms-scanner-*`** (PWA), kebab-case files, SCSS, max line 140, single quotes (TSLint/Prettier as host).

## State (NgRx — mandatory)
- All server data flows **component → action → effect → API → store → selector**. **No HTTP in components.**
- Per sub-feature: `actions/`, `reducers/`, `effects/`, `selectors/`; register `EffectsModule.forFeature([...])` + feature reducer.
- Consider `@ngrx/entity` for normalized lists (LPNs, locations, orders) — propose in Phase 0.
- Components are thin: dispatch on init/action, subscribe to selectors, render.

## API layer (generated — do not hand-write)
- The WMS Angular client is **generated from the backend Swagger** (host pipeline, `swagger-api-wms`). Inject the generated services **inside effects**.
- Base URL `wmsApiUrl` in `src/environments/environment*.ts`. Register the generated `ApiModule.forRoot(...)`.
- **Interceptors are automatic** (commons): Auth (Bearer/401/403), HttpErrors (toastr), Language, Module — do not duplicate.

## Forms
- **Reactive Forms** with `UntypedFormBuilder` + `Validators` (+ custom validators from `@commons`). Inline error display per host pattern. Disable submit until valid; show server (`OperationResult.Message`) errors via toastr.

## UI kit (no new design system)
- **Nebular 8** for layout/cards/tabs/inputs/badges/dialogs; **Kendo Angular** for data grids, filtering, charts, export; **Angular Material** where already used. The mock `wireframe.css` maps to the Nebular theme — replicate structure, not bespoke CSS.
- **Lists = Kendo grid bound to a `DataSourceResult`** endpoint (server-side filter/sort/page) — this is the mock's funnel/filter table.

## Permission-gated UI (CC-10)
- Route-gate: `PermissionGuard` + `data:{roles:[...]}`.
- Button/action-gate: inject `SdsAccessChecker`, `isGranted(['WMS_ExpressFulfil'])` → bind to `*ngIf`. (No `*hasPermission` directive exists — follow the host pattern.)

## Tracking-flag-driven fields (CC-05)
Lot/Expiry/Serial inputs and columns render **only** when the product's flag is on; lists show a muted `n/a` for an untracked attribute, forms omit it. Drive off the product `track` flags carried in the DTO. This is system-wide, not per-screen polish.

## i18n
Mark every user-facing string `i18n="@@wms.<area>.<key>"` (templates) / `$localize` (code). Languages en/fr/pt/es. Run `npm run extract-i18n`.

## PWA specifics
- Scan engine = native `BarcodeDetector` + ZXing fallback + manual + pick-from-list (mirror `pwa-scan.js`). Every scan field offers all modes.
- Mis-scan guard: confirm disabled until the required scans (bin + LPN/product) are captured, with an **audited manual override**.
- Offline (decision #5): if in scope, queue mutations in IndexedDB + sync-on-reconnect; otherwise online-only v1.

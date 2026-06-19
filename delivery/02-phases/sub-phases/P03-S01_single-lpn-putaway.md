# [P03-S01] Single-LPN directed putaway (API + ERP + PWA)

> **Reference card** — a complete, ready-to-build instance of `../../01-orchestrator/SUBPHASE_TEMPLATE.md`.
> Demonstrates how a slice consumes the Phase-0 kernel (six cross-cutting concerns, each one call).

| Meta | |
|---|---|
| Phase | 3 — Putaway |
| Owner | unassigned |
| Status | Ready *(when Phase 0 + P01-S02/S03 + P02-S02 are Done)* |
| Channel(s) | API · ERP · PWA |
| Complexity | **L** |
| Depends on | P00-S04 (ledger), P00-S05 (freeze), P00-S06 (capacity), P00-S02 (DB), P01-S02 (locations/areas), P01-S03 (products/preferred), P02-S02 (receive → `to-putaway` LPNs) |
| Consumes | CC-01 freeze · CC-02 capacity+segregation · CC-03 audit · CC-04 conservation · CC-08 scoping · CC-09 assignment |
| Functional spec | `../../../docs/03_Putaway.md` · `../../../docs/BLOCKING_RULES.md` (capacity/freeze guards) · `../../../docs/DATA_MODEL.md#lpn` · mock: `erp-pa-tasks.html`, `pwa-pa-putaway.html` |

## 1. Functional scope & edge cases
- **Objective:** move a `to-putaway` LPN into a storage bin via ranked-bin suggestion, enforcing capacity + segregation + freeze; support **partial putaway** (place part, split a child LPN for the remainder, loop until stored).
- **Normal flow:** `03_Putaway.md` Process Flow — worklist (`to-putaway` at my site, scope-filtered) → open task → ranked bins (home → consolidate → category/area-affinity → open) with capacity read-out → enter **qty-to-place** → confirm → commit.
- **Edge cases (trace to `EDGE_CASE_TRACKER.md`):** overflow-park (no bin fits); resume a partially-placed plate; mis-putaway guard (scanned bin ≠ chosen). *(Damage-found reject is the sibling card P03-S03.)*
- **Business rules (`BLOCKING_RULES.md`):** capacity + segregation must pass for the **entered** qty (so a partial can fit a smaller bin); **refuse a frozen-scope bin**, naming the blocking `PHY-…`; one LPN → one bin per placement; conservation on split.
  - 📌 **DECISION:** the ERP screen calls the shared `ICapacityService` — **not** a local capacity impl (mock `erp-pa-tasks` carry-over to fix).
- **Permissions:** Operator+ (CC-10). Optional `assignee` per task (CC-09).
- **System behaviour on commit:** if qty == plate → relocate plate (keep id, status→`available`, set `loc`); if qty < plate → place that qty (mint child `available` at bin), source stays `to-putaway` with remainder. Write a `putaway` `WmsTxn`. Conserve qty.

## 2. Data required
- **Entities:** `WmsLpn` (status `to-putaway`→`available`, `LocId`, `Qty`, genealogy lot/expiry/serial child rows), child-LPN mint on partial. `WmsLocation` (capacity maxima, `AreaCode`, type). `WmsTxn` (audit). See `DATA_MODEL.md#lpn`, `#location`.
- **DTOs:** `PutawayTaskDTO` (LPN + product + suggested bins), `BinSuggestionDTO` (bin + load/after + pass/fail + reason), `PutawayCommitDTO { lpnId, binId, qty }`.
- **Joins:** LPN→Product (weight, tracking flags, preferred), LPN→Location, Location→Site/Area; bin load aggregates LPNs at the bin.
- **Indexes:** `WmsLpn(SiteId, Status)` (worklist), `WmsLpn(LocId)` (bin load), FK indexes. **Defaults:** qty-to-place defaults to whole plate.
- **Integrity:** conservation (Σ child + remainder == source); genealogy carried (CC-04); scope assert (CC-08).

## 3. Frontend restrictions (ERP + PWA)
- **ERP** (`projects/wms/.../putaway/`): worklist **Kendo grid** (To-put-away / Completed tabs) + detail with the **ranked-bin panel** (capacity read-out + excluded list) + **qty-to-place** input + partial-progress panel. **Assignee/My-requests filter** on the list (CC-09). Baseline: `erp-pa-tasks.html`.
- **PWA** (`projects/wms-scanner/.../putaway/`): scan/pick LPN → ranked bins → **scan-confirm destination bin** (mis-scan guard + audited override) → qty → commit. Baseline: `pwa-pa-putaway.html`.
- **NgRx:** `[WMS Putaway] Load Tasks`, `Load Suggestions`, `Commit Putaway` (+ success/fail). No HTTP in components.
- **Behaviour:** lot/expiry shown only if product tracks them (CC-05); capacity fail disables confirm with the reason; loading skeleton; errors via toastr from `OperationResult.Message`.

## 4. Backend restrictions
- **Controller** `PutawayController`: `POST /api/putaway/tasks/gridfilter` → `DataSourceResult`; `GET /api/putaway/{lpnId}/suggestions` → `OperationResult`(BinSuggestionDTO[]); `POST /api/putaway/commit` (PutawayCommitDTO) → `OperationResult`.
- **Service** `IPutawayService.Place(lpnId, binId, qty, user)`: in **one transaction** — re-read LPN (CC-11) → `ITenantScopeService.AssertInScope` → `IFreezeService.IsLocationFrozen(binId)` (block + name take) → `ICapacityService.CheckForAdd(binId, qty, productId)` + `SegregationOk(binId, clientId)` → split/relocate → `IStockLedgerService.LogTxn('putaway', …)` → commit.
- **Repository** `IWmsLpnRepository` (read worklist, bin load, save), reuse generic base for CRUD.
- **Security:** `[Authorize]` + scope assert; **server is authoritative** (UI capacity hint is advisory).

## 5. Implementation steps
1. EF entity/migration deltas (child-LPN mint path; ensure indexes). 2. DTOs. 3. AutoMapper profile. 4. repo methods (worklist, bin load). 5. `PutawayService.Place` (+ the six CC calls). 6. controller endpoints. 7. publish Swagger. 8. regenerate Angular client. 9. NgRx actions/effects/reducers/selectors. 10. ERP screen. 11. PWA screen. 12. FE validation + permission gating + flag-driven fields. 13. error handling (capacity/freeze → review path). 14. tests. 15. verify acceptance.

## 6. Required files
- **Read:** `03_Putaway.md`, `BLOCKING_RULES.md`, the Phase-0 CC service interfaces, `COMMON_BACKEND/DATABASE/API/FRONTEND_RULES.md`, mock `erp-pa-tasks.html` + `pwa-pa-putaway.html`.
- **Modify:** `WMS.DIContainerCore` (register service), `WmsDbContext` config if needed, `projects/wms` routing.
- **Create:** `PutawayController`, `PutawayService`(+iface), DTOs, AutoMapper profile, NgRx feature, ERP + PWA components, tests.

## 7. Dependencies with other phases
- **Upstream:** Phase 0 CC services (frozen interfaces); P01-S02 (locations + capacity + areas), P01-S03 (products + weight + preferred + tracking); P02-S02 (`to-putaway` LPNs exist).
- **Downstream:** P03-S02 (mixed-pallet decomposition reuses `Place`); Phase 4 (placed stock becomes `available` SoH); Phase 6 Move reuses the same capacity/freeze pattern.
- **Cross-cutting:** freeze (1 call), capacity+segregation (2 calls), audit (1 call), conservation (split assert), scope (1 assert), assignment (list filter).

## 8. Acceptance criteria
- **Functional:** whole-plate putaway relocates + `available`; partial places qty, mints child for remainder, source stays `to-putaway`; loops to full storage.
- **FE (ERP+PWA):** ranked bins shown with capacity read-out; confirm disabled on capacity fail with reason; PWA confirm gated on bin scan (+ override audited); lot/expiry shown only when tracked.
- **BE:** commit re-validates live (CC-11); transaction rolls back on any guard fail (no partial write).
- **Data-integrity:** conservation holds; genealogy carried; one `putaway` `WmsTxn` per placement.
- **Security:** out-of-scope LPN/bin rejected server-side; frozen-scope bin refused naming the `PHY-…`; capacity/segregation enforced server-side.
- **Edge:** overflow-park (no bin) handled; resume of partial works; mis-scan blocked.

## 9. Estimation notes
- **Tier L.** BE 4–6d · DB 1d · FE-ERP 3–4d · FE-PWA 3–4d · Integration 1d · Test 2–3d. *(Calibrate vs the mock build of `erp-pa-tasks`/`pwa-pa-putaway`.)*
- **Risks:** Phase-0 CC interface churn (this is one of the first heavy consumers — expect feedback into Phase 0); ranked-bin ordering correctness; dual-channel parity.
- **Open questions:** none functional (mock resolved partial/decompose/progress). Confirm the shared-capacity migration (📌 decision above).
- **Blockers:** Phase 0 CC services + P01 master data + P02 stock must be Done.

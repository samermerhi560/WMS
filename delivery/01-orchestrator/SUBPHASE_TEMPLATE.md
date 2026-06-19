# Sub-Phase Build-Card — Template

> Clone this for every sub-phase. The card is the **unit of assignment, estimation, and "done"**.
> A developer (or AI assistant) must be able to execute it **cold** — but it achieves that by **linking**
> to the functional spec, not by restating it (see the anti-duplication rule below).
> File name: `02-phases/sub-phases/P0X-SYY_<slug>.md`.

### The anti-duplication rule (resolves "explicit vs not-duplicated")
- For business rules, **link** to the exact functional anchor (`../../docs/0N_*.md#section`, `BLOCKING_RULES.md`, `DATA_MODEL.md#entity`).
- **Restate only a *pinned decision*** — something the spec left open that you are now fixing for the build. Mark it `📌 DECISION:`.
- The card is *complete for execution* when its links + pinned decisions + steps + acceptance leave **nothing to interpret**.

---

```md
# [P0X-SYY] <slice name>

| Meta | |
|---|---|
| Phase | <e.g. 3 — Putaway> |
| Owner | <name / unassigned> |
| Status | Ready · In-progress · In-review · Done |
| Channel(s) | API · ERP · PWA (this card may cover one or all of a vertical slice) |
| Complexity | S · M · L · XL |
| Depends on | [P0X-SYY, …]  (must be Done first) |
| Consumes (cross-cutting) | [CC-01, CC-02, …]  (must match CROSS_CUTTING_CONCERNS.md) |
| Functional spec | ../../docs/0N_*.md#anchor · BLOCKING_RULES.md#row · mock: erp-*.html / pwa-*.html |

## 1. Functional scope & edge cases
- **Objective** (1–2 lines).
- **Normal flow** → link the spec's Process Flow; list the steps only as a checklist.
- **Alternative flows / edge cases / error cases** → link `EDGE_CASE_TRACKER.md` rows; list the IDs.
- **Business + validation rules** → link `BLOCKING_RULES.md` row(s). 📌 pin any decision the spec left open.
- **Permission rules** → which roles/claims gate which actions (CC-10).
- **Expected system behaviour** (what the API must do on commit).

## 2. Data required
- **Entities** (new / existing) → link `DATA_MODEL.md#entity`. Tables, fields, types, enums.
- **DTOs** (`{Entity}DTO/CreationDTO/EditorDTO/FilterDTO`), API payloads, required joins.
- **Status fields / flags / defaults / indexes**. **Data-integrity rules** (FKs, uniqueness, conservation).
- SQL 2014 notes (arrays → child tables; see `COMMON_DATABASE_RULES.md`).

## 3. Frontend restrictions (ERP + PWA)
- **Screens / components** → name the mock reference screen as the visual baseline.
- **Files:** Angular project path(s) to create/modify (`projects/wms/...`, `projects/wms-scanner/...`).
- **NgRx:** actions/reducers/effects/selectors to add. **No HTTP in components.**
- **Form / validation / filter / button behaviour**; read-only & **permission-gated** UI; loading & error (toastr) behaviour; tracking-flag-driven field show/hide (CC-05).

## 4. Backend restrictions
- **Controllers / services / repositories** (names, host conventions per HOST_INTEGRATION_MAP §A).
- **Endpoints** (route, verb, request/response DTO, `OperationResult`/`DataSourceResult`).
- **Business validation** (CC-11 validate-at-commit); **transaction boundaries**; **which Phase-0 services it calls** (must equal the `Consumes` list); **audit** (CC-03 logTxn); **security** (CC-08 scoping, CC-10 roles).

## 5. Implementation steps (execution order)
1. DDL / EF entity + migration → 2. DTOs → 3. AutoMapper profile → 4. repo methods →
5. service methods (+ Phase-0 service calls) → 6. controller endpoints → 7. publish Swagger →
8. regenerate Angular client → 9. NgRx (actions/effects/reducers/selectors) →
10. ERP component(s) → 11. PWA component(s) → 12. FE validation + permission gating →
13. error handling → 14. tests (unit/integration/e2e) → 15. verify acceptance criteria.

## 6. Required files
- **Read:** the functional spec section · the mock screen(s) · the Phase-0 service interfaces · the relevant common-rule files.
- **Modify:** <existing host files — e.g. `app-routing.module.ts`, `WMS.DIContainerCore`, gateway config>.
- **Create:** <new BE/FE files>.
- **Tests / migrations / config** touched.

## 7. Dependencies with other phases
- **Upstream (must exist):** <cards>.
- **Downstream (must honour this slice's outputs):** <cards/phases> — note any contract other phases depend on.
- **Cross-cutting consumed:** restate the `Consumes` list and how each is used (1 line each).

## 8. Acceptance criteria (each testable)
- Functional · Frontend (ERP + PWA) · Backend · Data-integrity · Security (scoping + roles) ·
  Edge-case (trace each to an `EDGE_CASE_TRACKER.md` row) · Performance (if relevant).

## 9. Estimation notes
- Complexity tier + per-dimension effort (BE / DB / FE-ERP / FE-PWA / Integration / Test).
- Risks · open questions · technical unknowns · functional unknowns · blockers · dependency-readiness.
```

---

## Worked example (reference card)

```md
# [P03-S01] Single-LPN directed putaway (API + ERP + PWA)

| Meta | |
|---|---|
| Phase | 3 — Putaway |
| Owner | unassigned |
| Status | Ready (once Phase 0 + P01 master data are Done) |
| Channel(s) | API · ERP · PWA |
| Complexity | L |
| Depends on | [P00-S03 IFreezeService, P00-S04 ICapacityService, P00-S05 IStockLedgerService, P01-S02 Locations/Areas, P01-S03 Products, P02-S02 Receive-against-ASN] |
| Consumes | [CC-01 freeze, CC-02 capacity+segregation, CC-03 audit, CC-04 conservation, CC-08 scoping, CC-09 assignment] |
| Functional spec | ../../docs/03_Putaway.md · BLOCKING_RULES.md (Move/Transfer rows for capacity+freeze) · DATA_MODEL.md#lpn · mock: erp-pa-tasks.html, pwa-pa-putaway.html |

## 1. Functional scope & edge cases
- **Objective:** move a `to-putaway` LPN into a storage bin via ranked-bin suggestion, with capacity/segregation/freeze guards; support **partial putaway** (split a child LPN for the remainder).
- **Normal flow:** see 03_Putaway.md Process Flow — worklist → pick LPN → ranked bins (home→consolidate→category→open) → enter qty-to-place → confirm → `putawayPlace()`.
- **Edge cases:** EDGE rows for putaway overflow-park, damage-found-at-putaway reject, mis-putaway guard, partial/resume. Mock test findings #3, #4, #5, #7.
- **Business rules:** capacity + segregation must pass for the *entered* qty; refuse a frozen-scope bin (name the `PHY-…`); 📌 DECISION: `erp-pa-tasks` must call the shared `ICapacityService`, not a local impl (mock carry-over).
- **Permissions:** Operator+; assignment (CC-09) optional per task.
- **System behaviour:** on commit — set/Split LPN, write `putaway` txn, decrement source, conserve qty.

## 2. Data required
- `WmsLpn` (status `to-putaway`→`available`, `loc`), child LPN mint on partial. `WmsLocation` (+ capacity maxima, `area`). `DATA_MODEL.md#lpn`, `#location`.
- DTOs: `PutawayTaskDTO`, `PutawayCommitDTO {lpnId, binId, qty}`, `BinSuggestionDTO`.
- Index on `(site, status)` for the worklist; `(loc)` for bin load.

## 3. Frontend restrictions
- ERP: `projects/wms/.../putaway/` — worklist grid (Kendo) + detail with ranked-bin panel + partial-putaway progress. Baseline: `erp-pa-tasks.html`.
- PWA: `projects/wms-scanner/.../putaway/` — scan LPN → ranked bins → scan/confirm bin → qty → commit. Baseline: `pwa-pa-putaway.html`.
- NgRx: `loadPutawayTasks`, `commitPutaway` effects. Tracking-flag-driven lot/expiry display (CC-05).

## 4. Backend restrictions
- `PutawayController` (`/api/putaway/tasks` grid, `/api/putaway/commit`). `IPutawayService.Place(lpnId, binId, qty)` calls `ICapacityService.CheckForAdd`, `IFreezeService.IsLocationFrozen`, `IStockLedgerService.LogTxn`. Transaction around split+place+log. Scope-assert site (CC-08).

## 5–9. (steps, files, dependencies, acceptance, estimate) — per the template above.
   Acceptance includes BLOCKING_RULES guard tests + EDGE rows; estimate tier **L**
   (BE 4–6d / DB 1d / FE-ERP 3–4d / FE-PWA 3–4d / Test 2–3d), risk: shared-service contract churn.
```

> This single card consumes **six** cross-cutting concerns — each as a one-line service call, because they were built in Phase 0. That is the registry paying off.

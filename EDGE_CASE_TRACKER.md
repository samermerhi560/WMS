# Edge-Case Implementation Tracker

> **Purpose.** Master checklist for closing the 25 status / workflow edge-case gaps found in the pre-coding
> audit (2026-06-19). Companion to the analysis report (`edge-case-gap-analysis.html`). Each task carries a
> **detailed plan** and a **live status**; this file is updated as each functionality lands.
>
> **Source of truth:** the repo. Shared anchors (`assets/data.js`, `assets/wireframe.css`, `assets/erp-shell.js`,
> `assets/pwa-shell.js`) are flagged per task. After all tasks: **Cost Estimation (man-days) + DEV-phase plan**
> (see the final section).

## How to read the status
- ❌ **Not started**
- 🟡 **In progress / partial**
- ✅ **Done** — followed by a one-line note on what changed + how it was verified.

## Foundation (data.js) — ✅ DONE & VERIFIED (37/37 node assertions)
All shared helpers / statuses / reason domains / collections / seed for the 25 tasks were added to
`assets/data.js` in one pass so the screen work needs **no further data-layer edits**. New: statuses `disposed`
/ `lost`; `ASN.state` (`cancelled`/`refused`); collections `DB.disposals/rtvs/grns/refusals`; reason domains
`dispose`/`refuse`/`rtv`/`receipt`; helpers `dispatchGuard · validateSerials/expandSerials · pickReject ·
flagCountForMissing · palletLineReject · overflowLocFor/parkToOverflow · sweepExpired/flipExpired ·
coldChainProduct/carrierIsCold · disposeCreate/Approve/Reject · rtvIssue · refuseDelivery/cancelAsn ·
grnCreate/receiptRefSeen/openAsnsForProduct · ordersReserving · currentUser/setCurrentUser/sameActor`; seed
(overflow bins, a damaged plate `LPN-00040`, a pending disposal `DSP-7001`, an open RTV `RTV-7001`).

## Progress summary

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| C1 | Dispatch: audit row + re-validate frozen/expired/status at commit | 🔴 Critical | ✅ Done |
| C2 | Adjust & Repack honour the physical-inventory freeze | 🔴 Critical | ✅ Done |
| F4 | Refuse delivery at the door + ASN void/cancel | 🟠 High | ✅ Done |
| F5 | Disposal / scrap-out of blocked stock (first-class, approval-gated) | 🟠 High | ✅ Done |
| F6 | Return-to-vendor / return-to-client (RTV outbound) | 🟠 High | ✅ Done |
| F7 | In-transit loss / damage / short-receive | 🟠 High | ✅ Done |
| F8 | Damage / missing stock found at pick | 🟠 High | ✅ Done |
| F9 | Block expired stock flowing to `available` (receipt + putaway) | 🟠 High | ✅ Done |
| F10 | Warehouse-full / no-valid-bin overflow at putaway | 🟡 Medium | ✅ Done |
| F3 | Adjust / transfer orphan-allocation warning | 🟡 Medium | ✅ Done |
| F11 | Expiry transition + expired-stock cleanup | 🟡 Medium | ✅ Done |
| F12 | Mixed-pallet LINE damage reject | 🟡 Medium | ✅ Done |
| F13 | Separation of duties on approvals | 🟡 Medium | ✅ Done |
| F14 | Wrong client/site guard on blind & manual receipt | 🟡 Medium | ✅ Done |
| F15 | Serial validation on issue (count + uniqueness) | 🟡 Medium | ✅ Done |
| F16 | Duplicate-receipt guard | 🟡 Medium | ✅ Done |
| F17 | Mis-putaway undo + ERP mis-pick scan guard | 🟡 Medium | ✅ Done |
| F18 | Cancel / release reachable mid-flight | 🟡 Medium | ✅ Done |
| F19 | Receipt condition + reasons master-data driven | ⚪ Low | ✅ Done |
| F20 | Cold-chain carrier mismatch warning | ⚪ Low | ✅ Done |
| F21 | Consignee / carrier re-asserted at ERP dispatch | ⚪ Low | ✅ Done |
| F22 | Over-receipt bound + approval | ⚪ Low | ✅ Done |
| F23 | Hold release needs client sign-off | ⚪ Low | ✅ Done |
| F24 | GRN generated per receipt | ⚪ Low | ✅ Done |
| F2b | Blind receipt ↔ open ASN split-brain warning | ⚪ Low | ✅ Done |

**25 / 25 complete.**

### Verification (how each was checked)
- **Data layer** — `assets/data.js` foundation: **37 node assertions** pass (dispatchGuard, validateSerials, pickReject, palletLineReject, disposeCreate/Approve, refuseDelivery/cancelAsn, grnCreate/receiptRefSeen, sweepExpired, cold-chain, conservation, etc.) + `node --check` clean.
- **Syntax** — independent sweep parsing the inline `<script>` of **all 19 changed/new HTML screens** + `erp-shell.js` + `data.js`: **all parse**.
- **Browser load smoke** (`localhost:8765`, console errors only) — **0 errors** on the new screens (`erp-inv-dispose`, `erp-so-rtv`) and every heavily-edited screen exercised (`erp-gr-receipt`, `erp-so-dispatch`, `erp-inv-transfer`, `erp-inv-status`, `erp-pa-tasks`, `erp-inv-adjust`, `erp-gr-asn`, `pwa-so-pick`, `pwa-gr-receive`, `pwa-pa-putaway`); seeded records (`DSP-7001`, `RTV-7001`) render; new helpers resolve in-page.
- **Remaining QA for the coding phase** — full click-through of every new control's *happy + unhappy path* (e.g. perform an RTV ship, a door refusal, a pallet-line reject end-to-end) is the next manual pass; logic is unit-tested and screens are load-clean.

### Residual minor items (non-blocking, flagged for the build)
- `erp-inv-status.html` keeps a **pre-existing local `ordersReserving`** that shadows the shared helper and omits `partial` orders — F3 (adjust/transfer) correctly uses the global; align the status screen in the build.
- Mixed-pallet: if the **last** open line is fully *rejected* (not placed), the shared "fully put away" banner still shows — cosmetic.
- ERP GRN/refusal/cancel records live in **session memory** (ERP reloads seed `data.js` per page) — deep links resolve within a session; real persistence is a backend concern (same caveat as all ERP mock mutations).

## Channel parity (ERP ↔ PWA) — locked dual-channel rule
Every **floor-operational** action must work on both channels. Status as of this pass:
- **✅ Both channels (floor actions):** C1 dispatch audit/guard · **F4 refuse delivery** *(PWA added 2026-06-19 — `pwa-gr-receive`: refuse from ASN-lines or the form → REF-… recorded, no stock, ASN→refused; verified live, 0 console errors)* · F7 transfer-**receive** condition/short · F8 damage/not-found at pick · F9 expired block · F10 overflow-park · F12 pallet-line reject · F14 wrong-client · F15 serials · F16 dup-receipt · F17a move-undo · F19 master reasons · F24 GRN. (PWA pick already had a native scan mis-pick guard ≈ F17b.)
- **🏢 ERP-only by design (back-office — no natural scanner counterpart):** F3 orphan-alloc on adjust · F11 expiry sweep · F13 approval maker-checker (PWA submits, ERP approves) · F18 order cancel/release · F23 hold-release sign-off · C2 freeze-on-adjust/repack (PWA repack already guards freeze; PWA has no adjust screen).
- **✅ PWA floor-mirrors added (2026-06-19 — user chose "mirror all 3"; verified live, 0 console errors):**
  - **F5** `pwa-inv-dispose.html` (NEW) — the floor **raises** a scrap/destroy request (maker-checker: an ERP supervisor approves; no stock leaves until then). Verified: DSP-7002 raised, LPN-00040 unchanged at 40/damaged. *(Built as raise-for-approval rather than execute-after-approve — the natural floor capability, needs no rework of the verified ERP approve; can flip to execute-model if preferred.)*
  - **F6** `pwa-so-rtv.html` (NEW) — the floor **scan-confirms & ships** an ERP-created RTV. Verified: RTV-7001 shipped → LPN-00005 issued 30→0 `dispatched`, `rtv` txn logged.
  - **F7** `pwa-inv-transfer.html` — in-transit **write-off / abandon**. Verified: TRF-8001 → cancelled, LPN-00030 100→0 `lost`, `transfer-loss`+`transfer-cancel` txns.
  - Both new screens wired into `pwa-home.html` tiles (with live badge counts). *(ERP keeps creation/approval; the floor gets the physical-execution step.)*

---

## 🔴 CRITICAL — data-integrity / locked-invariant violations

### [C1] Dispatch: audit row + re-validate frozen/expired/status at commit
**Status:** ✅ Done
**Files:** `erp-so-dispatch.html`, `erp-so-fulfil.html`, `pwa-so-pick.html`, `assets/data.js`.
**Problem.** Classic ERP dispatch / Express commit straight off the saved allocation — **no `logTxn`** (zero
audit trail for back-office shipments) and **no re-check** of frozen/expired/status, so a plate frozen or expired
*after* allocation ships through.
**Plan.** Add a shared `dispatchGuard(allocLines)` helper in `data.js` that re-asserts each allocated LPN is still
present, `available`-ish, non-expired, and not in a `frozen` take; block the commit and name the offending plate if
it fails. Append a `logTxn('dispatch', …)` row per issued LPN on every issue path (classic, Express, PWA classic pick).

### [C2] Adjust & Repack honour the physical-inventory freeze
**Status:** ✅ Done
**Files:** `erp-inv-adjust.html`, `erp-inv-repack.html`, `assets/data.js`.
**Problem.** The locked rule lists *adjustment* among actions a freeze must refuse, but neither screen called
`isLocFrozen`, so a plate inside a `frozen` stock-take could be adjusted / scrapped / repacked — corrupting the count.
**Plan.** Gate `submitAdj`/`approve` (adjust) and `confirmJob` (repack) on `isLocFrozen(lpn.loc)`; block with the
blocking `PHY-…` named. Show a live frozen note on the form.

---

## 🟠 HIGH — real scenarios with no path; business / compliance stakes

### [F4] Refuse delivery at the door + ASN void/cancel
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-gr-asn.html`, `erp-gr-receipt.html`.
**Problem.** No way to turn a truck away: *Damaged* still mints an LPN into quarantine **inside** the WH; and an ASN
that is cancelled / never arrives stays `open` forever (the "Close" button was disabled).
**Plan.** (a) **Refuse delivery** — an action on the Receive screen and the ASN row that records a reasoned refusal
(reason from a new `refuse` reason domain + supplier/carrier + optional photo) and creates **no stock**; logs a
`refuse` txn into `DB.refusals[]`. (b) **ASN lifecycle** — add `asn.state` override (`cancelled` | `refused`);
`asnStatus()` returns it; add Cancel/Void + Refuse actions and a Cancelled/Refused filter on the ASN list.

### [F5] Disposal / scrap-out of blocked stock (first-class, approval-gated)
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-shell.js` (nav), **NEW** `erp-inv-dispose.html`, `erp-inv-status.html`.
**Problem.** Quarantine/damaged/expired stock had no first-class destruction flow — only a generic, self-approvable
qty-decrease in Adjustments.
**Plan.** New **Inventory → Disposal** screen: pick a blocked (or expired) plate, capture method (scrap / destroy /
write-off) + reason (`dispose` domain) + qty, **approval-gated**; on approve sets `status:'disposed'`, `qty:0`, logs
a `dispose` txn. Add a `⋮ → Dispose / scrap` deep link from Stock Status. New `DB.disposals[]`, `disposed` status,
`nextDspId`, `dispose` reason domain.

### [F6] Return-to-vendor / return-to-client (RTV outbound)
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-shell.js` (nav), **NEW** `erp-so-rtv.html`.
**Problem.** Every outbound ships to a consignee; no way to send stock **back to a supplier or the owning client**.
**Plan.** New **Stock-Out → Return to vendor** screen: destination = a Supplier or the owning Client; add lines (blocked
or available plates); reason; ship → issues stock (`status:'dispatched'`, `rtv` txn) + a printable RTV note. New
`DB.rtvs[]`, `nextRtvId`, `rtv` txn type.

### [F7] In-transit loss / damage / short-receive
**Status:** ✅ Done
**Files:** `erp-inv-transfer.html`, `pwa-inv-transfer.html`, `assets/data.js`.
**Problem.** Once shipped a transfer can't be cancelled (draft-only) and receive forces the full qty to `available` —
no short, no damaged, no write-off for a lost load.
**Plan.** (a) Receive: editable received-qty per line + a condition (good→available / damaged→quarantine / short→the
shortfall is written off as `lost`). (b) In-transit **write-off / abandon** action → remaining in-transit plates go to
`lost` (qty 0) with reason; status `cancelled`; `transfer-cancel` txn. Add `lost` status + `transfer-cancel` txn type.

### [F8] Damage / missing stock found at pick
**Status:** ✅ Done
**Files:** `erp-so-dispatch.html`, `erp-so-fulfil.html`, `pwa-so-pick.html`, `assets/data.js`.
**Problem.** A picker hitting a damaged unit or an empty bin can only silently short-pick — no reject-to-quarantine,
no "not found → investigate".
**Plan.** Per pick line add **Report damage** (peels the bad qty to quarantine via a new `pickReject` helper, mirrors
`putawayReject`; logs `status` txn) and **Not found** (records the shortfall and auto-raises a `pending-approval` cycle
count on the bin). Both reduce the picked qty and feed the existing short-pick / back-order logic.

### [F9] Block expired stock flowing to `available` (receipt + putaway)
**Status:** ✅ Done
**Files:** `erp-gr-receipt.html`, `pwa-gr-receive.html`, `erp-pa-tasks.html`, `pwa-pa-putaway.html`.
**Problem.** Expiry was a soft warning only — an already-expired lot could be received `Good` and putaway to sellable
stock.
**Plan.** Receive: an expired lot **cannot be condition=Good** — force Hold/Damaged/Refuse (hard validation). Putaway:
an expired `to-putaway` plate is flagged and **blocked from store-to-available**, routed via the damage/quarantine
reject path instead.

---

## 🟡 MEDIUM

### [F10] Warehouse-full / no-valid-bin overflow at putaway
**Status:** ✅ Done
**Files:** `erp-pa-tasks.html`, `pwa-pa-putaway.html`, `assets/data.js`.
**Problem.** When every candidate bin is excluded the operator is stuck with no legitimate action.
**Plan.** When the ranked list is empty, offer **"Park to overflow / staging"** (a designated overflow `wait/put` bin
via `overflowLocFor(site)`) — keeps the plate `to-putaway` at an explicit overflow location with a flag + txn, so it's
visibly parked rather than silently stuck.

### [F3] Adjust / transfer orphan-allocation warning
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-inv-adjust.html`, `erp-inv-transfer.html`.
**Problem.** Adjust could decrease a plate below its reserved qty, and transfer could ship a reserved plate, with no
warning — orphaning an open order's allocation.
**Plan.** Promote `ordersReserving(lpnId)` to a shared `data.js` helper; warn (and require confirm) in `submitAdj`
(when the result < reserved) and in transfer add-line / ship when the plate is reserved.

### [F11] Expiry transition + expired-stock cleanup
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-inv-status.html`.
**Problem.** Nothing flips `available→expired`; relies on a manual button + the derived filter, and expired plates had
no cleanup path.
**Plan.** Add a `sweepExpired(site)` helper + a **"Flag expired now"** batch action on Stock Status that flips
past-expiry `available` plates to `expired` (reason-coded, `status` txn) and links them to Disposal (F5).

### [F12] Mixed-pallet LINE damage reject
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-pa-tasks.html`, `pwa-pa-putaway.html`.
**Problem.** The damage-reject control is suppressed for mixed-pallet lines.
**Plan.** Add `palletLineReject(palletId, lineIdx, qty, opts)` (mirrors `putawayReject` but for a pallet line: peels
the bad qty to a blocked child LPN, decrements the pallet line, closes the pallet when empty). Enable the reject panel
for pallet lines on both screens.

### [F13] Separation of duties on approvals
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-inv-adjust.html`, `erp-inv-count.html`, `erp-inv-dispose.html`.
**Problem.** Approval never checked approver ≠ raiser — a user could approve their own request.
**Plan.** Introduce a mock current user (`DB.currentUser`); block Approve when `currentUser === record.by`/`countedBy`,
with an explanatory note. Applies to adjustments, counts, disposals.

### [F14] Wrong client/site guard on blind & manual receipt
**Status:** ✅ Done
**Files:** `erp-gr-receipt.html`, `pwa-gr-receive.html`.
**Problem.** Only the ASN-scan path guarded client/site; blind & manual receipt trusted the dropdowns.
**Plan.** On confirm, validate each received product belongs to the header client; block (or confirm-gate) when a
scanned product/barcode resolves to a different client.

### [F15] Serial validation on issue (count + uniqueness)
**Status:** ✅ Done
**Files:** `erp-so-dispatch.html`, `erp-so-fulfil.html`, `pwa-so-pick.html`, `pwa-so-dispatch.html`, `assets/data.js`.
**Problem.** Serial capture was presence-only — count not enforced = picked qty, duplicates not caught.
**Plan.** Add `validateSerials(raw, qty)` → checks non-empty, **count === picked qty**, **no duplicates**; block
issue on failure across all four issue paths.

### [F16] Duplicate-receipt guard
**Status:** ✅ Done
**Files:** `erp-gr-receipt.html`, `pwa-gr-receive.html`, `assets/data.js`.
**Problem.** No idempotency / delivery-note dedupe; the same delivery could be received twice.
**Plan.** Add a **supplier delivery-note ref** field on receipt; warn (confirm-gated) when the same ref was already
received, and warn when receiving against an already-`closed` ASN.

### [F17] Mis-putaway undo + ERP mis-pick scan guard
**Status:** ✅ Done
**Files:** `erp-pa-tasks.html`, `erp-so-dispatch.html`.
**Problem.** No undo for a wrong-bin putaway (only a separate unlinked Move); ERP dispatch picker had no mis-pick guard.
**Plan.** (a) On the Putaway **Completed** row add **"Wrong bin? Move ▸"** deep-linking the move screen pre-filled with
the plate. (b) ERP dispatch: validate the typed/scanned location against the allocated `from` and warn on mismatch;
record an audited override flag in the txn note.

### [F18] Cancel / release reachable mid-flight
**Status:** ✅ Done
**Files:** `erp-so-alloc.html`, `erp-so-dispatch.html`, `erp-so-fulfil.html`.
**Problem.** Release/cancel existed only on the Orders list, not on the detail screens where the operator sits.
**Plan.** Add **Release allocation** + **Cancel order** actions to the Allocation, Dispatch and Express headers (reuse
the Orders-list logic), returning to the list afterward.

---

## ⚪ LOW — niche / polish / mock artifacts

### [F19] Receipt condition + reasons master-data driven
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-gr-receipt.html`, `pwa-gr-receive.html`.
**Problem.** Condition was a fixed 3-way with a hardcoded reason list; temperature-excursion / seal-broken weren't
selectable.
**Plan.** Drive the receipt reason dropdown from a new `receipt` reason domain (groups: hold / damaged / refuse) incl.
**temperature excursion** and **seal broken / security**, mirroring the Inspection screen's `reasonsFor` model.

### [F20] Cold-chain carrier mismatch warning
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-so-dispatch.html`, `erp-so-fulfil.html`, `pwa-so-pick.html`.
**Problem.** No check that a 2–8 °C product ships on a cold-chain carrier.
**Plan.** Add `coldChainProduct(id)` (category/sub = cold) + `carrierIsCold(id)` (mode contains °C); warn (confirm-gated)
on dispatch when a cold product is loaded on a non-cold carrier.

### [F21] Consignee / carrier re-asserted at ERP dispatch
**Status:** ✅ Done
**Files:** `erp-so-dispatch.html`, `erp-so-fulfil.html`.
**Problem.** Carrier was mandatory on PWA but optional in ERP; consignee gated only at order creation.
**Plan.** Require a carrier and a non-empty `shipTo` at the ERP dispatch/Express commit (parity with PWA).

### [F22] Over-receipt bound + approval
**Status:** ✅ Done
**Files:** `erp-gr-receipt.html`, `pwa-gr-receive.html`.
**Problem.** Over-ASN receipt needed only a reason — no ceiling/tolerance/approval.
**Plan.** Flag an over-receipt beyond a tolerance (>10 % of the remainder) and require an explicit supervisor-confirm
checkbox before it can be committed.

### [F23] Hold release needs client sign-off
**Status:** ✅ Done
**Files:** `erp-inv-status.html`.
**Problem.** Any user could release a commercial/legal hold with just a reason.
**Plan.** Releasing a `hold` plate to `available` requires an extra **client-authorization reference** field (not
required for quarantine release).

### [F24] GRN generated per receipt
**Status:** ✅ Done
**Files:** `assets/data.js`, `erp-gr-receipt.html`, `erp-gr-grn.html`.
**Problem.** GRN list was a static array; a fresh receipt produced no GRN record.
**Plan.** Mint a `DB.grns[]` record on every confirmed receipt (`nextGrnId`, one per physical receipt) and drive the
GRN list/detail dynamically.

### [F2b] Blind receipt ↔ open ASN split-brain warning
**Status:** ✅ Done
**Files:** `erp-gr-receipt.html`, `pwa-gr-receive.html`.
**Problem.** A blind receipt never reconciled against a matching open ASN.
**Plan.** On a blind receipt, if the product has an open ASN for this client/site, surface **"An open ASN exists for
this product — receive against it?"** with a one-tap switch.

---

## ▶ NEXT MILESTONE (after implementation) — Cost Estimation + DEV Phase

Once every task above is ✅, the agreed next deliverable is:
1. **Cost estimation in man-days** — per module / per feature, for the real (coding-phase) build, derived from these
   mockups + the locked specs.
2. **DEV-phase plan** — architecture, data model, APIs, then phase-by-phase build specs (Phase 3 in
   `docs/00_Project_Overview.md`).

These mock implementations double as the **executable reference** for that estimate — each closed gap is a scoped,
demonstrated unit of work.

---
*Anchors touched across this program: `assets/data.js` (helpers/statuses/reasons/collections/seed), `assets/erp-shell.js`
(nav: Disposal, Return-to-vendor), plus the screen files listed per task. `wireframe.css` reused — no new theme.*

# Verification / Blocking Rules — LOCKED INVARIANT

> Cross-cutting invariant for **every action that mutates stock**, across all sections (02–05) and both
> channels (ERP + PWA). Enforced in the mocks today and **mandatory server-side in the coding phase** (not just
> client-side). Helper functions are in `DATA_MODEL.md`; live build state is in `mockups/MOCKUP_STATUS.md`.

## Core rule
Every action that mutates stock MUST first verify its business-logic preconditions; if any fail, the action is
**blocked** (not silently coerced). **No screen ever writes inconsistent data.** This is a hard invariant, not
per-screen polish.

## Cross-cutting guards (apply everywhere)
- **Validate at COMMIT time against LIVE stock**, not just at form-open — re-read the LPN and re-check
  preconditions inside the confirm/approve handler (state can change between opening a form and confirming).
- **Conservation of quantity:** any split/move/transfer/repack must leave `Σ(outputs) + remainder == source`.
  Never mint units from nothing or lose them. Partial ops mint a child LPN and decrement the source.
- **Genealogy is preserved/carried** (lot/expiry/serial/owning client) on every minted/relocated plate, unless an
  approval-gated *Attribute Correction* explicitly changes it.
- **Every committed mutation appends a `DB.txns[]` audit row** via `logTxn()` (type, lpn, qty delta, from→to,
  user, ref, reason/note). An action that writes no audit row is a bug.
- **Reason-coded + (where required) approval-gated:** status changes, adjustments and corrections require a
  reason; quantity adjustments + attribute corrections require **supervisor approval** (mutation applied only on
  Approve; Reject applies nothing; approval handlers re-assert `status==='pending'` before posting).
- **Deep-link / pre-fill is convenience only — it NEVER bypasses a screen's own guards.** Pre-selection is
  validated against live stock (on-hand only; skip `in-transit`; repack adopts only `available` sources); an
  ineligible target opens the form **unfilled** rather than committing a wrong mutation.

## Per-operation blocking rules (enforced in the mocks)

| Operation | Must verify before commit (else BLOCK) |
|---|---|
| **Stock Status — status change** | Reason selected (audit). Skip system-set states (`to-putaway`/`to-inspect`/`in-transit`/`dispatched` — not manually changeable) and report skipped count. No-op if already at target. **Release → `available` requires explicit confirm** (higher-risk direction). **Blocking a plate reserved on an open order warns + lists the orders** (would orphan the allocation). |
| **Allocation / Stock-Out** | Allocate only `available`, **non-expired**, **not in a `frozen` stock-take**, with **free (un-reserved)** qty (`isAllocatable` / `lpnAvail` / `isLocFrozen`). **FEFO/FIFO candidate lists exclude past-expiry + frozen-scope** stock (the latter surfaced as an explained short). Serial-tracked lines must capture serials before dispatch — enforced on **both** classic Pick/Dispatch and Express Fulfil. Short / over / blocked stock **pauses for review**. Remainder follows the per-client back-order / short-close policy. **De-allocation** (release → `open`) and **order/line cancellation** (`cancelled`; line excluded from totals + queues) free reservations. |
| **Adjustments (qty)** | Plate selected · qty `> 0` · **decrease can't exceed on-hand** · reason required · approval gate. |
| **Corrections (attributes)** | At least one field actually changed · reason required · flag-driven fields only (lot/expiry/serial when tracked) · approval gate. |
| **Move (intra-site)** | Plate + destination required · destination **same site, different location** · qty `> 0` and `≤ plate qty` · can't move `in-transit` stock · **source or destination must not be in a `frozen` stock-take** · destination passes the **shared capacity + segregation** checks (`binCapacityForAdd`/`binSegregationOk`, live note + commit block) · partial → split (remainder stays). |
| **Transfer order (inter-site)** | ≥1 line · **origin ≠ destination** · only `available` plates at origin · line qty `≤ plate qty`. **Ship** only from `draft` (partial → split child to `in-transit`); **refused if a source plate is in a `frozen` stock-take**. **Receive** only from `in-transit`, each line needs a destination at the target that passes **capacity + segregation + not-frozen** (same shared checks as Putaway). **Cancel** only from `draft`. |
| **Count Approval** | Approve/Reject only when `pending-approval`. **Bulk-approve gated by variance tolerance on the largest plate-level Δ** (offsetting errors can't net to 0 and slip through); out-of-tolerance flagged ⚠ review (individual only). Blind count: every plate must have a count before submit. **Found** lines (no system LPN → minted on approve via `nextLpnId`) need a product + qty>0; **missing** = counted 0 (plate zeroed). Approve corrects to counted qty; Reject leaves stock unchanged. |
| **Physical Inventory** | **Freeze** blocks putaway / moves / allocation across the scope. **Post gated until every location is counted**; post corrects to counted qty then unfreezes (`closed`). **Frozen-scope is enforced cross-screen:** Putaway, Move, Transfer-ship and Allocation call `isLocFrozen`/`frozenTakeFor` and REFUSE a target location inside an active `frozen` stock-take, naming the blocking `PHY-…`. Only the `frozen` state blocks — `open` and `closed` leave stock fully movable. *(Both seed takes start `open` so the shared demo stock isn't smothered — freeze one live on `erp-inv-physical.html` to see the cross-screen block.)* A stock-take location may also carry FOUND lines (no system LPN → minted on post) and MISSING (counted 0 → zeroed). **No overlapping active takes:** creating a stock-take is BLOCKED if any of its locations is already inside an `open`/`frozen` take at the same site (`closed` never conflicts; disjoint Areas are fine). |
| **Repack / Split / Merge / Re-kit** | ≥1 source · only `available`, qty `> 0` sources · **Split:** outputs `≤` source (remainder stays) · **Merge:** ≥2 plates, **same product + lot + expiry only** · **Re-kit:** every output needs a qty · balance (in/out conservation) guard; confirm consumes sources (`status:'consumed'`) and mints outputs carrying genealogy. |
| **Returns / Put-back** | Disposition required per line. **Restock → bin (direct):** `available` at the chosen bin — the bin must pass the **same capacity + client–area segregation checks as Putaway** (shared `binCapacityForAdd`/`binSegregationOk`); over-capacity/segregation-violating bins are blocked (live note + process-time guard). **Restock → via Putaway:** minted as `to-putaway` at inbound staging → enters the **directed-Putaway queue** (slotting + capacity + segregation applied there, *not* bypassed). **Quarantine/Damaged:** routed to the quarantine location, **blocked from allocation**. Genealogy carried onto every minted plate. *(Putaway and Put-back are otherwise separate flows — a put-back only appears in Putaway when the operator picks the via-Putaway disposition.)* |

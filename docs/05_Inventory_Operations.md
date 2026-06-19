# Section 05 — Inventory Operations

> Keep stock accurate and in the right place: moves, transfers, adjustments, counts, and status. **Channel:** ERP + PWA — every inventory action (move, transfer, count, adjust) works on both; ERP is a full manual fallback when scanners are off. See `00_Project_Overview.md`.

## Purpose
Everything that changes stock position or quantity outside of normal inbound/outbound: relocating stock within a site, transferring it between sites, correcting quantities, counting, and blocking/unblocking stock. All actions preserve lot/expiry/serial genealogy and are fully audited.

## In Scope (v1)
- **Intra-site move / relocation** — PWA: scan stock/LPN, scan destination location (same site), confirm.
- **Inter-site transfer** — ERP transfer order from Site A → Site B; ship out of A (stock → in-transit), receive into B (in-transit → available).
- **Stock adjustments** — quantity correction with **reason codes** (correction, damage, loss); audited, with approval.
- **Stock attribute corrections** *(added — closes the Receive/Putaway mistake gap)* — correct an LPN's **identity/genealogy** without changing quantity: wrong **lot**, **expiry**, **serial**, **product**, or **owning client** keyed at receipt. Reason-coded, approval-gated, audited (before→after captured). Distinct from a quantity adjustment; both live on the **Adjustments & Corrections** screen.
- **Cycle counting** — scan-based count **sheets** spanning one or many locations; capture counted qty per plate; system computes variance; supervisor approves (bulk, tolerance-gated) and stock is corrected. Sheets capture **found** stock (a plate physically present with **no system LPN** → a new plate is minted on approval) and **missing** stock (counted 0 → the plate is zeroed) — the two commonest real discrepancies.
- **Stock status management** — available / quarantine / damaged / hold; blocked statuses are excluded from outbound allocation.
- **Full physical inventory** — site (or Storage Area) **freeze**, count every location (incl. **found** plates with no system record, minted on post, and **missing** plates zeroed), reconcile all variances, then unfreeze.
- **Repack / split / merge / re-kit** — change a product's packaging/UoM (e.g., split a pallet into cartons), **split** one LPN into several or **merge/consolidate** partial LPNs of the same product/lot, or assemble/disassemble kits; source stock is consumed and new unit(s)/LPN(s) created, preserving lot/expiry/serial genealogy.
- **Returns / put-back** *(added)* — stock re-entering inventory: **put-back** of over-picked/unused stock, and **post-dispatch customer returns** → re-inspect → restock (→ available) or scrap (→ damaged/quarantine). Genealogy preserved; audited.

## Out of Scope (v2 backlog)
BOM-driven assembly / kitting orders (beyond simple repack/re-kit). Full RMA workflow with credit/billing (mock covers only the physical stock re-entry). **Automatic count-task generation** (scheduler / ABC-class cadence) — v1 counts are created manually as count sheets (`erp-inv-count.html` → New count) or from the PWA; auto-generation comes later.

## Key Concepts / Entities
- **Stock Move** — location → location within a site.
- **Transfer Order** — header + lines, A → B, with an **in-transit** state.
- **Adjustment** — quantity delta + reason, audited.
- **Count task & Variance** — counted vs system, pending approval.
- **Stock Status** — available / quarantine / damaged / hold.
- **Physical Inventory** — a freeze + full-count + reconcile event over a site or Storage Area.
- **Repack / Re-kit** — converts source stock (consumed) into output unit(s)/LPN(s) (created).

## Process Flows
- **Move:** PWA scan LPN/stock → scan destination location → confirm → stock relocated.
- **Transfer:** ERP create transfer (product/lot/serial/qty, A → B) → PWA ship from A (stock → in-transit) → PWA receive at B (in-transit → available at a location).
- **Adjust:** select stock → choose reason → enter delta → submit → approval → posted.
- **Count:** generate count tasks for locations → PWA count (scan location, scan products, enter qty/lot/serial) → variance computed → supervisor approves → stock corrected.
- **Physical inventory:** ERP initiate stock-take for a site/Storage Area → **freeze** the scope (block moves/in/out) → count all locations (PWA scan or ERP entry) → review all variances → reconcile/post → **unfreeze**.
- **Repack / re-kit:** select source stock/LPN → define output (new packaging/UoM, or kit components + qty) → confirm → source consumed, output LPN(s) created with carried-over lot/expiry/serial.

## Business Rules
- Every movement, adjustment, and count posting is written to the transaction history (audit).
- Blocked statuses (quarantine/damaged/hold) prevent outbound allocation.
- Transfers preserve lot/expiry/serial genealogy across sites.
- Moves are within a single site; cross-site movement always goes through a transfer order.
- A Move or Transfer may move a **full or partial** plate: a partial quantity **auto-splits** — a child LPN (genealogy preserved) carries the moved/transferred qty and the remainder stays on the source. (Equivalent to a Repack/Split followed by the move, done inline.)
- **Every bin that receives stock runs the same checks.** The intra-site **Move** destination, the inter-site **Transfer-receive** destination, **Putaway**, and **Returns direct-restock** all enforce the shared **capacity** (weight + units + LPN slots) and **client–area segregation** guards (`binCapacityForAdd` / `binSegregationOk`) — an over-capacity or segregation-violating bin is blocked at commit (and flagged live). The single shared rule-set means the paths can't diverge.
- During a physical-inventory **freeze**, the frozen scope blocks inbound putaway, moves, transfer-ship and outbound allocation until unfrozen. **This is enforced cross-screen** (`isLocFrozen` / `frozenTakeFor`): Putaway, Move, Transfer-ship and Allocation refuse any location inside an active `frozen` take and name the blocking `PHY-…`. Only the `frozen` state blocks — `open` and `closed` takes leave stock fully movable.
- Repack / re-kit conserves traceability — output inherits the lot/expiry/serial of its source.
- Every inventory action is available on both PWA (scan) and ERP (manual entry).
- **Count approval — bulk with a tolerance gate.** Count sheets can be approved/rejected **en masse** from the Pending list. Eligibility for bulk approval is governed by a configurable **variance tolerance** (default **0** = exact matches only), evaluated on the sheet's **largest plate-level** variance so offsetting errors can't net to zero and slip through. Sheets beyond tolerance are **not** bulk-selectable — they are flagged for **individual review**. (A hard "approve only if variance = 0" rule is explicitly *not* used — it would defeat the purpose of counting, which is to correct discrepancies.) *Real-build follow-ups:* recount-before-approve for large variances, reason codes on the resulting adjustment, and separation-of-duties / approval limits by variance value or ABC class.
- **History lists are bounded for scale.** Every list/tab that can grow without limit (Posted/Rejected/All adjustments, Approved/Rejected/All counts, Closed/All physicals, Closed/All returns, Transfer orders, Moves, Repack jobs) requires a **mandatory "Since date"** (default: last 30 days) that caps how far back the query loads. The field is **absent on pending/active tabs** (Pending, Pending-approval, Open, Frozen) — outstanding work must always be fully visible — and **non-terminal rows always show even on an "All" tab** (they bypass the date gate). *Stock Status is exempt:* it is a current-state view (size bounded by live inventory, filtered by site/product/status); its scale protection is server-side paging, not a date.

## Screens (for mockup phase)
- **ERP (7 screens):** `erp-inv-status.html` **stock status** (block/release, bulk, allocation-excluded flag) ✅ built · `erp-inv-adjust.html` **Adjustments & Corrections** (qty + attribute, approval-gated) ✅ built · `erp-inv-transfer.html` **Transfers** (intra-site move + inter-site transfer, in-transit) ✅ built · `erp-inv-count.html` **count variance approval** + **multi-location "count sheet" entry** (one sheet spans many bins — add a bin or a whole Area, keyboard-fast inline counts, blind-count toggle; ERP parity with the PWA scan) ✅ built · `erp-inv-physical.html` **physical inventory** (freeze / reconcile / unfreeze) ✅ built · `erp-inv-repack.html` **Repack / Split / Merge / Re-kit** ✅ built · `erp-inv-returns.html` **Returns / put-back** ✅ built. *(All 7 ERP screens complete.)*
- **PWA (6 screens — all built):** `pwa-inv-move.html` **Move** (scan plate → scan destination → confirm; partial **split** mints a child LPN; whole keeps id+status; reuses Putaway's ranked-bin block + the shared **frozen / capacity / segregation** guards; writes `MOV-…` + `move` txn) ✅ built · `pwa-inv-count.html` **Count** (scan a storage bin → its plates load prefilled at system qty; key counts, tap **0** = missing, scan an unlisted item = **found**; **blind-count** toggle; one sheet spans many bins → submit a single `pending-approval` count sheet the supervisor approves on the ERP) ✅ built · `pwa-inv-transfer.html` **Transfers** (the floor side of inter-site transfers; creation stays in the ERP) — tabs **To ship / To receive / Done**; **ship** scan-confirms each plate (mis-ship guard + override) → in-transit (whole plate or **partial child split**, frozen-source guard) + `transfer-ship` txn; **receive** scans/picks a destination bin at the to-site (**capacity + segregation + freeze** checked) → available + site reassigned + `transfer-receive` txn ✅ built · `pwa-inv-physical.html` **Physical inventory** (freeze → count → post) — **Freeze re-snapshots system qty at the freeze moment** and locks the scope (the locked freeze rule then blocks Putaway/Move/Transfer/Allocation cross-screen via `isLocFrozen`); scan/tap each in-scope location → count (prefilled system qty, **0** = missing, scan-unlisted = **found**, blind toggle) → save; **Post** corrects every plate, mints found plates, logs `count` txns + unfreezes; **Abandon** unfreezes with no corrections ✅ built · `pwa-inv-repack.html` **Repack / Split / Merge / Re-kit** — scan a source plate, pick a kind (**split** 1→several, remainder stays · **merge** several same product+lot+expiry → 1 · **repack** 1→1 new packaging, qty+genealogy unchanged · **re-kit** free outputs); live **balance** guard gates Confirm; commit consumes sources (split leaves remainder, else `consumed`), mints outputs (repack/merge carry serials), logs a `repack` txn; **frozen-source guard** ✅ built · `pwa-inv-returns.html` **Returns / Put-back** — tabs **To process / Processed**; process an office-created open return **or** build one one-pass (kind put-back/customer; scan product/LPN → qty/lot/reason); per line a **disposition** — Restock → bin (scan/pick a bin, **capacity + segregation** checked) · Via Putaway (→ staging, directed-putaway queue) · Quarantine / Damaged (→ blocked plate); commit mints the LPN(s) at the right status+loc + a `return` txn (mirrors the ERP exactly) ✅ built. *(All 6 PWA Inv-Ops screens complete — the PWA channel is finished.)* **[coding-phase carry-over]** the ERP `erp-inv-repack` lacks the frozen-source guard the PWA enforces — align it (the locked freeze rule should cover repack too).

## Reason codes (configurable)
Every action that posts a reason (status change, quantity adjustment, attribute correction, return disposition) reads its options from the **Reason Codes master** (`erp-md-reasons.html` → `DB.reasonDomains`, Section 01), never hardcoded. Reasons are **linked to context**: status-change reasons are filtered by the **target status** (so only logical choices appear), adjustments by direction, etc. Screens call `reasonsFor(domain, group)`.

## Audit
Every action above writes a row to the transaction log (`DB.txns[]` via `logTxn()`) — see `DATA_MODEL.md`. **Section 06** Transaction History reads it.

## Dependencies
Operates on available stock from Section 03; status blocks affect Section 04; all actions surface in Section 06.

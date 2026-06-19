\# Section 04 — Stock-Out Requests (Outbound)

&#x20;

> Ship clients' goods out, fully or by line item, with full traceability. \*\*Channel:\*\* ERP + PWA — every outbound action works on both; ERP is a full manual fallback when scanners are off. See `00\_Project\_Overview.md`.

&#x20;

\## Purpose

Fulfil a client's request to remove stock from the warehouse — either a \*\*complete stock-out\*\* or a \*\*partial, line-item\*\* exit — by allocating the right lots/serials (FEFO), picking by scan, and confirming dispatch. On dispatch the stock leaves the system and the traceability is recorded as shipped.

&#x20;

\## In Scope (v1)

\- \*\*Outbound request\*\* from a client: \*\*full stock-out\*\* OR \*\*partial by line item\*\* (product + qty).

\- \*\*Stock allocation / reservation\*\* against the request, selecting LPNs/lots.

\- \*\*FEFO / FIFO\*\* allocation (earliest expiry first) when choosing stock.

\- \*\*Picking task list\*\*; PWA scan location + product + qty; \*\*record serial(s) picked\*\*.

\- \*\*Short-pick / discrepancy handling\*\* (less available than requested).

\- \*\*Dispatch confirmation\*\* → stock issued (removed from inventory).

\- \*\*Delivery / dispatch note\*\* for the client.

\- \*\*Order status tracking:\*\* open → allocated → picking → picked → dispatched.

\## Out of Scope (v2 backlog)

Packing step, wave/batch picking, carrier assignment \& shipping labels.

&#x20;

\## Key Concepts / Entities

\- \*\*Outbound Order\*\* — header + lines (or a "full stock-out" instruction).

\- \*\*Allocation / Reservation\*\* — stock committed to the order (specific lots/serials/LPNs).

\- \*\*Pick task\*\* — instruction to pick from a location.

\- \*\*Dispatch / Delivery Note\*\* — confirmation of what shipped.

\## Process Flow

1\. ERP: create an outbound request (client, site, lines: product + qty, or "full stock-out").

2\. System allocates stock by \*\*FEFO\*\* across LPNs/locations and reserves it.

3\. Pick tasks are generated.

4\. PWA: operator scans location → scans product → confirms qty → scans/records serial(s).

5\. Short pick (less available) → discrepancy captured; order re-allocated or partially fulfilled.

6\. Confirm dispatch → stock is issued (removed); lots/serials recorded as shipped.

7\. Delivery note is produced.

\## Business Rules

\- \*\*FEFO\*\* is the default allocation rule (earliest expiry first).

\- Serial(s) must be recorded on issue.

\- Cannot issue more than available; "full stock-out" = allocate all available stock for that client/product/site.

\- All records are client- and site-scoped.

\- Every pick and dispatch is written to the transaction history (audit).

\- Every outbound action is available on both PWA (scan) and ERP (manual entry).

\## Screens (for mockup phase)

\- \*\*ERP:\*\* outbound order list + create; allocation view; manual pick/dispatch confirm (full fallback); delivery note view/print.

\- \*\*PWA:\*\* pick screen (scan location → product → qty → serial), short-pick handling.

\## Dependencies

Consumes available stock from Section 03. Feeds Section 06 (Reports).

## Mockup build status (ERP — COMPLETE)

Built and verified in the mockup phase (see `mockups/MOCKUP_STATUS.md` for the locked decisions):

- `mockups/erp-so-orders.html` — Outbound Orders list + create/edit; full-stock-out toggle.
- `mockups/erp-so-alloc.html` — Allocation engine: **FEFO** (expiry-tracked) / **FIFO** (non-expiry, screen adapts), recommended multi-LPN fill with manual override, reservation-aware availability, short-pick handling.
- `mockups/erp-so-dispatch.html` — Pick / Dispatch (ERP manual fallback for the PWA picker): record picked qty + serials, short-pick discrepancy, confirm dispatch issues stock.
- `mockups/erp-so-note.html` — Delivery Note (document/print) with serial appendix.
- `mockups/erp-so-fulfil.html` — **Express** one-pass flow (auto-allocate → pick → dispatch in a single confirm).

**Two fulfilment paths, offered per action (not a site setting).** Every open/back-ordered order shows **both** actions on the Orders list: **Allocate ›** (classic — separate Allocation → Pick/Dispatch screens, work-queues for separate teams) and **Express fulfil ›** (the one-pass `erp-so-fulfil.html` for an all-in-one operator). The operator picks per order; Express Fulfil opens any open/`partial` order loaded with both steps. **[role — coding phase]** Express Fulfil is intended to be **permission-gated** (an "Express fulfilment" right; separate-team sites won't grant it, so their staff see only *Allocate*) — documented now, no role code in the mock. Serial-tracked lines and short/blocked stock always pause for review either way. The PWA sweep mirrors this (separate Pick/Load tasks vs a single Fulfil flow). *(An earlier per-site `fulfilmentMode` / per-order `modeOverride` mechanism was removed in favour of this per-action model.)*

**Data model:** `Outbound` extended with `ref`, `created`, `fullStockOut`, the full `open→allocated→picking→picked→dispatched` status flow, and per-line `alloc[]` (`{lpn,lot,expiry,from,qty,picked,serials}`). Allocation is a reservation on the order line; dispatch issues the stock (LPN qty decremented). See `docs/DATA_MODEL.md` → Outbound. Helpers added to `data.js`: `outReserved`, `lpnAvail`, `outboundCandidates`, `fefoAllocate`, `outTotals`.

**Decision (this build):** the allocation screen is **product-adaptive** — because most products won't track expiry, the FEFO/expiry UI (lot + expiry columns, expiry warnings) renders only when the product's expiry flag is on; otherwise it presents a simpler FIFO allocation. Consistent with the flag-driven Lot/Expiry/Serial rule used across the system.

**Remainder handling (partial allocation / partial fulfilment).** Driven by `client.allowBackorder` (seed: ACME short-close, GLBX back-order). A dispatch that ships less than ordered either **back-orders** the shortfall — order → `partial`, the remaining qty (`lineRemaining` = ordered − `line.shipped`) re-enters Allocation/Express and ships on a later delivery note — or **short-closes** it — order → `dispatched`, `shortClosed=true`, remainder cancelled. History lives in `order.shipments[]` (immutable; one Delivery Note per shipment). Allocation and Express always work on the remaining qty; `partial` orders re-appear in their worklists. Set on the Clients master. This realises the spec's *"order re-allocated or partially fulfilled"* and adds `partial` to the status set.

**Ship-to consignee + carrier (added pre-PWA).** An outbound order carries a **ship-to consignee** (`Outbound.shipTo` → a client delivery point in `DB.consignees`) — a 3PL ships a client's goods to the client's *customers*, **not** to the client itself (the client owns the stock; the consignee receives it). The Orders screen has a **Ship-to** picker (filtered to the order's client) + column; **Pick/Dispatch** and **Express Fulfil** capture a **carrier** (`DB.carriers`) onto the shipment; the **delivery note** prints three distinct blocks — *ship-to (consignee)*, *stock owner (client)*, and *carrier*. Masters live in Section 01 (`erp-md-consignees.html`, `erp-md-partners.html`).

**De-allocation + cancellation (added pre-PWA).** **Release allocation** clears an allocated order's reservations and returns it to `open` (re-enters the work queues). **Cancel order** voids it (status **`cancelled`**, reservations freed) — a fully `dispatched` order can't be cancelled; a `partial` order cancels only its un-shipped remainder. **Cancel line** voids a single line (`line.cancelled`) — excluded from `outTotals`/`outboundComplete` and skipped on Allocation / Pick-Dispatch / Express Fulfil. Adds the `cancelled` status + a Cancelled tab/filter on the Orders list.

**Serial-guard parity.** Classic **Pick/Dispatch** now enforces the same serial-completeness guard as Express Fulfil — a serial-tracked line cannot be dispatched with its serials blank (realises the rule *"serials recorded on issue"*).

**PWA Ad-hoc / emergency dispatch (built — `mockups/pwa-so-dispatch.html`).** The floor's controlled **outbound origination** path — the mirror of *blind receipt* — for the rare *"PC is off / customer truck waiting, no ERP order exists"* case. Today the PWA can only pick an ERP-created order; this adds the missing case **on purpose-built rails, not free-form blind shipping**. Inbound is permissive (capture what physically arrived); outbound is *authorized-then-executed* (an external commitment, hard to reverse) and in a 3PL the operator owns neither the goods nor the consignee — so floor-initiated shipping carries a **higher** bar, not a lower one. The screen forces the minimum governance an outbound needs, then reuses the proven pick + `erp-so-fulfil` commit logic: **(1) governance gate** — mandatory **ship-to consignee** (`consigneesFor`, client-scoped; blocks if the client has none), **manual reference**, **reason** (new master-data domain `dispatch` in `DB.reasonDomains` — *Customer collection — no ERP order*, *ERP/system unavailable*, *Emergency*, *Phone/email order — key later*, *Sales order not yet in system*), and **operator** (audit stamp); **(2) build + pick** — scan a **product** (FEFO/FIFO auto-allocate via the same `outboundCandidates` a normal pick uses) **or a specific LPN** ("grab this pallet"), set qty, then the **identical scan-confirm pick sub-flow** as `pwa-so-pick` (scan bin → scan LPN/unit → qty → **serials where the product tracks them**); a `freeForWork` guard prevents allocating a plate twice across lines; **(3) load & dispatch** — carrier + proof-of-load photo/note → one commit **creates the outbound order inline** (`nextOutId` → a normal `OUT-…`, flagged **`adhoc:true`**, **`approval:'pending'`**, with `reason` + `by`), **issues the stock** (decrements LPNs, writes a `dispatch` `logTxn`), writes a real **delivery note** (`DN-…`, also `adhoc:true`) and posts **`dispatched`**. Because an ad-hoc dispatch *documents exactly what left the building*, the order's line qty == shipped (complete by construction — **no back-order math**). **Enforced guards mirrored:** frozen-scope and expired plates are excluded (`outboundCandidates` for the product path; explicit checks on the direct-LPN path), wrong-client/site plates refused, and the **serial-on-issue** guard blocks dispatch of a serial-tracked line with blank serials. **Role-gated** like Express Fulfil (shown to all in the mock; an "Ad-hoc dispatch" right in the build — separate-team sites won't grant it) and **flagged for back-office approval after the fact** (the inverse of reconciling a blind receipt against its PO) — surfaced on the PWA done screen; **[coding phase]** an ERP-side review queue / badge for the `approval:'pending'` flag (e.g. on `erp-so-orders` / `erp-so-note`) is a flagged carry-over (the data is stamped, the ERP screen was not touched this pass). *(Non-customer removals — samples / QA / scrap / internal — stay on the adjustment-out path, **not** here.)* `data.js` anchor: `dispatch` reason domain (renders automatically in `erp-md-reasons.html`, which is generic over `DB.reasonDomains`) + `nextOutId()`; no shell/CSS change. Discovery: a home tile + a "No ERP order? ＋ Ad-hoc dispatch" link on the `pwa-so-pick` To-pick list. Verified in-browser (full happy path → `OUT-7105` / `DN-7105-1`, stock issued with conservation, cross-screen persistence into Pick/Dispatch → Dispatched, and the empty-gate / wrong-client / expired-plate / already-added guards; 0 console errors) + a 22-assertion node round-trip.

**PWA Pick / Dispatch (built — `mockups/pwa-so-pick.html`).** The floor-operator outbound flow, scan-driven and aligned to the ERP. One guided pass per order: **pick list** (orders to fulfil at the operator's client+site — `open`/`allocated`/`partial`/`picking`/`picked`) → tap/scan an order → per-line **pick** (scan the bin, then the LPN/product to confirm; quantity picked with **short-pick**; **serials** captured for serial-tracked lines, prefilled off the unit + required) → **Load & dispatch** (carrier + proof-of-load photo + dispatch note) → **issue** (decrement LPNs, `dispatched` when emptied) + **delivery note** (`order.shipments[]`, id `DN-…`). It **honours an existing ERP allocation** (`line.alloc[]` = the pick list from `erp-so-alloc.html`) when present, else **auto-allocates FEFO/FIFO** the remaining qty (so it serves both the classic and Express paths); the order view labels which it is — **"reserved by the office"** (pre-allocated) vs **"auto-allocated FEFO"** (open order) — so the two cases read as meaningfully different, not just different badges. The commit is identical to `erp-so-fulfil.confirmFulfil` (same `outboundComplete` / `clientAllowsBackorder` remainder logic → **back-order** `partial` or **short-close**), so PWA-issued shipments render in `erp-so-note.html`. **Scan is the mis-pick guard:** "Confirm pick" is **disabled until both the bin and the LPN/product are confirmed** (scan or tap-from-list), with an audited **manual override** for the can't-scan case. **To pick / Dispatched tabs** (mirrors the Putaway *Completed* tab) — *Dispatched* lists the delivery notes (`order.shipments[]`) for the site/client, tappable to a read-only note detail (lines, serials, carrier, outcome). Mirrors the locked rules (serial-on-issue guard; FEFO + expiry/frozen exclusion via `outboundCandidates`). **No `data.js` change** — reuses the Section-04 helpers. Verified in-browser (allocated full pick, serial pick + guard, short-pick → short-close, back-order, scan-gate + override, Dispatched-tab note view; 0 console errors).


# Section 02 — Goods Reception (Inbound)

> Bring clients' goods into the warehouse, captured and labelled. **Channel:** ERP + PWA — every receiving action works on both; ERP is a full manual fallback when scanners are off. See `00_Project_Overview.md`.

## Purpose
Record the physical arrival of client-owned goods at a site, capture full traceability (lot/expiry/serial), put them onto license plates, and confirm receipt back to the client. Received stock is held as "to putaway" — it is **not yet available** until Section 03 confirms storage.

## In Scope (v1)
- **Inbound order / ASN** created in ERP: client + site + optional **supplier** (from the Supplier master, Section 01) + expected lines (product, qty, UoM).
- **Receive against ASN** via PWA: scan product barcode, enter/scan quantity.
- **Blind receipt** via PWA (no prior ASN).
- **Traceability capture** at receipt: lot/batch, expiry date, serial number(s) — mandatory per product tracking.
- **Quantity verification + discrepancy capture** vs ASN: over / short / damaged. When received qty differs from the ASN line's **outstanding remainder**, a **discrepancy reason code is mandatory** (short, over, damaged-in-transit, count discrepancy, …). Discrepancies are recorded, never silently absorbed, and don't block the receipt.
- **Per-lot condition / disposition at receipt:** every received lot line carries a condition — **Good** (→ wait/put, status *to-putaway*), **Hold for inspection** (→ status *to-inspect*, decided on the Inspection screen), or **Damaged/reject** (→ quarantine). A non-Good condition requires a reason. Splitting a product into multiple lot lines with different conditions captures **partial damage** (e.g. 90 good + 10 damaged on one delivery).
- **Inspection placement:** Good stock proceeds straight to *to-putaway* and does **not** require the Inspection screen. The **Inspection** screen is the formal QC step (disposition + reason + photos) for lots flagged *Hold for inspection*, and can re-disposition stock. Only *to-inspect* (and already-decided) items appear in its worklist.
- **Partial accept / reject on inspection:** the QC decision is **quantity-based** — the inspector sets how many units are **accepted** (default = the whole plate). Accepted units release to *to-putaway* (enter the putaway queue → available once stored); any **rejected** shortfall splits onto a **new child LPN** at a blocked disposition (*quarantine / hold / damaged*) and **never enters available stock**. e.g. 100 to inspection → accept 90 (→ putaway) + reject 10 (→ quarantine). Whole-accept / whole-reject keep the plate's id; a partial conserves quantity (`accepted + rejected = original`) and carries lot/expiry/serial genealogy (shared `inspectionSplit`). Both channels mutate `DB.lpns` and write `inspect` txns.
- **Expiry sanity:** the receipt warns on **expired** or **near-expiry** (≤ 30 days) lots; near-expiry stock is typically flagged *Hold for inspection*.
- **Photo justification (optional):** attach photos at **header (document) and line (item) level** across ASN / Receive / Inspection / GRN via the shared `assets/photos.js` widget (`DB.attachments[]`) — the high-value moments being damage / held lots and condition disputes. Never mandatory; every add/remove is audited.
- **Send to wait/put zone:** received goods are placed in a staging "wait-to-put" zone for later putaway, rather than requiring immediate storage.
- **License Plate (LPN) generation + label printing** for received handling units; an LPN holds product + lot + expiry + serial(s) + qty. Real Code-128 labels print (one per plate + "print all") on **both channels**.
- **Three labelling models, offered per line (ERP + PWA, identical rules):** **(1)** one line → **one LPN** (default); **(2)** split one line into **N LPNs** — **per each** (base unit) or per pack level (box/pallet); the last plate carries the remainder, serials are sliced per plate, and `Σqty = base`; **(3)** a **mixed (aggregate) pallet** — one license plate (`PLT-…`) holding many product/lot lines, built **post-hoc** ("add to pallet" defers a received line; "close pallet" mints one `PLT-…` keyed to the ASN + one manifest label). Hold/Damaged lots can't go on a putaway pallet, and a line already on the pallet reopens **read-only** (no double-receipt). The pallet **decomposes at putaway** (Section 03) into one child LPN per line.
- **Label reprint / re-access (ERP + PWA):** any LPN or pallet label is **re-printable from the database** — the recovery path when the printer is out of paper or the device dies before the label prints. Scan/pick a plate or pallet, browse **recent receipts**, or open an **ASN** to reprint everything received against it. Nothing is re-minted; labels are regenerated from existing stock.
- **Goods Received Note (GRN)** generated for the client — **one GRN per physical receipt** (a multi-delivery ASN yields several GRNs).
- **Inline new-product creation during receiving** — if a received item isn't in master data yet, the operator can create it without leaving the receive flow. Governed by a **role-based policy:** privileged roles create it **live**; other roles create it as **pending/unverified** (a supervisor or the ERP confirms it later). Minimum inline fields: client, name, SKU (or auto-generated), base unit, optional packaging (reuse an existing hierarchy or clone a shared template), and tracking flags (with **expiry ⇒ lot** enforced); optionally **category/sub-category** and **preferred storage** (location or Area) for downstream directed putaway.
- **Adaptive quantity capture** — quantity is entered as *a number in a chosen unit/pack level*; the system live-converts to the base unit via the product's packaging hierarchy. A base-unit-only product (no hierarchy) simply receives in its base unit.
- **Mixed lots per receipt** — a single receipt may carry **multiple lot/expiry lines** (different lots/expiries, and different conditions, captured as separate lines).
- **Multi-session receiving + derived ASN status** — an ASN may be received over several receipts; each posts received qty against its lines, and the ASN header status is **derived** (open → partial → closed). Receive pre-fills the **outstanding remainder** per line; a **Close ASN short** option cancels an undeliverable remainder.
- **Unexpected (off-ASN) items** — items not on the ASN can be added as extra receipt lines, flagged **off-ASN**; they don't count toward ASN line completion.

## Out of Scope (v2 backlog)
Dock & appointment scheduling, cross-dock, RMA inbound. **Voiding/correcting a confirmed receipt** is handled post-hoc via **Inventory adjustments** (Section 05), not on the receive screen.

## Key Concepts / Entities
- **Inbound Order / ASN** — header + expected lines; each line carries a `received` qty. Header status is **derived** (open → partial → closed), not set by hand.
- **Receipt** — what actually arrived (one receive event; may be one of several against an ASN).
- **Condition / Disposition** — per received lot: Good → *to-putaway*; Hold for inspection → *to-inspect*; Damaged → *quarantine*.
- **Inspection** — formal QC for *to-inspect* lots: a **quantity-based accept/reject** (accepted → *to-putaway*; rejected shortfall → a blocked-disposition child LPN) + reason + optional photos; supports **partial acceptance** (accept N of M). The reject **reason list is driven by the chosen disposition**, pulled live from **Master Data › Reason Codes** (the *Stock status change* domain — Quarantine / Hold / Damaged each carry their own curated reasons); both the ERP and PWA inspection screens repopulate the reason dropdown when the disposition changes.
- **LPN** — license plate carrying the received goods + traceability.
- **Wait/Put zone** — staging location that holds the received LPNs awaiting putaway; **configured in Master Data** (Section 01), referenced here.
- **GRN** — confirmation document to the client, **one per physical receipt**.

## Process Flow
1. ERP: create ASN for a client at a site with expected lines.
2. PWA or ERP: operator selects the ASN (or starts a blind receipt) and records the product (scan or manual).
3. Capture quantity + lot/batch + expiry + serial(s); set each lot's **condition** (Good / Hold for inspection / Damaged).
4. Any over/short vs the ASN remainder, or any non-Good condition, is captured with a **reason**; expired/near-expiry lots are warned.
5. System creates the LPN(s); print labels.
6. Confirm receipt → Good → **wait/put** (*to-putaway*); Held → *to-inspect* (Inspection screen); Damaged → *quarantine*. None are available until putaway (Section 03).
7. The ASN's derived status updates (open → partial → closed); a short receipt can be force-closed.
8. A GRN is produced for the client (one per receipt).

## Business Rules
- Lot + expiry + serial capture is mandatory **per the product's tracking flags**; **expiry ⇒ lot** (a lot-less, expiry-tracked product is not allowed).
- Serial numbers must be **unique** and their count must equal the base-unit quantity.
- Receipt is tied to one site; client segregation enforced.
- **Per-lot condition routes the stock:** Good → *to-putaway* (wait/put); Hold for inspection → *to-inspect*; Damaged → *quarantine*. Only *to-putaway* proceeds toward availability (after putaway, Section 03). A non-Good condition requires a reason.
- **Discrepancy reason is mandatory** when received qty ≠ the ASN line's outstanding remainder (over/short). Discrepancies are reasoned, not silently absorbed, and don't block the receipt.
- **Expiry sanity:** expired / near-expiry (≤ 30 days) lots are warned at receipt.
- **ASN status is derived** from received-vs-expected per line (open → partial → closed); receiving is multi-session. A **Close ASN short** action cancels an undeliverable remainder.
- A receipt may capture **multiple lot/expiry lines** (mixed lots), each with its own condition.
- **One LPN per receipt line** by default; the operator may **split** into multiple LPNs **per each (base unit) or per pack level** (box/pallet), or defer the line onto a **mixed (aggregate) pallet** (one `PLT-…` for many products, decomposed at putaway). Splits conserve quantity (`Σ outputs = base`) and carry lot/expiry/serial genealogy.
- **Labels are re-printable** for any LPN or pallet straight from the DB (recent-receipts / scan / by-ASN recovery), on both channels — out-of-paper / dead-battery recovery. Reprints don't mint stock.
- Receive quantity = **number + chosen UoM/pack level**; the system converts to the base unit using the product's packaging hierarchy.
- **One GRN per physical receipt** (a multi-delivery ASN yields several GRNs).
- **Inline product creation** follows a **role-based policy:** privileged roles create products live; other roles create them as **pending/unverified**, excluded from normal use until confirmed.
- Correcting a confirmed receipt is done via **Inventory adjustments** (Section 05).
- Every receiving action is available on both PWA (scan) and ERP (manual entry).

## Screens (for mockup phase)
- **ERP:** ASN list + create/edit; **Receive** (`erp-gr-receipt.html`, full fallback — live-mints LPNs, per-each/per-pack **split**, **mixed-pallet** build, real label printing); inspection (**partial accept/reject** — accepted qty → putaway, rejected → quarantine/hold/damaged) + photo upload; GRN view/print; **Labels / Reprint** (`erp-gr-labels.html` — scan/pick · recent receipts · by-ASN).
- **PWA:** receive screen (scan product → capture lot/expiry/serial → qty → split / add-to-pallet), inspection **accepted-quantity + accept-all/reject-all** (partial accept → putaway, reject → quarantine/hold/damaged) + photo capture, discrepancy entry, **LPN / pallet label print** (`pwa-gr-lpn.html`), **Reprint label** (`pwa-gr-reprint.html` — scan/pick · recent · by-ASN).

## Dependencies
Needs Master Data (clients, sites, products, wait/put zone, LPN config). Feeds Section 03 (Putaway).

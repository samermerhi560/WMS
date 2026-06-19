# Process Map — end-to-end flow

> One picture of how stock and documents move across the processes, so every card sees its place in the
> whole. Detail lives in `../../docs/0N_*.md`; this is the connective tissue only.

---

## Stock lifecycle (the spine)

```
SUPPLIER
   │ ASN (expected)                                      ┌─────────── Inventory Operations (Phase 6) ───────────┐
   ▼                                                     │  Move · Transfer · Count · Physical(freeze) ·        │
[Receiving P2] ──receive──► LPN: to-inspect/to-putaway   │  Adjust · Correct · Repack · Returns · Disposal       │
   │  (refuse / over / damaged / blind)                  └───────▲───────────────────────────────────────────────┘
   ▼                                                             │ (operates on available stock; honours CC-01 freeze)
[Putaway P3] ──place (capacity+segregation+freeze)──► LPN: available
   │                                                             │
   ▼                                                             │
[Stock Visibility P4]  SoH = available LPNs by product/lot/loc ──┘
   │
   ▼  allocate (FEFO/FIFO, reservation-aware, exclude expired/frozen)
[Stock-Out P5] ──allocated──► picking ──► picked ──► dispatch ──► LPN: dispatched
   │                                                     │
   │ back-order(partial) / short-close                   ▼
   │                                              Delivery Note → CONSIGNEE (ship-to ≠ client)
   ▼
[Reports P6/P7]  txn ledger, SoH, expiry, variance, trace, client statement
```

## Status transitions (LPN)

```
to-inspect ─► to-putaway ─► available ─► allocated ─► picked ─► dispatched
     │             │            │
     ▼ (fail)      ▼ (reject)   ├─► hold / quarantine / damaged / expired   (blocked: excluded from allocation)
 quarantine     quarantine      ├─► in-transit (transfer)
   / hold        / hold         └─► consumed (repack source)
```

## Where each cross-cutting concern fires along the flow

| Step | Concerns enforced |
|---|---|
| Receive | CC-03 audit, CC-04 conservation, CC-05 tracking, CC-08 scope, CC-09 assignment |
| Putaway | CC-01 freeze, CC-02 capacity+segregation, CC-03, CC-04, CC-08 |
| Stock status change | CC-07 reason+approval, CC-03, CC-08 |
| Allocate / Dispatch | CC-06 FEFO+reservation, CC-01 freeze-exclude, CC-10 role-gate, CC-03, CC-08 |
| Move / Transfer | CC-01, CC-02, CC-03, CC-04, CC-08 |
| Count / Physical | CC-01 freeze (physical), CC-07 approval, CC-03, CC-08 |
| Adjust / Correct / Repack / Return / Disposal / RTV | CC-07, CC-03, CC-04, CC-08 |

## Document → document links (cross-process references to keep stable)
- `ASN.line.received` ← Receiving; closes ASN.
- `LPN` genealogy (lot/expiry/serial/client) carried across **every** mint/split/relocate (CC-04).
- `Outbound.shipments[]` (Delivery Notes) ← Dispatch; immutable.
- `DB.txns[]` ledger ← every mutation (CC-03); read by Reports + Stock Card + Trace.
- `assignee` ← assignment facet on every floor queue (CC-09).

> Use this map when filling a card's §7 *Dependencies*: trace upstream (what must exist) and downstream (who consumes this slice's outputs).

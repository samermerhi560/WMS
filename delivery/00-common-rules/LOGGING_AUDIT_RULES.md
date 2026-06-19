# Logging & Audit Rules

> Three distinct streams — keep them separate. The **audit ledger is domain data (CC-03)**, not a log file.

## 1. Application logging (NLog)
- Host NLog (`nlog.config`). Log mutations at service boundaries (info), guard failures (warn), exceptions (error) with ids + correlation. **No PII / secrets / full payloads** beyond what's needed to diagnose.

## 2. Audit ledger — `WmsTxn` (CC-03, the locked invariant)
- **Every committed stock mutation appends one `WmsTxn` row** via `IStockLedgerService.LogTxn(...)`, inside the same transaction. *An action that mutates stock and writes no txn row is a bug.*
- Fields (`../../docs/DATA_MODEL.md` §Transaction history): `type, lpn, product, qty(signed), from, to, site, user, ref, reason, note, ts`.
- `type ∈ {receive, putaway, move, transfer-ship, transfer-receive, adjust, correct, count, status, repack, return, dispatch, attach, attach-remove}`.
- **Append-only.** No update/delete (SQL 2014: enforced by convention + optional DENY). This table is read by Reports, Stock Card, and Trace — its integrity is the system's traceability promise.

## 3. Entity audit fields
- Mutable entities carry `CreatedBy/CreatedAt/EditBy/EditTime` (host `AddNewTime?/EditTime?`). For master data this is enough; for stock, the ledger is the real audit.

## Attribution
- Every mutation records the **acting user** (from the JWT, not a client field) + **ref** (document) + **reason** where the action requires one (CC-07). Overrides (scan bypass, force) are always audited with reason + actor.

## Production intent (flagged gaps to honour)
- Make `WmsTxn` strictly immutable with before/after snapshots (DATA_MODEL gap #6). Reprints/overrides should also be auditable (mock carry-over).

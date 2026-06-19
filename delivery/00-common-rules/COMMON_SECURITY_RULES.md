# Common Security Rules

> Reuse the host identity; **add** WMS authorization + the multi-tenant scoping the mock flagged as a
> production gap. Authoritative invariant source: `../../docs/BLOCKING_RULES.md`; host auth: HOST_MAP §A2/§B2.

## Authentication (reuse — build nothing)
- Host custom JWT identity (`AU.*`). The WMS module trusts the existing Bearer token; the Angular client attaches it via the existing Auth interceptor. No WMS login screen.

## Authorization — roles & claims (CC-10)
- Register WMS rights in the host role/claim system: `WMS_Administrator`, `WMS_Supervisor`, `WMS_Operator` + action rights `WMS_ExpressFulfil`, `WMS_AdHocDispatch`, `WMS_SelfClaim` (the mock's flagged role-gated carry-overs — shown to all in the mock, gated in the build).
- **Server-side gate:** `[Authorize(Roles="…")]` (or policy) on the action; reject with `APICustomException(…, NotAuthorized)`.
- **UI gate:** `PermissionGuard` (route) + `SdsAccessChecker.isGranted()` (button). UI gating is UX only — the **server is authoritative**.

## Multi-tenant scoping (CC-08) — the big one
Every WMS record is scoped by **owning client** + **site**. Today the host `User` has **no** site/client scope, so this must be added.
- 📌 DECISION (#2): **WMS-side `UserSiteScope`/`UserClientScope` (or a `UserClaim` of type `WMS_Scope`)** rather than editing the shared `User` schema — confirm + ADR.
- `ITenantScopeService` exposes the caller's permitted clients+sites. **Every read** is filtered by it; **every write** asserts the target is in scope **before** mutating. Reports/lists default to in-scope only.
- **Never rely on the UI** to enforce scope — a hand-crafted request must be rejected server-side.

## Mutation guards (server-side, from BLOCKING_RULES)
- Validate-at-commit against live stock (CC-11); approval/maker-checker re-asserts state + `sameActor` rejection (CC-07).
- Frozen-scope refusal (CC-01), capacity/segregation (CC-02), serial-on-issue, conservation (CC-04) — all enforced in services, not just screens.

## Audit (CC-03)
Every mutation is attributable: `logTxn` records the acting user + ref + reason. Sensitive actions (dispatch, disposal, adjust, RTV, override) must always carry actor + reason. See `LOGGING_AUDIT_RULES.md`.

## Transport & data
- HTTPS end-to-end (gateway). No secrets in the Angular bundle or `environment.ts` beyond public base URLs. Connection strings in server config only.
- PWA offline cache (if used) holds **only in-scope** reference data; clear on logout.

## Open items for Phase 0
- Confirm decision #2 (scoping model) and write the ADR.
- Map the full WMS role/right matrix (which role may do which action) — seed from the mock's flagged gates; expand during phase decomposition.

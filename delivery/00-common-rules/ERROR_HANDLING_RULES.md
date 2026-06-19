# Error Handling Rules

> Match the host pipeline exactly: `APICustomException` → `ErrorHandlingMiddleware` → `OperationResult` →
> Angular `HttpErrorsInterceptor` → toastr. Do not invent a parallel error scheme.

## Backend
- Throw `APICustomException(message, APICustomReturnType.X)` for expected/business errors — never return ad-hoc 500s.
- Reuse existing codes (`DataNotFound`, `NotAuthorized`, `RequiredField`, `CodeAlreadyExist`, `ForeignKeyConflict`, `UserNotLoggedIn`, …). **Propose WMS-specific codes** for the guard failures (capacity exceeded, segregation conflict, frozen-scope, expired-stock, short-pick, serial-mismatch) and add them to the shared enum (coordinate — shared file → ADR).
- The message is **user-facing and translatable-friendly**; put technical detail in the NLog entry, not the message.
- A failed guard rolls back the whole transaction (no partial mutation).

## Frontend
- `HttpErrorsInterceptor` already toasts non-401 errors. 401 → token refresh; 403 → no-permissions route (host behaviour) — don't duplicate.
- Components handle the **expected** business outcomes explicitly (short-pick review, approval rejected, capacity block) by reading `OperationResult.Message`/`ExtraData` and routing the user to the review/override path — not just a generic toast.
- Never swallow an error silently; never leave a spinner spinning on failure.

## Logging vs user message
- **User message** = short, actionable, localized. **Log** (NLog) = full context (stack, ids, payload summary). **Audit** (`logTxn`) = the business event, separate from both (see `LOGGING_AUDIT_RULES.md`).

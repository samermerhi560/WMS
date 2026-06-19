# Validation Rules

> Where validation lives and how it's layered. Business invariants are in `../../docs/BLOCKING_RULES.md`
> (link, don't restate). This is the *placement* policy.

## Three layers (all required for mutations)
1. **Client (UX only):** Reactive Forms validators — required, ranges, format; disable submit until valid. Mirrors server rules for fast feedback. **Never the source of truth.**
2. **DTO (server boundary):** DataAnnotations (`[Required]`, `[MaxLength]`, range) on Creation/Editor DTOs → `RequiredField` etc. *(FluentValidation optional for WMS — flag in an ADR if adopted; host uses annotations.)*
3. **Service (authoritative business validation):** the BLOCKING_RULES guards, run **at commit against live stock** (CC-11): freeze (CC-01), capacity/segregation (CC-02), conservation (CC-04), allocatability/FEFO (CC-06), reason+approval+maker-checker (CC-07), scope (CC-08), serial-on-issue. Fail → `APICustomException` with the right code; **no partial writes** (transaction rolls back).

## Standard rules
- Quantities `> 0`; decreases ≤ on-hand; splits ≤ source.
- Uniqueness of business `Code` per scope → `CodeAlreadyExist`.
- Status transitions only along the allowed graph (`../../docs/DATA_MODEL.md` enums); system-set states (`to-putaway`, `in-transit`, `dispatched`, …) are not manually settable.
- Tracking-flag conditional: validate lot/expiry/serial **only** when the product tracks them; serial count == qty when `track.serial`.
- Deep-link pre-fill validated server-side (CC-12) — ineligible target → no commit.

## Error surfacing
Service throws `APICustomException` → middleware → `OperationResult{ErrorOccured:true, Message}` → Angular HttpErrors interceptor → toastr. Field-level messages from DTO validation map back to the form where possible.

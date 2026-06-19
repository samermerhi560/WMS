# Testing Rules

> The mock already gives you most of the test design. Reuse it.

## Test layers (per slice / card)
| Layer | Tool | What |
|---|---|---|
| **Unit (BE)** | xUnit (`WMS.Test`) | Services + the cross-cutting guards: freeze, capacity/segregation, conservation, FEFO/FIFO, allocatability, approval/maker-checker, scope. Pure logic, mocked repos. |
| **Integration (BE)** | xUnit + test DB / in-memory where faithful | Endpoints end-to-end: request → service → DB → `OperationResult`/`DataSourceResult`; transaction rollback on guard failure; `logTxn` row written. |
| **Unit (FE)** | Jasmine/Karma (host) | NgRx reducers/selectors/effects; permission gating; flag-driven field show/hide. |
| **E2E (critical flows)** | Cypress/Playwright (propose — host has none) | Receive→putaway→stock→pick→dispatch; freeze blocks; short-pick; count approval. Both channels. |

## Source the cases — don't invent
- **Happy + guard cases:** `../../docs/BLOCKING_RULES.md` (each row is a test).
- **Negative / unhappy paths:** `../../EDGE_CASE_TRACKER.md` (25 cases — refuse-delivery, disposal, RTV, in-transit loss, damage-at-pick, dispatch re-validation, freeze-on-adjust, expiry blocks, maker-checker, …). Each card's acceptance traces to specific rows.
- **Fixtures:** seed from `../../mockups/assets/data.js` (the linked dataset) — it already cross-references IDs across processes, so end-to-end fixtures are pre-built.

## Coverage gates (Definition of Done)
- All BLOCKING_RULES guards for the card's `Consumes` list have a passing test.
- All EDGE_CASE rows the card claims are demonstrated.
- Conservation + `logTxn` asserted on every mutation path (the mock used node assertions for exactly this — port them).
- Server-side scoping (CC-08) and role-gating (CC-10) have negative tests (out-of-scope/forbidden → rejected).

## Don't ship
- A mutation path without a conservation + audit test.
- A guard enforced only in the UI.

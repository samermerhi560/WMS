# Common UI/UX Rules

> The agreed UX reference is the mockups (`../../mockups/`). The build **replicates their structure** using
> Nebular/Kendo — not bespoke CSS. `wireframe.css` → the Nebular theme. Honour the locked vocabulary (`../../docs/GLOSSARY.md`).

## The 8 reusable screen patterns (build once, clone)
From `CLAUDE.md` / the mock: **list+form · document-list** (title+actions, tabs, filter grid, toolbar, grouped funnel table) **· dashboard · report · scan-flow (PWA) · lookup (PWA) · document/print · wizard.** Each maps to a small set of shared WMS components. Reference screens: `erp-gr-asn.html` (document-list + create/edit), `erp-pa-tasks.html` (list↔detail), `erp-gr-grn.html` (document/print).

## ERP conventions
- Lazy-loaded feature area with a left nav (Nebular sidebar) mirroring the mock's sections (Master Data / Goods Reception / Putaway / Stock-Out / Inventory / Reports).
- Lists: Kendo grid, server-side, with the filter grid + tabs from the mock; **Assignee / "My requests" filter** at the top of every work-item list (CC-09).
- Forms: Nebular inputs, Reactive Forms, inline validation, toastr for outcomes.
- Status → badge mapping mirrors `statusBadge()`.

## PWA conventions
- Phone-frame, scan-first. Home hub of task tiles with live counts. `All / My tasks` toggle (CC-09) + per-task Claim/Release.
- Every scan field: camera + ZXing fallback + manual + pick-from-list. Confirm gated on required scans + audited override.
- Mirror the ERP's enforced rules (freeze/capacity/segregation/serial/FEFO) — the floor is not a softer path.

## Flag-driven fields (CC-05) — system-wide
Lot/Expiry/Serial render only when the product tracks them: lists show muted `n/a` for an untracked attribute; forms/detail omit it. Never show an irrelevant tracking field.

## Feedback & states
- Loading skeletons/spinners on async; empty-state messaging; errors via toastr from `OperationResult.Message`.
- Destructive/irreversible actions (dispatch, disposal, release-to-available, override) confirm first and capture reason (CC-07).

## Accessibility & i18n
- All strings translatable (en/fr/pt/es). Keyboard-usable forms. PWA: large tap targets, glove-friendly, high-contrast for warehouse lighting.

## Responsive
ERP desktop-first; PWA mobile-first (the scanner is a handheld). Grids scroll within their container; never break the page layout horizontally.

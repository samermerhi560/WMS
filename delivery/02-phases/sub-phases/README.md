# Sub-phase build cards

> One file per slice — the **unit of assignment, estimation, and "done"**. Clone
> `../../01-orchestrator/SUBPHASE_TEMPLATE.md`; name `P0X-SYY_<slug>.md`.

## Status
- **Template:** `../../01-orchestrator/SUBPHASE_TEMPLATE.md` (with an abbreviated worked example).
- **Reference card (complete):** `P03-S01_single-lpn-putaway.md` — a fully filled, ready-to-build instance.
- **Remaining cards:** to be generated during phase decomposition. Each `PHASE_0N_*.md` lists its planned cards in a table — those become the files here.

## How to use
1. A card is written from its phase file's planned-card row + the linked functional spec.
2. It is reviewed against the **Definition of Ready** (`../../01-orchestrator/DEVELOPMENT_EXECUTION_GUIDE.md`) before assignment.
3. Its `Estimation` block feeds `COST_MODEL`; its `Depends on`/`Consumes` feed the dependency matrix.

## Order of generation (recommended)
Phase 0 cards → Phase 1 cards → then per-phase as the build sequence dictates (`../../01-orchestrator/PHASE_DEPENDENCY_MATRIX.md`).

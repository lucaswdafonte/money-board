---
name: money-board-review
description: Project-specific code review checklist for money-board. Use when asked to review a diff, PR, or staged changes in this repo against its own standards — ARCHITECTURE.md's layer boundaries and multi-tenancy rules, the per-layer testing bar, SOLID, clean code, duplication, and naming conventions. Complements (does not replace) the generic /code-review command and the security-review skill.
---

# money-board code review

Reviews changes in this repo against the standards fixed by `CLAUDE.md` (product/financial
principles), `ARCHITECTURE.md` (binding technical decisions), and `ROADMAP.md` (phase sequencing)
— plus general clean-code/SOLID/duplication/naming discipline. It is the project-specific
complement to the generic `/code-review` command: run this one for money-board's own rules, run
`/code-review` (or `/code-review ultra` for a large change) for broad bug-hunting, and the
`security-review` skill for a dedicated security pass.

## Step 1 — Scope the diff

Default to the working branch's diff against `main`:

```bash
git diff main...HEAD
git diff main...HEAD --stat   # which files/layers are touched, before reading line-by-line
```

If reviewing a specific PR, use `gh pr diff <number>` instead. Read every changed file in full
context (not just the diff hunks) when the change touches a function's surrounding logic — a diff
hunk alone can hide whether a nearby duplicate or missing test already exists.

## Step 2 — Review dimensions

Work through each dimension below. Only flag what the diff actually touches or introduces — see
"What not to flag" at the end.

### A. Architecture boundaries — ARCHITECTURE.md

- **Acquisition/domain separation (§1)**: does `app/domain/` import anything from
  `app/acquisition/`, `httpx`/`requests`, or provider-shaped response fields? That's a boundary
  violation regardless of how small. Fetching/parsing belongs in `acquisition/`, formulas belong in
  `domain/` operating on normalized types (e.g. `PriceSeries`), wiring belongs in `services/`.
- **Multi-tenancy (§2)**: any new table storing user-owned data has a `user_id` FK and uses
  `UserScopedMixin` (`backend/app/core/mixins.py`). Every query against it filters by `user_id` —
  check services like `app/services/asset_service.py`'s `get_portfolio(db, user_id, portfolio_id)`
  pattern as the model to match. A route or service function that fetches by ID alone without a
  `user_id` filter is a cross-tenant data leak, not a style nit — treat it as a blocking finding.
- **Probabilistic outputs labeled (§3)**: any simulation/projection response includes model name,
  assumptions, and confidence interval alongside the number — never a bare figure. (Not relevant
  until Phase 9+, but check immediately once that work starts.)
- **FastAPI routes stay thin**: routers (`app/api/routers/`) validate input and call a service
  function; no calculation or multi-step DB logic inline in a route handler.
- **New asset classes / new providers use the registry pattern** (Phase 8+ especially) — a new
  `if asset_class == "..."` branch appearing outside a registry/strategy dispatch is a red flag.

### B. Test coverage — per layer, per the project's own convention

"Every functionality needs a unit test; UI tests aren't necessary, just behaviors." Applied per
layer as it actually works in this codebase:

| Layer | Required test style | Notes |
|---|---|---|
| `app/domain/` | Pure input/output, hand-verified expected values (textbook/reference), no DB, no network | Per ARCHITECTURE.md Testing Requirements — highest bar, this is the financial math |
| `app/acquisition/` | Fixture/mocked HTTP responses, no live calls | |
| `app/services/` | **Isolated unit test with a mocked DB session** (`unittest.mock`, or a hand-rolled fake), exercising the function's branching/validation logic without hitting Postgres | Additive to the API-level test below, not a replacement — see rationale |
| `app/api/routers/` | `TestClient` + real test-DB session (savepoint pattern in `tests/conftest.py`), as already practiced in `tests/api/*.py` | This is where cross-tenant scoping, cascade deletes, and DB constraint→exception mapping (e.g. `DuplicateTickerError`) actually get validated — a mocked session can't verify those, so this layer of test stays required even when the service also has a mocked-session unit test |
| Frontend hooks/validators/`api/client.ts`/utils | Unit test with Vitest + React Testing Library once introduced (see below) | Presentational components (JSX-only, no branching logic) don't need one |

Practical notes:
- A new/changed `services/*.py` function without both (a) a mocked-session unit test for its logic
  and (b) API-level coverage for the endpoint that calls it is missing required coverage —
  blocking.
- **Frontend test framework doesn't exist yet** (no Vitest/RTL in `frontend/package.json`, no test
  script). Per project decision: this is a **blocking** finding, not a suggestion. The first diff
  that introduces non-trivial frontend behavior (a hook with logic, a validator, error-handling in
  `api/client.ts`, a reducer, a computed/derived value) must add Vitest + React Testing Library and
  a test for that logic as part of the same PR. Pure-rendering components and page layout
  (`layout/AppShell.tsx`-style JSX composition) do not need one.
- Every new financial metric/calculation additionally needs a hand-verified expected value in its
  test (a textbook example or independently computed reference number) — "it runs and returns a
  number" is not sufficient per ARCHITECTURE.md.

### C. Clean Code

- Names say what a thing is/does without needing a comment to explain it; no `data`, `temp`, `x`,
  `handle2`.
- Functions do one thing at one level of abstraction; a function mixing DB calls, business rules,
  and response shaping in one body should usually split.
- No magic numbers/strings for domain concepts (asset classes, currencies, thresholds) — named
  constants or enums (see `app/models/asset.py`'s `AssetClass` enum as the pattern).
- Guard clauses / early returns over deep nesting.
- No dead code, commented-out code, or unused imports/variables left behind.
- Error handling only at real boundaries (request input, external API calls) — per CLAUDE.md's
  Development Principles, don't add defensive checks for states that can't occur internally (e.g.
  re-validating something the type system or a prior layer already guarantees).

### D. SOLID — applied to this codebase's actual shape

This is a mostly functional/service-oriented FastAPI codebase, not a deep class hierarchy — apply
SOLID at the module/function level, not by demanding class-based abstractions that don't fit:

- **S — Single Responsibility**: one service module owns one concern (`asset_service.py` doesn't
  reimplement portfolio lookup — it calls `portfolio_service.get_portfolio`, which is the pattern
  to keep following, not duplicate).
- **O — Open/Closed**: extending behavior (new asset class, new benchmark, new optimization
  strategy) should mean adding a new registry entry/strategy implementation, not editing a growing
  `if/elif` chain in existing code. This is explicitly load-bearing starting Phase 8.
- **L — Liskov Substitution**: any strategy/registry implementations (Phase 8+ asset-class
  strategies, future optimizers) must be swappable through the same interface without the caller
  needing to know which concrete one it got.
- **I — Interface Segregation**: keep Pydantic schemas narrow and purpose-specific (a `*Create`
  schema isn't the same as a `*Read`/`*Update` schema) rather than one shared schema with optional
  fields for every use case.
- **D — Dependency Inversion**: this is already ARCHITECTURE.md §1 — `domain/` depends on its own
  normalized types, never on `acquisition/`'s provider-specific shapes. Flag any new dependency
  pointing the wrong direction.

### E. Duplication

- Rule of three: a third near-identical copy of logic (validation, formatting, a query shape)
  should be extracted, not copy-pasted again.
- Reusable domain logic goes in `app/domain/` (backend) or `frontend/src/lib/`; reusable UI pieces
  extend an existing `components/ui/*` primitive via its variant/props API rather than a new
  one-off component that re-implements styling.
- Check for the same validation/business rule implemented twice at different layers (e.g. an enum
  check duplicated in both a Pydantic schema and a service function) — one source of truth,
  enforced at the boundary (schema/DB constraint), not re-checked redundantly deeper in.

### F. Naming conventions

Backend (Python):
- `snake_case` for functions, variables, modules; `PascalCase` for classes; `SCREAMING_SNAKE_CASE`
  for module-level constants.
- Exception classes end in `Error` (`AssetNotFoundError`, `DuplicateTickerError` — follow this
  existing pattern for any new exception).
- Service functions read as verb phrases scoped to their entity (`create_asset`, `get_portfolio`),
  matching existing `services/*.py`.

Frontend (TypeScript/React):
- Component files and component names: `PascalCase` (`AssetForm.tsx`).
- Hooks: `camelCase`, prefixed `use` (`useAuth.ts`, `useTheme.ts`).
- Plain functions/variables: `camelCase`.
- Static data/config modules: `snake_case` filenames (`asset_classes.ts`, `error_messages.ts`,
  `routes.ts`) — matches existing `constants/`.
- Types/interfaces: `PascalCase`, no `I`-prefix.

Cross-cutting:
- Keep the same term for the same concept across backend, frontend, and DB — don't let `ticker` in
  the DB become `symbol` in a schema become `code` in a frontend prop. Check the diff introduces no
  new synonym for an existing domain concept.

### G. Explainability & probabilistic labeling — CLAUDE.md

- Any metric newly surfaced in the UI ships with an explanation covering: what it means, why it
  matters, how it's calculated, and how to interpret good/bad values. A number with no explanation
  panel/tooltip is incomplete per CLAUDE.md's "Explainability" section, not a nice-to-have.
- Any simulation/projection result is presented as a scenario (model + assumptions + confidence
  interval), never framed as a prediction/certainty.

### H. Roadmap phase discipline

- Check `ROADMAP.md`'s current phase marker. A diff that reaches ahead into a later phase's scope
  (e.g. building optimization logic before Risk Analytics/Phase 7 exists) should be flagged for
  discussion, not silently merged — per ROADMAP.md's "one phase at a time" rule.
- If the diff touches something in ARCHITECTURE.md's "Open / Not Yet Decided" list (auth provider,
  market data provider, deployment target, frontend state library, TimescaleDB) without a prior
  discussion establishing that decision, flag it — those are explicitly meant to be decided
  on-demand with the user, not assumed.

## Step 3 — What not to flag

- Anything already enforced by `ruff` (backend) or `oxlint` (frontend) — trust the linter for
  formatting/basic style; don't restate its output as a review finding.
- Pre-existing untested code the diff doesn't touch — this is a review of the change, not a
  retroactive audit of the whole repo. If the diff modifies a previously-untested function, its new
  behavior needs coverage; unrelated untested code nearby is out of scope (optionally note it as a
  low-severity aside, not a blocking finding).
- Personal style preferences with no stated project convention behind them.

## Step 4 — Report findings

Use the `ReportFindings` tool. Rank most-severe first:
1. Multi-tenancy/data-leak issues (§2 violations) and architecture-boundary violations (§1)
2. Missing required test coverage (per the table in Step 2B)
3. SOLID/duplication issues that will compound as the codebase grows (e.g. a new `if/elif`
   asset-class branch instead of a registry entry)
4. Clean code / naming issues
5. Explainability / probabilistic-labeling gaps
6. Roadmap-phase-discipline notes

For each finding, name the concrete file/line, the specific rule from `CLAUDE.md`/`ARCHITECTURE.md`
it violates (or which dimension above), and the failure scenario in concrete terms — not "this
could be cleaner" but what breaks or leaks and under what input/state.

## Step 5 — Save the report to `reviews/`

Every review run gets persisted, not just reported inline — `reviews/` at the repo root is the
durable audit trail and is tracked in git (not gitignored).

- **File**: `reviews/<YYYY-MM-DD>-<branch-or-scope>.md`, e.g. `reviews/2026-07-30-phase3-transactions.md`.
  Use the current date and the branch name (or PR number/title if reviewing a PR) as the scope. If
  a file for that date+scope already exists (re-review after fixes), append `-2`, `-3`, etc. —
  never overwrite a prior review's history.
- **Content**: mirror the structure reported via `ReportFindings`:
  - Header: date, branch/PR reviewed, base commit compared against (`main...HEAD` or similar), and
    which skill version/scope was used (this file).
  - One section per finding, most-severe first, each with: category (from Step 4's ranking),
    file:line, summary, concrete failure scenario, and verdict (`CONFIRMED`/`PLAUSIBLE`) if the
    finding was independently verified.
  - If no findings survived review, still write the file, stating explicitly that the diff was
    reviewed and passed clean — the absence of a report is not evidence a review happened.
- Write the file with the same content passed to `ReportFindings` — don't let the two drift; the
  saved `.md` is the permanent record, `ReportFindings` is the in-session UI surface for the same
  data.

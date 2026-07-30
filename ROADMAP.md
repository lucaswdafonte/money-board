# Roadmap

This file sequences `CLAUDE.md` (product vision) and `ARCHITECTURE.md` (binding technical
decisions) into incremental phases. It is the working plan for development sessions in this
repo — read it before starting a new feature to know what phase we're on and what's next.

## How to use this document

- **One phase at a time, in order.** Each phase depends on the ones before it. Don't jump ahead
  (e.g. don't build Optimization before Risk Analytics exists) without discussing it first.
- **Every phase ends with something runnable and demoable** via `docker compose up` — a real user
  flow through the frontend, not just passing tests. That's the "usable product" bar.
- **Every phase's Definition of Done includes, unconditionally:**
  - Unit tests for every new calculation (hand-verified expected values, no network/DB) — per
    ARCHITECTURE.md Testing Requirements.
  - New user-owned tables use `UserScopedMixin` (`backend/app/core/mixins.py`) and every query is
    scoped by `user_id` — per ARCHITECTURE.md §2.
  - New calculations live in `app/domain/`, provider/HTTP code lives in `app/acquisition/`, and
    `app/services/` wires them together — per ARCHITECTURE.md §1. Never let a calculation module
    import an acquisition module.
  - Any metric surfaced in the UI ships with an explanation (what it means, why it matters, how
    it's calculated, how to interpret it) — per CLAUDE.md "Explainability". This is not a separate
    phase; it's a per-metric requirement baked into each phase below.
  - Probabilistic outputs (projections, simulations) are always labeled with model, assumptions,
    and confidence interval — never a bare number — per ARCHITECTURE.md §3.
  - README/architecture docs updated if the phase changes how the app is run or structured.
- **Status markers**: ✅ done · 🚧 in progress · ⬜ not started. Update the marker when a phase's
  Definition of Done is met.
- When a phase turns out to need a decision listed in ARCHITECTURE.md's "Open / Not Yet Decided"
  section, stop and ask — don't assume.

---

## Phase 0 — Project Foundation ✅

Docker Compose stack (Postgres, Redis, backend, worker, frontend), FastAPI skeleton with a
`/health` route, Celery app wired to Redis, Alembic configured, React+TS+Vite skeleton,
`UserScopedMixin` established. No domain logic yet.

---

## Phase 1 — Auth Skeleton & Multi-Tenancy Baseline ✅

**Why first:** ARCHITECTURE.md §2 requires every user-owned table to carry `user_id` from its
first migration. We need a real `User` row to point that foreign key at before any other table is
created — retrofitting it later is exactly what we're avoiding.

**Usable product:** the app has one seeded/hardcoded user; the frontend has a minimal
login/session shell (even if trivial auth) and shows an authenticated empty-state dashboard shell
instead of a static page.

- **Backend**: `User` model + first Alembic migration. Trivial auth strategy (e.g. single
  hardcoded user + session cookie, or a stub JWT) — explicitly pluggable, not a real auth provider
  (that's an open decision in ARCHITECTURE.md). A `get_current_user` dependency used by every
  future route.
- **Frontend**: login shell, authenticated app shell/layout (nav, empty dashboard placeholder),
  API client with auth wired in.
- **Out of scope**: real auth provider, password reset, multi-user signup flows.

---

## Phase 2 — Portfolio & Asset Registry ✅

**Usable product:** a logged-in user can create a portfolio, manually register assets into it
(ticker, name, asset class, sector, country, currency), and see them listed. No prices, no
transactions yet — just the registry.

- **Backend**: `Portfolio`, `Asset` domain models + CRUD API (`app/api/routers`), all `user_id`
  scoped.
- **Frontend**: portfolio create/select, asset add/edit/list forms and table.
- **Domain**: none yet (pure CRUD) — this phase is scaffolding for Phase 3+.

---

**Infra interlude (between Phase 2 and 3) ✅ — shadcn/ui adoption:** Phase 1–2's hand-rolled CSS
replaced with shadcn/ui + Tailwind v4 across all existing screens, plus a manual light/dark/system
theme toggle. No user-facing behavior changes; see ARCHITECTURE.md's Tech Stack section for the
resulting conventions. Done before Phase 3 so its transaction forms build on the new primitives
from the start instead of the old hand-rolled classes.

---

## Phase 3 — Transactions, Cash Flow & Positions ⬜

**Usable product:** user records buy/sell transactions and deposits/withdrawals per asset; the app
computes and displays current positions, average purchase price, and realized gains from that
transaction history.

- **Backend**: `Transaction`, `CashFlow` models; domain functions for average cost basis
  (weighted-average method) and realized gain/loss on sells. Pure functions, hand-verified test
  cases.
- **Frontend**: transaction entry form, position table (quantity, avg price, realized P/L).
- **Out of scope**: unrealized gains and live valuation — that needs Phase 4's market prices.
  Dividends/interest tracking — folded into this phase only if trivial as a `CashFlow` type;
  otherwise deferred to Phase 5.

---

## Phase 4 — Market Data Acquisition (Prices & Benchmarks) ⬜

**Usable product:** positions from Phase 3 now show live current value and unrealized gain;
portfolio value updates from real market prices instead of manual entry.

- **Acquisition layer** (`app/acquisition/`): pluggable provider(s) for BR and US instrument
  prices, plus CDI/SELIC/IPCA (BCB), Ibovespa, S&P 500, Nasdaq, FX rates. HTTP/provider-shape
  knowledge stays entirely in this layer.
- **Domain layer**: normalized `PriceSeries` type that acquisition output maps into — this is what
  every later calculation module (Phases 6–11) consumes, never raw provider responses.
- **Celery**: scheduled job to refresh prices; acquisition tests use fixture HTTP responses, never
  live calls.
- **This is the point at which "which market data provider(s)" — an open decision in
  ARCHITECTURE.md — must be settled. Ask before picking one.**

---

## Phase 5 — Dashboard & Core Visualizations ⬜

**Usable product:** the dashboard from Phase 1's empty shell becomes real — portfolio value over
time, allocation breakdown (by asset / asset class / sector / country / currency), drawdown
history, cash flow history. This is the first phase with real charts — **consult the `dataviz`
skill before building any of them.**

- **Backend**: aggregation endpoints (time series, allocation breakdowns) built on Phase 3/4 data.
- **Frontend**: chart components (Recharts default per ARCHITECTURE.md), dashboard layout.
- **Domain**: drawdown-from-time-series calculation (reused by Risk Analytics in Phase 7 — don't
  duplicate it there).

---

## Phase 6 — Benchmark Comparison ⬜

**Usable product:** user picks an asset, a selection of assets, or the whole portfolio and
compares it against one or more benchmarks (CDI, SELIC, IPCA, Ibovespa, S&P 500, Nasdaq, USD),
seeing absolute return, inflation-adjusted real return, annualized return, volatility,
risk-adjusted performance, and drawdown side by side.

- **Domain**: return/volatility/annualization/inflation-adjustment functions, each independently
  unit tested against hand-verified values.
- **Frontend**: benchmark picker + comparison chart/table, each metric explained inline.

---

## Phase 7 — Risk Analytics ⬜

**Usable product:** a risk page per asset/portfolio showing volatility, max drawdown, VaR, CVaR,
beta, correlation & covariance matrices, Sharpe, Sortino, Calmar, and Information ratio — each
with an explanation panel.

- **Domain**: one pure function per metric, textbook-verified test cases for each (this is the
  highest math-density phase — budget accordingly).
- **Frontend**: risk dashboard, correlation matrix heatmap (dataviz skill again).

---

## Phase 8 — Asset-Class-Specific Analysis ⬜

**Usable product:** an asset detail page shows metrics specific to its type — stocks get P/E, P/B,
ROE, ROIC, dividend yield, earnings/revenue growth; fixed income gets YTM, duration, modified
duration; funds get historical returns, Sharpe, max drawdown.

- **Architecture**: strategy/registry pattern keyed by asset class (per ARCHITECTURE.md §
  "New asset classes... favor a strategy/registry pattern") — this is the phase that either
  validates or breaks that design, so get it right; adding a new asset class after this phase
  should mean adding a new strategy, not branching existing code.
- **Acquisition**: fundamentals data source(s) per asset class — likely widens the Phase 4
  provider decision; ask before adding a new provider dependency.

---

## Phase 9 — Historical "What-If" Simulations ⬜

**Usable product:** user runs a what-if simulation ("if I'd invested R$50k in Tesouro Selic in
Jan 2019", "if I'd bought PETR4 monthly", "if I'd rebalanced every 6 months") and gets final value,
CAGR, max drawdown, volatility, and benchmark comparison.

- **Domain**: simulation engine supporting initial investment, periodic contributions, dividend
  reinvestment, rebalancing, inflation adjustment — composed from Phases 3–7's existing
  calculations, not reimplemented.
- **Async**: runs as a Celery job per ARCHITECTURE.md ("long-running work ... returns a job handle
  immediately"); frontend polls for results.

---

## Phase 10 — Future Projections (Probabilistic) ⬜

**Usable product:** user requests a projection using a selected model (historical average,
exponentially weighted average, CAPM, Monte Carlo, bootstrap resampling — Fama-French/ARIMA/GARCH
as capacity allows) and sees a probabilistic scenario: confidence intervals, stated assumptions,
stated limitations, never a bare predicted number.

- **New dependencies likely needed**: `arch` (GARCH), `pmdarima`/`statsmodels` (ARIMA) — add only
  when a specific model is implemented, not preemptively.
- **Async**: Celery job + polling, same pattern as Phase 9.
- **This phase is where ARCHITECTURE.md §3 (label every probabilistic output) is most load-bearing
  — treat it as a hard API contract, not a UI nicety.**

---

## Phase 11 — Portfolio Optimization ⬜

**Usable product:** user sets constraints (max/min allocation per asset, asset-class limits,
country limits) and gets an efficient frontier, max-Sharpe portfolio, min-variance portfolio, and
risk-parity suggestion, comparable against their current allocation.

- **New dependencies likely needed**: `PyPortfolioOpt` and/or `cvxpy`.
- **Domain**: builds on Phase 7's covariance/return calculations — reuse, don't reimplement.
- Black-Litterman and Hierarchical Risk Parity are explicitly future enhancements per CLAUDE.md —
  not in this phase's scope.

---

## Backlog — Not Scheduled

Per CLAUDE.md's "Future Features": tax optimization, automatic rebalancing suggestions,
AI-generated portfolio reports, goal-based investing, retirement planning, scenario stress
testing, factor investing analysis, ML models, portfolio health score, financial planning
assistant. None of these are sequenced yet — pull one into a numbered phase only when explicitly
prioritized, since each needs its own scoping discussion.

---

## Cross-cutting, not a phase

Some ARCHITECTURE.md/CLAUDE.md requirements apply to *every* phase above rather than being their
own step — don't schedule them separately, just check them at each phase's Definition of Done:
multi-tenancy scoping, acquisition/domain separation, test coverage with hand-verified values,
explainability per metric, and labeling of probabilistic outputs.

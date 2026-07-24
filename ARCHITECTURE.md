# Architecture Decisions

This file records binding technical decisions for this project. It complements `CLAUDE.md` (product vision/goals). Follow these decisions in every session unless the user explicitly changes one — if you believe a decision should change, ask before deviating.

---

## Tech Stack (decided)

- **Backend & calculation engine: Python (FastAPI)**
  Rationale: the financial/statistical modeling ecosystem (`numpy`, `pandas`, `scipy`, `statsmodels`, `arch` for GARCH, `PyPortfolioOpt`/`cvxpy` for optimization, `arch`/`pmdarima` for ARIMA) is unmatched elsewhere and directly serves CLAUDE.md's requirement for peer-reviewed, reproducible, testable methodologies. Do not introduce a second backend language for calculation logic.
- **Database: PostgreSQL**
  Relational schema for portfolios, transactions, cash flows, positions. Consider a TimescaleDB extension later if dense price-history storage/query performance demands it — do not add it preemptively.
- **Async job processing: Celery (or RQ) + Redis**
  Any long-running computation (Monte Carlo runs, bootstrap resampling, bulk simulations, backtests) MUST run as a background job, not inline in an HTTP request handler.
- **Frontend: React + TypeScript**
  Charting library chosen per-dashboard as needed (Recharts as default; visx/ECharts if finer control is required). Consult the `dataviz` skill before building any chart/dashboard UI.

Do not swap any of these without discussing it with the user first — these were chosen deliberately after weighing alternatives (e.g. a full-TypeScript stack was considered and rejected because Python's numerical ecosystem is central to the project's correctness requirements).

---

## Mandatory Architectural Boundaries

### 1. Data acquisition is a separate module from calculation

There must be a clear, enforced boundary between:
- **Data acquisition layer**: fetches/normalizes external data (market prices, CDI/SELIC/IPCA from BCB, Ibovespa/S&P 500/Nasdaq, FX rates, fundamentals). This layer knows about HTTP, API keys, rate limits, provider-specific response shapes.
- **Calculation layer**: pure functions/services operating on already-normalized internal data structures (e.g. a `PriceSeries`, `Portfolio`, `CashFlow` domain type). This layer MUST NOT know about external providers, HTTP, or API credentials.

Why: swapping a data provider must never require touching financial math, and financial math must be testable with static fixture data, no network calls.

When adding a new metric or model: put fetching/parsing in the acquisition layer, put the formula in the calculation layer, and wire them together in a service/orchestration layer above both.

### 2. Multi-tenancy from day one

The product is single-user today but is explicitly intended to become a SaaS. Every table that stores user-owned data (portfolios, positions, transactions, simulations, saved projections, optimization runs, etc.) MUST include a `user_id` (or `tenant_id`) foreign key from the very first migration, even while auth is trivial/hardcoded. Every query MUST be scoped by it. Do not build single-tenant schemas "for now" — retrofitting tenancy later is expensive and error-prone.

### 3. Deterministic vs. probabilistic outputs must be labeled

Per CLAUDE.md, projections are never certainty. Any API response or UI surface for a projection/simulation must carry: which model was used, its assumptions, and confidence intervals where applicable. Do not return a bare number for a probabilistic estimate — always the model context alongside it.

---

## Testing Requirements

- Every financial calculation (metric, ratio, model) MUST have unit tests with known/hand-verified expected values (from textbook examples or reference implementations), not just "does it run."
- Calculation-layer tests MUST NOT hit the network or the database — pure input/output tests on domain types.
- Data acquisition layer tests use mocked/fixture HTTP responses, not live API calls.

---

## API & Service Conventions

- FastAPI endpoints are thin: validate input, call a service function, return output. No calculation logic inline in route handlers.
- Long-running work (simulations, optimizations, Monte Carlo) returns a job handle immediately; the client polls or subscribes for results. Do not block a request thread on heavy computation.
- New asset classes (per CLAUDE.md's extensibility requirement) must plug into the existing asset-analysis interface rather than branching with type-checks scattered across the codebase — favor a strategy/registry pattern keyed by asset class.

---

## Open / Not Yet Decided

These will be decided as they come up — do not assume an answer, ask:
- Auth provider/strategy (deferred while single-user; must be pluggable later)
- Specific market data provider(s) for Brazilian and US instruments
- Deployment target/infra
- Frontend state management library
- Whether TimescaleDB is adopted

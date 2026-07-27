@ARCHITECTURE.md
@ROADMAP.md

# Project Overview

This project is an advanced investment portfolio management platform focused on helping investors analyze, compare, simulate, and optimize their investments using modern financial, statistical, and economic models.

The platform is intended to evolve beyond a simple portfolio tracker and become a decision-support system for investors.

Every feature should prioritize:
- Financial accuracy
- Mathematical correctness
- Clear visualizations
- Performance
- Extensibility
- Explainability of calculations

---

# Main Goals

The application should provide tools to:

1. Track an investor's portfolio over time.
2. Analyze historical performance.
3. Compare investments against benchmarks.
4. Simulate alternative investment scenarios.
5. Estimate future outcomes using validated financial models.
6. Optimize portfolio allocation based on modern portfolio theory.
7. Help investors understand risk, not only returns.

---

# Core Modules

## Portfolio Tracking

The system must allow users to:

- Register all assets.
- Track historical positions.
- Track cash flow.
- Track dividends and interest.
- Track realized and unrealized gains.
- Calculate average purchase price.
- Calculate allocation by:
    - Asset
    - Asset class
    - Sector
    - Country
    - Currency

The dashboard should expose rich visualizations such as:

- Portfolio value over time
- Asset allocation
- Historical returns
- Drawdown history
- Cash flow history

---

## Benchmark Comparison

Users should be able to compare:

- Individual assets
- Selected assets
- Entire portfolio

Against one or multiple benchmarks, including:

- CDI
- SELIC
- IPCA
- Ibovespa
- S&P 500
- Nasdaq
- Dollar exchange rate
- Other supported indices

Comparisons should include:

- Absolute return
- Real return (inflation adjusted)
- Annualized return
- Volatility
- Risk-adjusted performance
- Drawdown

---

## Asset Analysis

The platform should expose relevant financial metrics depending on asset type.

Examples:

Stocks:
- P/E
- P/B
- ROE
- ROIC
- Dividend Yield
- Earnings Growth
- Revenue Growth

Fixed Income:
- Yield to Maturity
- Duration
- Modified Duration

Funds:
- Historical returns
- Sharpe Ratio
- Maximum Drawdown

The architecture must allow new asset classes to be added without major refactoring.

---

## Historical Simulations

Provide "What If" simulations.

Examples:

"If I had invested R$50,000 in Tesouro Selic in January 2019..."

"If I had bought PETR4 monthly..."

"If I had rebalanced every 6 months..."

The simulation engine should support:

- Initial investment
- Periodic contributions
- Dividend reinvestment
- Rebalancing
- Inflation adjustment

Simulation results should include:

- Final value
- CAGR
- Maximum Drawdown
- Volatility
- Benchmark comparison

---

## Future Projections

Future projections must never present predictions as certainty.

Instead, projections should be presented as probabilistic scenarios.

Preferred models include:

- Historical average return
- Exponentially weighted averages
- CAPM
- Fama-French factors
- Monte Carlo Simulation
- Bootstrap resampling
- ARIMA
- GARCH

The application should always explain:

- Which model was used
- Assumptions
- Confidence intervals
- Limitations

---

## Portfolio Optimization

Provide portfolio optimization tools based on validated financial theory.

Examples:

- Modern Portfolio Theory (Markowitz)
- Efficient Frontier
- Maximum Sharpe Portfolio
- Minimum Variance Portfolio
- Risk Parity
- Black-Litterman (future enhancement)
- Hierarchical Risk Parity (future enhancement)

Users should be able to define constraints such as:

- Maximum allocation per asset
- Minimum allocation
- Asset class limits
- Country limits

---

## Risk Analysis

Risk is a first-class feature.

The platform should calculate:

- Volatility
- Maximum Drawdown
- Value at Risk (VaR)
- Conditional Value at Risk (CVaR)
- Beta
- Correlation Matrix
- Covariance Matrix
- Sharpe Ratio
- Sortino Ratio
- Calmar Ratio
- Information Ratio

---

# Financial Principles

Every financial calculation should prioritize academic and industry-standard methodologies.

Avoid proprietary or ad-hoc formulas when validated alternatives exist.

Whenever possible:

- Use peer-reviewed methodologies.
- Keep formulas transparent.
- Document assumptions.
- Keep calculations reproducible.

---

# Explainability

Every metric should include an explanation answering:

- What it means.
- Why it matters.
- How it was calculated.
- Interpretation of good and bad values.

The platform should educate users instead of only displaying numbers.

---

# Future Features

Potential future modules include:

- Tax optimization
- Automatic rebalancing suggestions
- AI-generated portfolio reports
- Goal-based investing
- Retirement planning
- Scenario stress testing
- Factor investing analysis
- Machine Learning models
- Portfolio health score
- Financial planning assistant

---

# Development Principles

- Prioritize correctness over complexity.
- Keep financial calculations fully testable.
- Every calculation should have unit tests.
- Avoid duplicated financial logic.
- Separate data acquisition from calculation.
- Make algorithms reusable.
- Prefer deterministic calculations whenever possible.
- Design for long-term maintainability.

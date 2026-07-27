const LOGIN_ROUTE = "/login";
const REGISTER_ROUTE = "/register";
const DASHBOARD_ROUTE = "/";
const PORTFOLIOS_ROUTE = "/portfolios";
const PORTFOLIO_DETAIL_ROUTE = "/portfolios/:portfolioId";
const NOT_FOUND_ROUTE = "*";

function portfolioDetailRoute(portfolioId: string): string {
  return `/portfolios/${portfolioId}`;
}

export {
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DASHBOARD_ROUTE,
  PORTFOLIOS_ROUTE,
  PORTFOLIO_DETAIL_ROUTE,
  NOT_FOUND_ROUTE,
  portfolioDetailRoute,
};

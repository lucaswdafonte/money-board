import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { DASHBOARD_ROUTE, PORTFOLIOS_ROUTE } from '../constants/routes'

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav-links">
          <Link to={DASHBOARD_ROUTE} className="app-nav-brand">
            Money Board
          </Link>
          <Link to={PORTFOLIOS_ROUTE}>Portfolios</Link>
        </div>
        <div className="app-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

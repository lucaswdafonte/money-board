import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from '../theme/ThemeToggle'
import { DASHBOARD_ROUTE, PORTFOLIOS_ROUTE } from '../constants/routes'

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-center gap-6">
          <Link to={DASHBOARD_ROUTE} className="text-lg font-semibold text-foreground">
            Money Board
          </Link>
          <Link to={PORTFOLIOS_ROUTE} className="text-muted-foreground hover:text-foreground">
            Portfolios
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <ThemeToggle />
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

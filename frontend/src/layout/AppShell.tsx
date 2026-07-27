import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-nav">
        <span className="app-nav-brand">Money Board</span>
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

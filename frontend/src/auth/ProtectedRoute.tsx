import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { LOGIN_ROUTE } from '../constants/routes'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p className="mt-16 text-center text-muted-foreground">Loading…</p>
  if (!user) return <Navigate to={LOGIN_ROUTE} replace />

  return <Outlet />
}

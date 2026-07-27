import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RegisterPage } from './auth/RegisterPage'
import { AppShell } from './layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import './App.css'
import { DASHBOARD_ROUTE, LOGIN_ROUTE, NOT_FOUND_ROUTE, REGISTER_ROUTE } from './constants/routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={LOGIN_ROUTE} element={<LoginPage />} />
          <Route path={REGISTER_ROUTE} element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path={DASHBOARD_ROUTE} element={<DashboardPage />} />
            </Route>
          </Route>
          <Route path={NOT_FOUND_ROUTE} element={<Navigate to={DASHBOARD_ROUTE} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

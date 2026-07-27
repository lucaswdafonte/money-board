import { Link } from 'react-router-dom'
import { PORTFOLIOS_ROUTE } from '../constants/routes'

export function DashboardPage() {
  return (
    <div className="empty-state">
      <h1>Dashboard</h1>
      <p>
        Charts and portfolio value over time are coming in a later phase. For now, head to{' '}
        <Link to={PORTFOLIOS_ROUTE}>Portfolios</Link> to create a portfolio and register assets.
      </p>
    </div>
  )
}

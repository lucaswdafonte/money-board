import { Link } from 'react-router-dom'
import { PORTFOLIOS_ROUTE } from '../constants/routes'

export function DashboardPage() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="mb-3 text-3xl font-medium text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">
        Charts and portfolio value over time are coming in a later phase. For now, head to{' '}
        <Link to={PORTFOLIOS_ROUTE} className="text-primary underline-offset-4 hover:underline">
          Portfolios
        </Link>{' '}
        to create a portfolio and register assets.
      </p>
    </div>
  )
}

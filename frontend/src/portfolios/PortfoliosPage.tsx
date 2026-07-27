import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, portfolioApi, type Portfolio } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { GENERIC_ERROR } from '../constants/error_messages'
import { portfolioDetailRoute } from '../constants/routes'

export function PortfoliosPage() {
  const { token } = useAuth()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    portfolioApi
      .list(token)
      .then(setPortfolios)
      .catch(() => setError(GENERIC_ERROR))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      const portfolio = await portfolioApi.create(token, name.trim())
      setPortfolios((current) => [...current, portfolio])
      setName('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p className="status-message">Loading portfolios…</p>

  return (
    <div className="portfolios-page">
      <h1>Portfolios</h1>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Portfolio name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={200}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create portfolio'}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}

      {portfolios.length === 0 ? (
        <p>You don't have any portfolios yet. Create one above to start registering assets.</p>
      ) : (
        <ul className="portfolio-list">
          {portfolios.map((portfolio) => (
            <li key={portfolio.id}>
              <Link to={portfolioDetailRoute(portfolio.id)}>{portfolio.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

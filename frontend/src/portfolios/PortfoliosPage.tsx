import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

  if (isLoading)
    return <p className="mt-16 text-center text-muted-foreground">Loading portfolios…</p>

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-medium text-foreground">Portfolios</h1>

      <form className="my-6 flex gap-3" onSubmit={handleCreate}>
        <Input
          type="text"
          placeholder="Portfolio name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={200}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create portfolio'}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {portfolios.length === 0 ? (
        <p className="text-muted-foreground">
          You don't have any portfolios yet. Create one above to start registering assets.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {portfolios.map((portfolio) => (
            <li key={portfolio.id}>
              <Card className="px-4 py-3">
                <Link
                  to={portfolioDetailRoute(portfolio.id)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {portfolio.name}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError, assetApi, portfolioApi, type Asset, type AssetInput, type Portfolio } from '../api/client'
import { AssetForm } from '../assets/AssetForm'
import { useAuth } from '../auth/useAuth'
import { ASSET_CLASS_LABELS } from '../constants/asset_classes'
import { GENERIC_ERROR } from '../constants/error_messages'

export function PortfolioDetailPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const { token } = useAuth()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!token || !portfolioId) return
    Promise.all([portfolioApi.get(token, portfolioId), assetApi.list(token, portfolioId)])
      .then(([portfolioResult, assetsResult]) => {
        setPortfolio(portfolioResult)
        setAssets(assetsResult)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : GENERIC_ERROR))
      .finally(() => setIsLoading(false))
  }, [token, portfolioId])

  async function handleAdd(input: AssetInput) {
    if (!token || !portfolioId) return
    const asset = await assetApi.create(token, portfolioId, input)
    setAssets((current) => [...current, asset])
    setIsAdding(false)
  }

  async function handleUpdate(assetId: string, input: AssetInput) {
    if (!token || !portfolioId) return
    const updated = await assetApi.update(token, portfolioId, assetId, input)
    setAssets((current) => current.map((asset) => (asset.id === assetId ? updated : asset)))
    setEditingAssetId(null)
  }

  async function handleDelete(assetId: string) {
    if (!token || !portfolioId) return
    await assetApi.delete(token, portfolioId, assetId)
    setAssets((current) => current.filter((asset) => asset.id !== assetId))
  }

  if (isLoading)
    return <p className="mt-16 text-center text-muted-foreground">Loading portfolio…</p>
  if (error || !portfolio)
    return <p className="mt-16 text-center text-destructive">{error ?? 'Portfolio not found'}</p>

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-medium text-foreground">{portfolio.name}</h1>

      <section>
        <div className="mt-8 mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-foreground">Assets</h2>
          {!isAdding && (
            <Button variant="outline" onClick={() => setIsAdding(true)}>
              Add asset
            </Button>
          )}
        </div>

        {isAdding && (
          <AssetForm submitLabel="Add asset" onSubmit={handleAdd} onCancel={() => setIsAdding(false)} />
        )}

        {assets.length === 0 ? (
          <p className="text-muted-foreground">No assets registered yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) =>
                editingAssetId === asset.id ? (
                  <TableRow key={asset.id}>
                    <TableCell colSpan={7}>
                      <AssetForm
                        initial={{
                          ticker: asset.ticker,
                          name: asset.name,
                          asset_class: asset.asset_class,
                          sector: asset.sector,
                          country: asset.country,
                          currency: asset.currency,
                        }}
                        submitLabel="Save changes"
                        onSubmit={(input) => handleUpdate(asset.id, input)}
                        onCancel={() => setEditingAssetId(null)}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.ticker}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{ASSET_CLASS_LABELS[asset.asset_class]}</TableCell>
                    <TableCell>{asset.sector ?? '—'}</TableCell>
                    <TableCell>{asset.country ?? '—'}</TableCell>
                    <TableCell>{asset.currency}</TableCell>
                    <TableCell className="flex gap-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAssetId(asset.id)}
                      >
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(asset.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

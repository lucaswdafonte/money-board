import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

  if (isLoading) return <p className="status-message">Loading portfolio…</p>
  if (error || !portfolio) return <p className="form-error">{error ?? 'Portfolio not found'}</p>

  return (
    <div className="portfolio-detail-page">
      <h1>{portfolio.name}</h1>

      <section>
        <div className="section-header">
          <h2>Assets</h2>
          {!isAdding && (
            <button type="button" onClick={() => setIsAdding(true)}>
              Add asset
            </button>
          )}
        </div>

        {isAdding && (
          <AssetForm submitLabel="Add asset" onSubmit={handleAdd} onCancel={() => setIsAdding(false)} />
        )}

        {assets.length === 0 ? (
          <p>No assets registered yet.</p>
        ) : (
          <table className="asset-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th>Class</th>
                <th>Sector</th>
                <th>Country</th>
                <th>Currency</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) =>
                editingAssetId === asset.id ? (
                  <tr key={asset.id}>
                    <td colSpan={7}>
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
                    </td>
                  </tr>
                ) : (
                  <tr key={asset.id}>
                    <td>{asset.ticker}</td>
                    <td>{asset.name}</td>
                    <td>{ASSET_CLASS_LABELS[asset.asset_class]}</td>
                    <td>{asset.sector ?? '—'}</td>
                    <td>{asset.country ?? '—'}</td>
                    <td>{asset.currency}</td>
                    <td className="asset-actions">
                      <button type="button" onClick={() => setEditingAssetId(asset.id)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(asset.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

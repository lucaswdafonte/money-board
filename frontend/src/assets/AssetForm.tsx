import { useState, type FormEvent } from 'react'
import type { AssetClass, AssetInput } from '../api/client'
import { ApiError } from '../api/client'
import { ASSET_CLASSES, ASSET_CLASS_LABELS } from '../constants/asset_classes'
import { GENERIC_ERROR } from '../constants/error_messages'

interface AssetFormProps {
  initial?: AssetInput
  submitLabel: string
  onSubmit: (input: AssetInput) => Promise<void>
  onCancel?: () => void
}

const EMPTY_ASSET: AssetInput = {
  ticker: '',
  name: '',
  asset_class: 'stock',
  sector: '',
  country: '',
  currency: '',
}

export function AssetForm({ initial, submitLabel, onSubmit, onCancel }: AssetFormProps) {
  const [values, setValues] = useState<AssetInput>(initial ?? EMPTY_ASSET)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        ticker: values.ticker.trim().toUpperCase(),
        name: values.name.trim(),
        asset_class: values.asset_class,
        sector: values.sector?.trim() || null,
        country: values.country?.trim() || null,
        currency: values.currency.trim().toUpperCase(),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <label>
        Ticker
        <input
          value={values.ticker}
          onChange={(event) => setValues({ ...values, ticker: event.target.value })}
          required
          maxLength={20}
        />
      </label>
      <label>
        Name
        <input
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          required
          maxLength={200}
        />
      </label>
      <label>
        Asset class
        <select
          value={values.asset_class}
          onChange={(event) =>
            setValues({ ...values, asset_class: event.target.value as AssetClass })
          }
        >
          {ASSET_CLASSES.map((assetClass) => (
            <option key={assetClass} value={assetClass}>
              {ASSET_CLASS_LABELS[assetClass]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sector
        <input
          value={values.sector ?? ''}
          onChange={(event) => setValues({ ...values, sector: event.target.value })}
          maxLength={100}
        />
      </label>
      <label>
        Country
        <input
          value={values.country ?? ''}
          onChange={(event) => setValues({ ...values, country: event.target.value })}
          maxLength={100}
        />
      </label>
      <label>
        Currency
        <input
          value={values.currency}
          onChange={(event) => setValues({ ...values, currency: event.target.value })}
          required
          maxLength={3}
          placeholder="USD"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="asset-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

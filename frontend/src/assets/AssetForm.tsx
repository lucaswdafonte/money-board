import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    <form
      className="mb-4 flex flex-wrap gap-4 rounded-lg border border-border p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="ticker">Ticker</Label>
        <Input
          id="ticker"
          value={values.ticker}
          onChange={(event) => setValues({ ...values, ticker: event.target.value })}
          required
          maxLength={20}
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          required
          maxLength={200}
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="asset_class">Asset class</Label>
        <Select
          value={values.asset_class}
          onValueChange={(value) => setValues({ ...values, asset_class: value as AssetClass })}
        >
          <SelectTrigger id="asset_class" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CLASSES.map((assetClass) => (
              <SelectItem key={assetClass} value={assetClass}>
                {ASSET_CLASS_LABELS[assetClass]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="sector">Sector</Label>
        <Input
          id="sector"
          value={values.sector ?? ''}
          onChange={(event) => setValues({ ...values, sector: event.target.value })}
          maxLength={100}
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={values.country ?? ''}
          onChange={(event) => setValues({ ...values, country: event.target.value })}
          maxLength={100}
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="currency">Currency</Label>
        <Input
          id="currency"
          value={values.currency}
          onChange={(event) => setValues({ ...values, currency: event.target.value })}
          required
          maxLength={3}
          placeholder="USD"
        />
      </div>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

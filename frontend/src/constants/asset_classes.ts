import type { AssetClass } from '../api/client'

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Stock',
  fixed_income: 'Fixed Income',
  fund: 'Fund',
  real_estate: 'Real Estate',
  crypto: 'Crypto',
  cash: 'Cash',
  other: 'Other',
}

export const ASSET_CLASSES = Object.keys(ASSET_CLASS_LABELS) as AssetClass[]

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const body: { detail?: string } | null = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.detail ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export interface Token {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
}

function register(email: string, password: string) {
  return request<Token>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
}

function login(email: string, password: string) {
  return request<Token>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

function me(token: string) {
  return request<User>('/auth/me', {}, token)
}

export const authApi = {
  register,
  login,
  me,
}

export interface Portfolio {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type AssetClass =
  | 'stock'
  | 'fixed_income'
  | 'fund'
  | 'real_estate'
  | 'crypto'
  | 'cash'
  | 'other'

export interface Asset {
  id: string
  portfolio_id: string
  ticker: string
  name: string
  asset_class: AssetClass
  sector: string | null
  country: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface AssetInput {
  ticker: string
  name: string
  asset_class: AssetClass
  sector?: string | null
  country?: string | null
  currency: string
}

function listPortfolios(token: string) {
  return request<Portfolio[]>('/portfolios', {}, token)
}

function createPortfolio(token: string, name: string) {
  return request<Portfolio>('/portfolios', { method: 'POST', body: JSON.stringify({ name }) }, token)
}

function getPortfolio(token: string, portfolioId: string) {
  return request<Portfolio>(`/portfolios/${portfolioId}`, {}, token)
}

function updatePortfolio(token: string, portfolioId: string, name: string) {
  return request<Portfolio>(
    `/portfolios/${portfolioId}`,
    { method: 'PATCH', body: JSON.stringify({ name }) },
    token,
  )
}

function deletePortfolio(token: string, portfolioId: string) {
  return request<void>(`/portfolios/${portfolioId}`, { method: 'DELETE' }, token)
}

export const portfolioApi = {
  list: listPortfolios,
  create: createPortfolio,
  get: getPortfolio,
  update: updatePortfolio,
  delete: deletePortfolio,
}

function listAssets(token: string, portfolioId: string) {
  return request<Asset[]>(`/portfolios/${portfolioId}/assets`, {}, token)
}

function createAsset(token: string, portfolioId: string, input: AssetInput) {
  return request<Asset>(
    `/portfolios/${portfolioId}/assets`,
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}

function updateAsset(token: string, portfolioId: string, assetId: string, input: Partial<AssetInput>) {
  return request<Asset>(
    `/portfolios/${portfolioId}/assets/${assetId}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    token,
  )
}

function deleteAsset(token: string, portfolioId: string, assetId: string) {
  return request<void>(`/portfolios/${portfolioId}/assets/${assetId}`, { method: 'DELETE' }, token)
}

export const assetApi = {
  list: listAssets,
  create: createAsset,
  update: updateAsset,
  delete: deleteAsset,
}

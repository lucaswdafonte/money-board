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

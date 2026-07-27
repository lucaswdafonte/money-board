import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, authApi, type User } from '../api/client'
import { AuthContext } from './context'
import { GENERIC_ERROR } from '../constants/error_messages'

const TOKEN_STORAGE_KEY = 'money-board.token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    authApi
      .me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const persistToken = useCallback((accessToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    setToken(accessToken)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      try {
        const result = await authApi.login(email, password)
        persistToken(result.access_token)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : GENERIC_ERROR)
        throw err
      }
    },
    [persistToken],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      setError(null)
      try {
        const result = await authApi.register(email, password)
        persistToken(result.access_token)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : GENERIC_ERROR)
        throw err
      }
    },
    [persistToken],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, error, login, register, logout }),
    [user, token, isLoading, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { useState, type FormEvent, type ReactNode } from 'react'

interface AuthFormProps {
  title: string
  submitLabel: string
  passwordAutoComplete: 'current-password' | 'new-password'
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  footer: ReactNode
}

export function AuthForm({
  title,
  submitLabel,
  passwordAutoComplete,
  error,
  onSubmit,
  footer,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(email, password)
    } catch {
      // AuthProvider already captured this in `error`; nothing else to do here.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{title}</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={passwordAutoComplete}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait…' : submitLabel}
        </button>
        {footer}
      </form>
    </div>
  )
}

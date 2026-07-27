import { Link, useNavigate } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { useAuth } from './useAuth'
import { REGISTER_ROUTE } from '../constants/routes'

export function LoginPage() {
  const { login, error } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      passwordAutoComplete="current-password"
      error={error}
      onSubmit={async (email, password) => {
        await login(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <p>
          No account yet? <Link to={REGISTER_ROUTE}>Register</Link>
        </p>
      }
    />
  )
}

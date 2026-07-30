import { Link, useNavigate } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { useAuth } from './useAuth'
import { LOGIN_ROUTE } from '../constants/routes'

export function RegisterPage() {
  const { register, error } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Create an account"
      submitLabel="Register"
      passwordAutoComplete="new-password"
      error={error}
      onSubmit={async (email, password) => {
        await register(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <p>
          Already have an account?{' '}
          <Link to={LOGIN_ROUTE} className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      }
    />
  )
}

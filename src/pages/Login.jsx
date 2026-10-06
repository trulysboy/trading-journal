import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    const { error } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup') {
      setInfo('Account created. Check your email to confirm, then sign in.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Truly's Trading Journal</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Log in to your journal' : 'Create your journal account'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setInfo('')
          }}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}

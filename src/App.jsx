import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

function AppInner() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <p>Loading…</p>
      </div>
    )
  }

  return session ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

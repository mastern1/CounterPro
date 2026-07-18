import { AuthProvider, useAuth } from '@/context/AuthContext'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'

function Gate() {
  const { session, loading } = useAuth()

  if (loading) return null
  return session ? <Dashboard /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

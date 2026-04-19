import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('aurelia_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post<User>('/auth/login', { email, password })
    _persist(data)
  }

  const register = async (email: string, password: string, fullName: string) => {
    const { data } = await api.post<User>('/auth/register', { email, password, fullName })
    _persist(data)
  }

  const logout = () => {
    localStorage.removeItem('aurelia_token')
    localStorage.removeItem('aurelia_user')
    setUser(null)
  }

  const _persist = (data: User) => {
    localStorage.setItem('aurelia_token', data.token)
    localStorage.setItem('aurelia_user', JSON.stringify(data))
    setUser(data)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

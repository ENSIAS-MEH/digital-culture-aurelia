import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, setUnauthorizedHandler } from '@/lib/api'
import { Storage } from '@/lib/storage'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Storage.getUser().then((saved) => {
      if (saved) setUser(saved)
      setLoading(false)
    })

    setUnauthorizedHandler(async () => {
      await Storage.clear()
      setUser(null)
    })
  }, [])

  const _persist = async (data: User) => {
    await Storage.setToken(data.token)
    await Storage.setUser(data)
    setUser(data)
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post<User>('/auth/login', { email, password })
    await _persist(data)
  }

  const register = async (email: string, password: string, fullName: string) => {
    const { data } = await api.post<User>('/auth/register', { email, password, fullName })
    await _persist(data)
  }

  const logout = async () => {
    await Storage.clear()
    setUser(null)
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

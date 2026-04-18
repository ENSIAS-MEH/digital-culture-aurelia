import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="aurora-bg min-h-screen flex items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-aurelia-primary/30 border-t-aurelia-primary" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="aurora-bg min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0 p-6 pt-16 lg:pt-6">
        {children}
      </main>
    </div>
  )
}

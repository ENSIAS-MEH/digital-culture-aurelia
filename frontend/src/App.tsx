import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout/Layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import Chat from '@/pages/Chat'
import Transactions from '@/pages/Transactions'
import Insights from '@/pages/Insights'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />

        {/* Protected (Layout handles auth redirect) */}
        <Route path="/dashboard"    element={<Layout><Dashboard /></Layout>} />
        <Route path="/documents"    element={<Layout><Documents /></Layout>} />
        <Route path="/chat"         element={<Layout><Chat /></Layout>} />
        <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
        <Route path="/insights"     element={<Layout><Insights /></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

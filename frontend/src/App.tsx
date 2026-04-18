import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import Chat from '@/pages/Chat'
import Transactions from '@/pages/Transactions'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected (Layout handles auth redirect) */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/documents"    element={<Layout><Documents /></Layout>} />
        <Route path="/chat"         element={<Layout><Chat /></Layout>} />
        <Route path="/transactions" element={<Layout><Transactions /></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

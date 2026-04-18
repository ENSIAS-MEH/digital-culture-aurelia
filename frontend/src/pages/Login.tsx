import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="aurora-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles size={28} className="text-aurelia-accent" />
            <span className="font-heading font-bold text-3xl text-aurelia-text">Aurelia</span>
          </div>
          <p className="text-aurelia-muted">Your AI-powered finance advisor</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-aurelia-primary/20 p-8 backdrop-blur-[12px]"
          style={{ background: 'rgba(124,58,237,0.07)' }}
        >
          <h1 className="font-heading font-semibold text-2xl text-aurelia-text mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="text-sm text-aurelia-danger bg-aurelia-danger/10 border border-aurelia-danger/30 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-aurelia-muted">
            No account yet?{' '}
            <Link to="/register" className="text-aurelia-secondary hover:text-aurelia-text transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

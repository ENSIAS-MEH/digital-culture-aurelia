import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react'
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
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.6), transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.6), transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
            className="inline-flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #D946EF)',
                boxShadow: '0 0 32px rgba(124,58,237,0.6), 0 0 64px rgba(217,70,239,0.25)',
              }}>
              <Zap size={26} fill="white" className="text-white" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-3xl gradient-text tracking-tight">Aurelia</h1>
              <p className="text-aurelia-muted text-sm mt-1">Your AI-powered finance advisor</p>
            </div>
          </motion.div>
        </div>

        {/* Card */}
        <div className="glass-card-gradient p-8">
          <h2 className="font-heading font-bold text-xl text-aurelia-text mb-6">Welcome back</h2>

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
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-aurelia-danger bg-aurelia-danger/8 border border-aurelia-danger/25 rounded-xl px-4 py-2.5"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-2 gap-2">
              Sign in <ArrowRight size={15} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-aurelia-muted">
            No account yet?{' '}
            <Link to="/register" className="text-aurelia-secondary font-medium hover:text-white transition-colors duration-150">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

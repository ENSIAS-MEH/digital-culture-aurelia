import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(email, password, fullName)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles size={28} className="text-aurelia-accent" />
            <span className="font-heading font-bold text-3xl text-aurelia-text">Aurelia</span>
          </div>
          <p className="text-aurelia-muted">Start your AI finance journey</p>
        </div>

        <div
          className="rounded-2xl border border-aurelia-primary/20 p-8 backdrop-blur-[12px]"
          style={{ background: 'rgba(124,58,237,0.07)' }}
        >
          <h1 className="font-heading font-semibold text-2xl text-aurelia-text mb-6">Create account</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
              icon={<User size={16} />}
              autoComplete="name"
            />
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
              placeholder="Min 8 characters"
              icon={<Lock size={16} />}
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="text-sm text-aurelia-danger bg-aurelia-danger/10 border border-aurelia-danger/30 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-aurelia-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-aurelia-secondary hover:text-aurelia-text transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

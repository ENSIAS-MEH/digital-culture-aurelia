import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, MessageSquare,
  CreditCard, LogOut, Zap, Menu, X, Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { clsx } from 'clsx'

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/documents',    icon: FileText,         label: 'Documents'    },
  { to: '/chat',         icon: MessageSquare,    label: 'Chat'         },
  { to: '/transactions', icon: CreditCard,       label: 'Transactions' },
  { to: '/insights',     icon: Sparkles,         label: 'Insights'     },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: 'rgba(11,10,30,0.9)',
          border: '1px solid rgba(124,58,237,0.3)',
          backdropFilter: 'blur(12px)',
        }}
        aria-label="Open navigation"
      >
        <Menu size={20} className="text-aurelia-text" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        className={clsx(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col',
          'lg:static lg:translate-x-0',
          !open && '-translate-x-full lg:translate-x-0',
        )}
        style={{
          background: 'rgba(8,7,20,0.92)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(124,58,237,0.15)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #D946EF)',
                boxShadow: '0 0 16px rgba(124,58,237,0.5), 0 0 32px rgba(217,70,239,0.2)',
              }}>
              <Zap size={18} fill="white" className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl gradient-text">Aurelia</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden cursor-pointer text-aurelia-muted hover:text-aurelia-text transition-colors p-1 rounded-lg"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)' }} />

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group',
                  isActive
                    ? 'text-white'
                    : 'text-aurelia-muted hover:text-aurelia-text hover:bg-aurelia-primary/8',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                    isActive
                      ? 'shadow-glow-sm'
                      : 'group-hover:bg-aurelia-primary/10',
                  )}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(217,70,239,0.35))',
                    border: '1px solid rgba(124,58,237,0.4)',
                  } : undefined}>
                    <Icon size={16} className={isActive ? 'text-white' : ''} />
                  </div>
                  <span>{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #D946EF)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-6 space-y-2">
          <div className="mx-1 my-2 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />
          <div className="px-3 py-3 rounded-xl"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}>
            <p className="text-xs text-aurelia-muted mb-0.5">Signed in as</p>
            <p className="text-sm text-aurelia-text truncate font-medium">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-aurelia-muted hover:text-aurelia-danger hover:bg-aurelia-danger/8 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-aurelia-danger/15 transition-colors duration-200">
              <LogOut size={16} />
            </div>
            Sign out
          </button>
        </div>
      </motion.aside>
    </>
  )
}

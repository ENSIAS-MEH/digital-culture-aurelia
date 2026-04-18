import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, MessageSquare,
  CreditCard, LogOut, Sparkles, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { clsx } from 'clsx'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/documents',    icon: FileText,         label: 'Documents'    },
  { to: '/chat',         icon: MessageSquare,    label: 'Chat'         },
  { to: '/transactions', icon: CreditCard,       label: 'Transactions' },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-aurelia-surface border border-aurelia-primary/30 cursor-pointer"
        aria-label="Open navigation"
      >
        <Menu size={20} className="text-aurelia-text" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : undefined }}
        className={clsx(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col',
          'border-r border-aurelia-primary/20',
          'lg:static lg:translate-x-0',
          !open && '-translate-x-full lg:translate-x-0',
        )}
        style={{ background: 'rgba(26,16,64,0.85)', backdropFilter: 'blur(16px)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-aurelia-accent" />
            <span className="font-heading font-bold text-xl text-aurelia-text">Aurelia</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden cursor-pointer text-aurelia-muted hover:text-aurelia-text"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-aurelia-primary/20 text-aurelia-text border border-aurelia-primary/30 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
                    : 'text-aurelia-muted hover:text-aurelia-text hover:bg-aurelia-primary/10',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-6 space-y-2">
          <div className="px-4 py-3 rounded-xl bg-aurelia-primary/10 border border-aurelia-primary/20">
            <p className="text-xs text-aurelia-muted">Signed in as</p>
            <p className="text-sm text-aurelia-text truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-aurelia-muted hover:text-aurelia-danger hover:bg-aurelia-danger/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </motion.aside>
    </>
  )
}

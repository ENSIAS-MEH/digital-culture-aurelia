import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet, FileText, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import type { TransactionSummary, Transaction } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{
        background: 'rgba(11,10,30,0.97)',
        border: '1px solid rgba(124,58,237,0.3)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,70,239,0.1)',
      }}>
      <p className="text-aurelia-muted mb-1">{label}</p>
      <p className="font-semibold" style={{ color: '#F59E0B' }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary]         = useState<TransactionSummary | null>(null)
  const [recent, setRecent]           = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const now  = new Date()
    const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const to   = now.toISOString().slice(0, 10)

    Promise.all([
      api.get(`/transactions/summary?from=${from}&to=${to}`),
      api.get(`/transactions?from=${from}&to=${to}`),
    ]).then(([s, t]) => {
      setSummary(s.data)
      setRecent(t.data.slice(0, 5))
      const byDay: Record<string, number> = {}
      for (const txn of t.data) {
        if (txn.amount < 0)
          byDay[txn.txnDate] = (byDay[txn.txnDate] ?? 0) + Math.abs(txn.amount)
      }
      setMonthlyData(
        Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, amount]) => ({ date: date.slice(5), amount: +amount.toFixed(2) }))
      )
    }).finally(() => setLoading(false))
  }, [])

  const pieColors = summary?.byCategory.map(c => c.categoryColor ?? '#7c3aed') ?? []
  const hasData   = !loading && (summary?.byCategory.length ?? 0) > 0

  const stats = [
    {
      label: 'Total Expenses',
      value: loading ? null : fmt(Math.abs(summary?.totalExpenses ?? 0)),
      icon: TrendingDown,
      color: 'text-aurelia-danger',
      iconContainer: 'icon-container-danger',
      cardBg: 'rgba(244,63,94,0.06)',
      cardBorder: 'rgba(244,63,94,0.18)',
      glow: 'rgba(244,63,94,0.12)',
    },
    {
      label: 'Total Income',
      value: loading ? null : fmt(summary?.totalIncome ?? 0),
      icon: TrendingUp,
      color: 'text-aurelia-success',
      iconContainer: 'icon-container-success',
      cardBg: 'rgba(16,185,129,0.06)',
      cardBorder: 'rgba(16,185,129,0.18)',
      glow: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Net Balance',
      value: loading ? null : fmt(summary?.netBalance ?? 0),
      icon: Wallet,
      color: (summary?.netBalance ?? 0) >= 0 ? 'text-aurelia-success' : 'text-aurelia-danger',
      iconContainer: (summary?.netBalance ?? 0) >= 0 ? 'icon-container-success' : 'icon-container-danger',
      cardBg: (summary?.netBalance ?? 0) >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
      cardBorder: (summary?.netBalance ?? 0) >= 0 ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)',
      glow: (summary?.netBalance ?? 0) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-aurelia-text tracking-tight">Dashboard</h1>
        <p className="text-aurelia-muted text-sm mt-1">Your financial overview — last 90 days</p>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {stats.map(({ label, value, icon: Icon, color, iconContainer, cardBg, cardBorder, glow }) => (
          <motion.div key={label} variants={stagger.item}>
            <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.45), 0 0 40px ${glow}`,
              }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-aurelia-muted font-medium">{label}</p>
                <div className={iconContainer}>
                  <Icon size={16} className={color} />
                </div>
              </div>
              {loading
                ? <Skeleton className="h-8 w-36" />
                : <p className={`text-2xl font-heading font-bold tracking-tight ${color}`}>{value}</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <GlassCard>
          <h2 className="font-heading font-semibold text-aurelia-text mb-4 text-base">Spending by Category</h2>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : !hasData ? (
            <EmptyChart
              icon={<FileText size={28} className="text-aurelia-primary/40" />}
              message="No expense data yet"
              action="Upload a statement" onAction={() => navigate('/documents')} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={summary!.byCategory} dataKey="total" nameKey="categoryName"
                    cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}
                    strokeWidth={0}>
                    {summary!.byCategory.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [fmt(Math.abs(v)), '']}
                    contentStyle={{
                      background: 'rgba(11,10,30,0.97)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 12,
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#F5F3FF', fontSize: 12 }}
                    itemStyle={{ color: '#9090B0', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {summary?.byCategory.map((c) => (
                  <Badge key={c.categoryName} label={`${c.categoryName ?? 'Other'} · ${fmt(Math.abs(c.total))}`}
                    color={c.categoryColor} size="sm" />
                ))}
              </div>
            </>
          )}
        </GlassCard>

        {/* Area chart */}
        <GlassCard>
          <h2 className="font-heading font-semibold text-aurelia-text mb-4 text-base">Daily Spending</h2>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : monthlyData.length === 0 ? (
            <EmptyChart
              icon={<TrendingDown size={28} className="text-aurelia-primary/40" />}
              message="No transactions in range"
              action="Upload a statement" onAction={() => navigate('/documents')} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D946EF" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#7C3AED" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#D946EF" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9090B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount"
                  stroke="url(#lineGrad)" strokeWidth={2.5}
                  fill="url(#spendGrad)" dot={false}
                  activeDot={{ r: 5, fill: '#F59E0B', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* Recent transactions */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-aurelia-text text-base">Recent Transactions</h2>
          {recent.length > 0 && (
            <button onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs text-aurelia-muted hover:text-aurelia-secondary transition-colors duration-150 cursor-pointer">
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <FileText size={28} className="text-aurelia-primary/30" />
            <p className="text-aurelia-muted text-sm">No transactions yet.</p>
            <button onClick={() => navigate('/documents')}
              className="text-xs text-aurelia-secondary hover:text-aurelia-text transition-colors duration-150 cursor-pointer underline underline-offset-2">
              Upload a bank statement to get started
            </button>
          </div>
        ) : (
          <div className="divide-y divide-aurelia-primary/8">
            {recent.map(txn => (
              <div key={txn.id} className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: txn.categoryColor
                        ? `linear-gradient(135deg, ${txn.categoryColor}28, ${txn.categoryColor}12)`
                        : 'rgba(124,58,237,0.12)',
                      border: `1px solid ${txn.categoryColor ? `${txn.categoryColor}35` : 'rgba(124,58,237,0.2)'}`,
                    }}>
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: txn.categoryColor ?? '#7c3aed' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-aurelia-text truncate leading-tight">{txn.description}</p>
                    <p className="text-xs text-aurelia-muted mt-0.5">{txn.txnDate}
                      {txn.categoryName && <span className="ml-2 opacity-70">· {txn.categoryName}</span>}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-4 tabular-nums ${txn.amount < 0 ? 'text-aurelia-danger' : 'text-aurelia-success'}`}>
                  {fmt(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function EmptyChart({ icon, message, action, onAction }: {
  icon: React.ReactNode; message: string; action: string; onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon}
      <p className="text-aurelia-muted text-sm">{message}</p>
      <button onClick={onAction}
        className="text-xs text-aurelia-secondary hover:text-aurelia-text transition-colors duration-150 cursor-pointer underline underline-offset-2">
        {action}
      </button>
    </div>
  )
}

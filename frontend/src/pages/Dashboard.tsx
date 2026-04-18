import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import type { TransactionSummary, Transaction } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
}

export default function Dashboard() {
  const [summary, setSummary]         = useState<TransactionSummary | null>(null)
  const [recent, setRecent]           = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [anomalies, setAnomalies]     = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const to   = now.toISOString().slice(0, 10)

    Promise.all([
      api.get(`/transactions/summary?from=${from}&to=${to}`),
      api.get(`/transactions?from=${from}&to=${to}`),
    ]).then(([s, t]) => {
      setSummary(s.data)
      setRecent(t.data.slice(0, 6))
      // Build daily spending line chart data
      const byDay: Record<string, number> = {}
      for (const txn of t.data) {
        if (txn.amount < 0) {
          byDay[txn.txnDate] = (byDay[txn.txnDate] ?? 0) + Math.abs(txn.amount)
        }
      }
      setMonthlyData(
        Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, amount]) => ({ date: date.slice(5), amount: +amount.toFixed(2) }))
      )
    }).finally(() => setLoading(false))
  }, [])

  const pieColors = summary?.byCategory.map(c => c.categoryColor ?? '#7c3aed') ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-aurelia-text">Dashboard</h1>
        <p className="text-aurelia-muted text-sm mt-1">Your financial overview this month</p>
      </div>

      {/* Anomaly alerts */}
      {anomalies.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-aurelia-danger/30 bg-aurelia-danger/10 px-4 py-3">
          <AlertTriangle size={18} className="text-aurelia-danger mt-0.5 shrink-0" />
          <p className="text-sm text-aurelia-text">
            <span className="font-medium">{anomalies.length} unusual transaction{anomalies.length > 1 ? 's' : ''}</span> detected this month.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: 'Total Expenses',
            value: loading ? null : fmt(Math.abs(summary?.totalExpenses ?? 0)),
            icon: TrendingDown,
            color: 'text-aurelia-danger',
          },
          {
            label: 'Total Income',
            value: loading ? null : fmt(summary?.totalIncome ?? 0),
            icon: TrendingUp,
            color: 'text-aurelia-success',
          },
          {
            label: 'Net Balance',
            value: loading ? null : fmt(summary?.netBalance ?? 0),
            icon: Wallet,
            color: (summary?.netBalance ?? 0) >= 0 ? 'text-aurelia-success' : 'text-aurelia-danger',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={stagger.item}>
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-aurelia-muted">{label}</p>
                <Icon size={18} className={color} />
              </div>
              {loading
                ? <Skeleton className="h-7 w-32" />
                : <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>}
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <GlassCard>
          <h2 className="font-heading font-semibold text-aurelia-text mb-4">Spending by Category</h2>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (summary?.byCategory.length ?? 0) === 0 ? (
            <p className="text-aurelia-muted text-sm text-center py-12">No expense data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={summary!.byCategory}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {summary!.byCategory.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmt(Math.abs(v))}
                  contentStyle={{ background: '#1a1040', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12 }}
                  labelStyle={{ color: '#f1f0f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          {!loading && (
            <div className="flex flex-wrap gap-2 mt-3">
              {summary?.byCategory.map((c) => (
                <Badge key={c.categoryName} label={c.categoryName ?? 'Other'} color={c.categoryColor} size="sm" />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Line chart */}
        <GlassCard>
          <h2 className="font-heading font-semibold text-aurelia-text mb-4">Daily Spending</h2>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : monthlyData.length === 0 ? (
            <p className="text-aurelia-muted text-sm text-center py-12">No transactions this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.15)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ background: '#1a1040', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12 }}
                  labelStyle={{ color: '#f1f0f9' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* Recent transactions */}
      <GlassCard>
        <h2 className="font-heading font-semibold text-aurelia-text mb-4">Recent Transactions</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-aurelia-muted text-sm">No transactions this month. Upload a bank statement to get started.</p>
        ) : (
          <div className="divide-y divide-aurelia-primary/10">
            {recent.map(txn => (
              <div key={txn.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {txn.categoryName && (
                    <Badge label={txn.categoryName} color={txn.categoryColor} size="sm" />
                  )}
                  <span className="text-sm text-aurelia-text truncate">{txn.description}</span>
                </div>
                <span className={`text-sm font-medium shrink-0 ml-4 ${txn.amount < 0 ? 'text-aurelia-danger' : 'text-aurelia-success'}`}>
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

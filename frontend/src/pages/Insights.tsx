import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { AlertTriangle, TrendingUp, Sparkles, FileText, ArrowRight, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import type { ForecastResponse, ForecastCategory, Anomaly } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Skeleton from '@/components/ui/Skeleton'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', Transport: '#3B82F6', Housing: '#8B5CF6',
  Entertainment: '#EC4899', Healthcare: '#10B981', Shopping: '#F97316',
  Income: '#22C55E', Other: '#6B7280',
}
const colorFor = (cat: string) => CATEGORY_COLORS[cat] ?? '#7C3AED'

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } },
}

const ForecastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{
        background: 'rgba(11,10,30,0.97)',
        border: '1px solid rgba(124,58,237,0.3)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
      <p className="text-aurelia-muted mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.fill || p.color }}>
          {p.name === 'forecast' ? '📌 Forecast: ' : '📊 Actual: '}{fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function DeviationBar({ deviation }: { deviation: number }) {
  const pct = Math.min((deviation / 5) * 100, 100)
  const color = deviation >= 3 ? '#F43F5E' : deviation >= 2 ? '#F59E0B' : '#D946EF'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-aurelia-subtle/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color }}>
        {deviation.toFixed(1)}σ
      </span>
    </div>
  )
}

export default function Insights() {
  const navigate = useNavigate()
  const [data, setData]       = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/insights/forecast')
      .then(r => setData(r.data))
      .catch(() => setError('Could not load forecast. Make sure the AI service is running.'))
      .finally(() => setLoading(false))
  }, [])

  const hasData = !loading && !error && (data?.forecast_by_category.length ?? 0) > 0

  // Build flat bar chart data: each category gets its last actual month + forecast
  const barData = (data?.forecast_by_category ?? []).map((fc: ForecastCategory) => {
    const lastActual = fc.monthly_totals[fc.monthly_totals.length - 1]?.total ?? 0
    return {
      category: fc.category,
      actual: +lastActual.toFixed(2),
      forecast: fc.forecast_next_month,
      color: colorFor(fc.category),
    }
  }).sort((a, b) => b.forecast - a.forecast)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-aurelia-text tracking-tight">Insights</h1>
          <p className="text-aurelia-muted text-sm mt-1">Spending forecasts & anomaly detection — last 90 days</p>
        </div>
        <div className="icon-container-primary">
          <Sparkles size={16} className="text-aurelia-secondary" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-5 flex items-center gap-3 border-aurelia-danger/30"
          style={{ borderColor: 'rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.06)' }}>
          <AlertTriangle size={18} className="text-aurelia-danger shrink-0" />
          <p className="text-sm text-aurelia-text">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText size={32} className="text-aurelia-primary/30" />
            <p className="text-aurelia-text font-medium">No spending data yet</p>
            <p className="text-aurelia-muted text-sm max-w-sm">
              Upload at least one bank statement and wait for it to be processed before forecasts can be generated.
            </p>
            <button onClick={() => navigate('/documents')}
              className="mt-2 flex items-center gap-1.5 text-sm text-aurelia-secondary hover:text-white transition-colors duration-150 cursor-pointer underline underline-offset-2">
              Upload a statement <ArrowRight size={13} />
            </button>
          </div>
        </GlassCard>
      )}

      {hasData && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">

          {/* Info banner */}
          <motion.div variants={stagger.item}
            className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}>
            <Info size={15} className="text-aurelia-primary shrink-0 mt-0.5" />
            <span className="text-aurelia-muted">
              Forecast is a <span className="text-aurelia-text font-medium">3-month rolling average</span> per category.
              Anomalies are transactions exceeding <span className="text-aurelia-text font-medium">2 standard deviations</span> from your category mean.
            </span>
          </motion.div>

          {/* Forecast bar chart */}
          <motion.div variants={stagger.item}>
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-aurelia-secondary" />
                <h2 className="font-heading font-semibold text-aurelia-text text-base">Next Month Forecast vs Last Actual</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#9090B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9090B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ForecastTooltip />} />
                  <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.color} fillOpacity={0.55} />
                    ))}
                  </Bar>
                  <Bar dataKey="forecast" name="forecast" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.color} fillOpacity={0.95} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-aurelia-muted">
                  <div className="w-3 h-3 rounded-sm opacity-55" style={{ background: '#7C3AED' }} />
                  Last actual month
                </div>
                <div className="flex items-center gap-1.5 text-xs text-aurelia-muted">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#7C3AED' }} />
                  Forecast next month
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Per-category forecast cards */}
          <motion.div variants={stagger.item}>
            <h2 className="font-heading font-semibold text-aurelia-text text-base mb-3">Category Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data!.forecast_by_category as ForecastCategory[])
                .sort((a, b) => b.forecast_next_month - a.forecast_next_month)
                .map(fc => {
                  const color = colorFor(fc.category)
                  const lastActual = fc.monthly_totals[fc.monthly_totals.length - 1]?.total ?? 0
                  const diff = fc.forecast_next_month - lastActual
                  const pct = lastActual > 0 ? (diff / lastActual) * 100 : 0
                  return (
                    <div key={fc.category}
                      className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: `${color}0D`,
                        border: `1px solid ${color}30`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 32px ${color}10`,
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-aurelia-text">{fc.category}</span>
                        </div>
                        {pct !== 0 && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${diff > 0 ? 'text-aurelia-danger' : 'text-aurelia-success'}`}
                            style={{
                              background: diff > 0 ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                            }}>
                            {diff > 0 ? '+' : ''}{pct.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-heading font-bold" style={{ color }}>
                        {fmt(fc.forecast_next_month)}
                      </p>
                      <p className="text-xs text-aurelia-muted mt-1">
                        Last month: {fmt(lastActual)}
                      </p>
                      <div className="mt-3 h-0.5 rounded-full bg-aurelia-subtle/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </motion.div>

          {/* Anomalies */}
          <motion.div variants={stagger.item}>
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-aurelia-primary/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-aurelia-danger" />
                  <h2 className="font-heading font-semibold text-aurelia-text text-base">Anomalous Transactions</h2>
                </div>
                <span className="text-xs text-aurelia-muted px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  {(data!.anomalies as Anomaly[]).length} flagged
                </span>
              </div>

              {(data!.anomalies as Anomaly[]).length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <TrendingUp size={18} className="text-aurelia-success" />
                  </div>
                  <p className="text-aurelia-text text-sm font-medium">No anomalies detected</p>
                  <p className="text-aurelia-muted text-xs">All transactions are within normal range</p>
                </div>
              ) : (
                <div className="divide-y divide-aurelia-primary/8">
                  {(data!.anomalies as Anomaly[]).map(a => (
                    <div key={a.txn_id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-aurelia-danger/4 transition-colors duration-150">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(244,63,94,0.12)',
                          border: '1px solid rgba(244,63,94,0.25)',
                        }}>
                        <AlertTriangle size={15} className="text-aurelia-danger" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-aurelia-text font-medium truncate">{a.description}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background: `${colorFor(a.category)}18`,
                              color: colorFor(a.category),
                              border: `1px solid ${colorFor(a.category)}35`,
                            }}>
                            {a.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-xs text-aurelia-muted">{a.date}</p>
                          <p className="text-xs text-aurelia-muted">avg {fmt(a.category_mean)}</p>
                          <div className="flex-1 max-w-[140px]">
                            <DeviationBar deviation={a.deviation} />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-aurelia-danger shrink-0 tabular-nums ml-2">
                        {fmt(a.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

        </motion.div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  )
}

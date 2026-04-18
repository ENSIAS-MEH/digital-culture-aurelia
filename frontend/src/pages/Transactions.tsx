import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, Download, Check, Loader, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import type { Transaction } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { id: 1, name: 'Food',          color: '#f59e0b' },
  { id: 2, name: 'Transport',     color: '#3b82f6' },
  { id: 3, name: 'Housing',       color: '#8b5cf6' },
  { id: 4, name: 'Entertainment', color: '#ec4899' },
  { id: 5, name: 'Healthcare',    color: '#10b981' },
  { id: 6, name: 'Shopping',      color: '#f97316' },
  { id: 7, name: 'Income',        color: '#22c55e' },
  { id: 8, name: 'Other',         color: '#6b7280' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

export default function Transactions() {
  const navigate = useNavigate()
  const [txns, setTxns]               = useState<Transaction[]>([])
  const [loading, setLoading]         = useState(true)
  const [from, setFrom]               = useState('')
  const [to, setTo]                   = useState('')
  const [catFilter, setCatFilter]     = useState<number | ''>('')
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [savingId, setSavingId]       = useState<string | null>(null)

  const fetchTxns = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from)      params.set('from', from)
    if (to)        params.set('to', to)
    if (catFilter) params.set('categoryId', String(catFilter))
    api.get(`/transactions?${params}`)
      .then(r => setTxns(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTxns() }, [])

  const applyFilters = (e: React.FormEvent) => { e.preventDefault(); fetchTxns() }

  const updateCategory = async (txnId: string, categoryId: number) => {
    setEditingId(null)
    setSavingId(txnId)
    try {
      await api.patch(`/transactions/${txnId}/category`, { categoryId })
      setTxns(ts => ts.map(t => {
        if (t.id !== txnId) return t
        const cat = CATEGORIES.find(c => c.id === categoryId)!
        return { ...t, categoryId, categoryName: cat.name, categoryColor: cat.color, confirmed: true }
      }))
    } finally {
      setSavingId(null)
    }
  }

  const exportCsv = () => {
    const header = 'Date,Description,Merchant,Amount,Category\n'
    const rows = txns.map(t =>
      `${t.txnDate},"${t.description}","${t.merchant ?? ''}",${t.amount},"${t.categoryName ?? ''}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'aurelia-transactions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => { setFrom(''); setTo(''); setCatFilter('') }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-aurelia-text">Transactions</h1>
          <p className="text-aurelia-muted text-sm mt-1">
            {loading ? 'Loading…' : `${txns.length} transaction${txns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="ghost" onClick={exportCsv} disabled={txns.length === 0}>
          <Download size={15} />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="py-4">
        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
          <Filter size={16} className="text-aurelia-muted mt-6 shrink-0" />
          <div className="w-36">
            <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="w-36">
            <Input label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-aurelia-text/80">Category</label>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg bg-aurelia-surface border border-aurelia-primary/30 px-3 py-2.5 text-sm text-aurelia-text focus:outline-none focus:ring-2 focus:ring-aurelia-primary/60 cursor-pointer transition-colors duration-150"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Button type="submit">Apply</Button>
          <Button type="button" variant="ghost" onClick={() => { resetFilters(); setTimeout(fetchTxns, 0) }}>
            Reset
          </Button>
        </form>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: 'rgba(21,13,53,0.95)', backdropFilter: 'blur(12px)' }}>
              <tr className="border-b border-aurelia-primary/20">
                {['Date', 'Description', 'Merchant', 'Category', 'Amount'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-aurelia-muted uppercase tracking-wider text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-aurelia-primary/10">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={28} className="text-aurelia-primary/30" />
                      <p className="text-aurelia-muted text-sm">No transactions found.</p>
                      <button
                        onClick={() => navigate('/documents')}
                        className="text-xs text-aurelia-primary hover:text-aurelia-secondary transition-colors duration-150 cursor-pointer underline underline-offset-2"
                      >
                        Upload a bank statement to get started
                      </button>
                    </div>
                  </td>
                </tr>
              ) : txns.map(txn => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-aurelia-primary/10 table-row-hover transition-colors duration-100"
                >
                  <td className="px-5 py-3.5 text-aurelia-muted whitespace-nowrap tabular-nums">{txn.txnDate}</td>
                  <td className="px-5 py-3.5 text-aurelia-text max-w-[220px] truncate" title={txn.description}>{txn.description}</td>
                  <td className="px-5 py-3.5 text-aurelia-muted max-w-[140px] truncate">{txn.merchant ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    {savingId === txn.id ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-aurelia-muted">
                        <Loader size={12} className="animate-spin" />
                        <span>Saving…</span>
                      </div>
                    ) : editingId === txn.id ? (
                      <select
                        autoFocus
                        defaultValue={txn.categoryId ?? ''}
                        onChange={e => updateCategory(txn.id, Number(e.target.value))}
                        onBlur={() => setEditingId(null)}
                        className="rounded-lg bg-aurelia-surface border border-aurelia-primary/40 px-2 py-1 text-xs text-aurelia-text focus:outline-none focus:ring-1 focus:ring-aurelia-primary/60 cursor-pointer"
                      >
                        <option value="" disabled>Pick category</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <div
                        onClick={() => setEditingId(txn.id)}
                        className="cursor-pointer inline-flex items-center gap-1.5"
                        title="Click to change category"
                      >
                        {txn.categoryName
                          ? <Badge label={txn.categoryName} color={txn.categoryColor} size="sm" />
                          : <span className="text-xs text-aurelia-muted border border-dashed border-aurelia-muted/40 rounded-full px-2 py-0.5 hover:border-aurelia-primary/60 transition-colors duration-150">Uncategorized</span>}
                        {txn.confirmed && <Check size={11} className="text-aurelia-success shrink-0" />}
                      </div>
                    )}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${txn.amount < 0 ? 'text-aurelia-danger' : 'text-aurelia-success'}`}>
                    {fmt(txn.amount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

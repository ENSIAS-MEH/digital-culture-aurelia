import { pdf } from '@react-pdf/renderer'
import { api } from '@/lib/api'
import { MonthlyReport, type MonthlyReportData } from '@/components/reports/MonthlyReport'
import type {
  User,
  Transaction,
  TransactionSummary,
  ForecastResponse,
} from '@/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function monthBounds(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const from = new Date(y, m, 1)
  const to = new Date(y, m + 1, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to), label: `${MONTHS[m]} ${y}` }
}

export async function downloadMonthlyReport(targetMonth: Date = new Date()): Promise<void> {
  const { from, to, label } = monthBounds(targetMonth)

  const savedUser = localStorage.getItem('aurelia_user')
  const user: User | null = savedUser ? JSON.parse(savedUser) : null
  if (!user) throw new Error('Not authenticated')

  const [summaryRes, txnRes, forecastRes] = await Promise.all([
    api.get<TransactionSummary>(`/transactions/summary?from=${from}&to=${to}`),
    api.get<Transaction[]>(`/transactions?from=${from}&to=${to}`),
    api.get<ForecastResponse>('/insights/forecast').catch(() => null),
  ])

  const data: MonthlyReportData = {
    userName: user.fullName || user.email,
    userEmail: user.email,
    periodLabel: label,
    from,
    to,
    summary: summaryRes.data,
    transactions: txnRes.data,
    forecast: forecastRes?.data.forecast_by_category ?? [],
    anomalies: forecastRes?.data.anomalies ?? [],
    generatedAt: new Date().toLocaleString('fr-FR'),
  }

  const blob = await pdf(<MonthlyReport data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aurelia-report-${from.slice(0, 7)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

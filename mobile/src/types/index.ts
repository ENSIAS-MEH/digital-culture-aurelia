export interface User {
  userId: string
  email: string
  fullName?: string
  token: string
}

export interface Transaction {
  id: string
  documentId?: string
  txnDate: string
  amount: number
  description: string
  merchant?: string
  categoryId?: number
  categoryName?: string
  categoryColor?: string
  rawCategory?: string
  confirmed: boolean
  createdAt: string
}

export interface CategoryTotal {
  categoryId?: number
  categoryName?: string
  categoryColor?: string
  total: number
  count: number
}

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  byCategory: CategoryTotal[]
}

export interface MonthlyTotal {
  month: string
  total: number
}

export interface ForecastCategory {
  category: string
  monthly_totals: MonthlyTotal[]
  forecast_next_month: number
}

export interface Anomaly {
  txn_id: string
  date: string
  amount: number
  description: string
  category: string
  category_mean: number
  deviation: number
}

export interface ForecastResponse {
  forecast_by_category: ForecastCategory[]
  anomalies: Anomaly[]
}

export interface ManualTransactionInput {
  txnDate: string
  description: string
  merchant: string
  categoryId: number
  amount: number
}

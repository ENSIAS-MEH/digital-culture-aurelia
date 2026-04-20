export const CATEGORIES = [
  { id: 1, name: 'Food',          color: '#f59e0b' },
  { id: 2, name: 'Transport',     color: '#3b82f6' },
  { id: 3, name: 'Housing',       color: '#8b5cf6' },
  { id: 4, name: 'Entertainment', color: '#ec4899' },
  { id: 5, name: 'Healthcare',    color: '#10b981' },
  { id: 6, name: 'Shopping',      color: '#f97316' },
  { id: 7, name: 'Income',        color: '#22c55e' },
  { id: 8, name: 'Other',         color: '#6b7280' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

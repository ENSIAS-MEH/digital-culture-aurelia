import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Badge from './ui/Badge'
import { Colors } from '@/theme/colors'
import type { Transaction } from '@/types'
import { CATEGORIES } from '@/constants/categories'

interface Props {
  transaction: Transaction
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TransactionItem({ transaction: t }: Props) {
  const cat = CATEGORIES.find((c) => c.id === t.categoryId)
  const catColor = cat?.color ?? t.categoryColor ?? Colors.muted
  const catName  = cat?.name  ?? t.categoryName  ?? t.rawCategory ?? 'Unknown'
  const isIncome = t.categoryId === 7 || t.amount > 0 && t.categoryName === 'Income'

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: catColor }]} />
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>{t.description}</Text>
        {t.merchant ? (
          <Text style={styles.merchant} numberOfLines={1}>{t.merchant}</Text>
        ) : null}
        <Text style={styles.date}>{formatDate(t.txnDate)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
        </Text>
        <Badge label={catName} color={catColor} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  merchant: {
    color: Colors.muted,
    fontSize: 12,
  },
  date: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  income: {
    color: Colors.success,
  },
  expense: {
    color: Colors.danger,
  },
})

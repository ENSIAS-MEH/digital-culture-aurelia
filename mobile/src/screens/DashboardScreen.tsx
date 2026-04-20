import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PieChart } from 'react-native-chart-kit'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Gradients } from '@/theme/colors'
import { CATEGORIES } from '@/constants/categories'
import type { TransactionSummary, Transaction } from '@/types'
import GlassCard from '@/components/GlassCard'
import StatCard from '@/components/StatCard'
import TransactionItem from '@/components/TransactionItem'

const { width: SCREEN_W } = Dimensions.get('window')

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const insets = useSafeAreaInsets()

  const [summary, setSummary]         = useState<TransactionSummary | null>(null)
  const [recent, setRecent]           = useState<Transaction[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState('')

  const load = useCallback(async () => {
    try {
      const [sumRes, txnRes] = await Promise.all([
        api.get<TransactionSummary>('/transactions/summary'),
        api.get<Transaction[]>('/transactions', { params: { size: 5 } }),
      ])
      setSummary(sumRes.data)
      setRecent(txnRes.data.slice(0, 5))
      setError('')
    } catch {
      setError('Failed to load data')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  // Build pie chart data from summary
  const pieData = (summary?.byCategory ?? [])
    .filter((c) => c.total > 0)
    .map((c) => {
      const cat = CATEGORIES.find((k) => k.id === c.categoryId)
      return {
        name: c.categoryName ?? cat?.name ?? 'Other',
        population: c.total,
        color: c.categoryColor ?? cat?.color ?? Colors.muted,
        legendFontColor: Colors.muted,
        legendFontSize: 11,
      }
    })
    .slice(0, 6)

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.username}>{user?.fullName ?? user?.email?.split('@')[0] ?? 'there'} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Total Expenses"
            value={fmt(summary?.totalExpenses ?? 0)}
            gradientColors={Gradients.danger}
            icon="📉"
          />
          <StatCard
            title="Total Income"
            value={fmt(summary?.totalIncome ?? 0)}
            gradientColors={Gradients.success}
            icon="📈"
          />
        </View>
        <StatCard
          title="Net Balance"
          value={fmt(summary?.netBalance ?? 0)}
          gradientColors={Gradients.primary}
          icon="💳"
          style={styles.netCard}
        />

        {/* Spending by category */}
        {pieData.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={SCREEN_W - 64}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                backgroundColor: 'transparent',
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend
              absolute={false}
              style={{ marginLeft: -16 }}
            />
          </GlassCard>
        )}

        {/* Recent transactions */}
        {recent.length > 0 && (
          <GlassCard style={styles.section} noPadding>
            <Text style={[styles.sectionTitle, styles.sectionPadded]}>Recent Transactions</Text>
            {recent.map((t) => (
              <TransactionItem key={t.id} transaction={t} />
            ))}
          </GlassCard>
        )}

        {loading && (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greeting: {
    color: Colors.muted,
    fontSize: 14,
  },
  username: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  netCard: {
    marginTop: 0,
  },
  section: {
    marginTop: 0,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionPadded: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 0,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 14,
  },
})

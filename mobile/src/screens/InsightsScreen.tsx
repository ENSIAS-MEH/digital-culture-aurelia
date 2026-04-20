import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { BarChart } from 'react-native-chart-kit'
import { api } from '@/lib/api'
import { Colors } from '@/theme/colors'
import type { ForecastResponse, ForecastCategory, Anomaly } from '@/types'
import GlassCard from '@/components/GlassCard'

const { width: SCREEN_W } = Dimensions.get('window')

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

function ForecastCard({ item }: { item: ForecastCategory }) {
  const lastActual = item.monthly_totals.slice(-1)[0]?.total ?? 0
  const forecast   = item.forecast_next_month
  const diff       = forecast - lastActual
  const pct        = lastActual > 0 ? ((diff / lastActual) * 100).toFixed(1) : '0'
  const up         = diff > 0

  return (
    <GlassCard style={styles.forecastCard}>
      <View style={styles.forecastHeader}>
        <Text style={styles.forecastCategory}>{item.category}</Text>
        <View style={[styles.badge, up ? styles.badgeUp : styles.badgeDown]}>
          <Text style={[styles.badgeText, up ? styles.badgeTextUp : styles.badgeTextDown]}>
            {up ? '▲' : '▼'} {Math.abs(Number(pct))}%
          </Text>
        </View>
      </View>
      <Text style={styles.forecastValue}>{fmt(forecast)}</Text>
      <Text style={styles.forecastSub}>Forecast next month · actual {fmt(lastActual)}</Text>
    </GlassCard>
  )
}

function AnomalyItem({ anomaly }: { item?: never; anomaly: Anomaly }) {
  const deviation = anomaly.deviation.toFixed(1)
  const severity  = anomaly.deviation > 3 ? Colors.danger : Colors.accent

  return (
    <View style={styles.anomalyRow}>
      <View style={[styles.anomalyDot, { backgroundColor: severity }]} />
      <View style={styles.anomalyInfo}>
        <Text style={styles.anomalyDesc} numberOfLines={1}>{anomaly.description}</Text>
        <Text style={styles.anomalySub}>{anomaly.category} · {anomaly.date}</Text>
      </View>
      <View style={styles.anomalyRight}>
        <Text style={[styles.anomalyAmount, { color: severity }]}>{fmt(anomaly.amount)}</Text>
        <Text style={styles.anomalyDev}>{deviation}σ deviation</Text>
      </View>
    </View>
  )
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets()

  const [data, setData]           = useState<ForecastResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get<ForecastResponse>('/insights/forecast')
      setData(res.data)
      setError('')
    } catch {
      setError('Failed to load insights')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  // Build bar chart data from forecast
  const chartCategories = (data?.forecast_by_category ?? []).slice(0, 5)
  const chartData = chartCategories.length > 0 ? {
    labels: chartCategories.map((c) => c.category.substring(0, 5)),
    datasets: [
      {
        data: chartCategories.map((c) => c.forecast_next_month),
        color: (opacity = 1) => `rgba(124,58,237,${opacity})`,
      },
    ],
  } : null

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Insights</Text>
        <Text style={styles.pageSubtitle}>Spending forecasts & anomaly detection</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {(!data || ((data.forecast_by_category ?? []).length === 0 && (data.anomalies ?? []).length === 0)) && !error && (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No insights yet</Text>
            <Text style={styles.emptyHint}>Add a few transactions to unlock forecasts & anomaly detection</Text>
          </GlassCard>
        )}

        {/* Forecast chart */}
        {chartData && (
          <GlassCard style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Forecast — Next Month</Text>
            <BarChart
              data={chartData}
              width={SCREEN_W - 64}
              height={200}
              yAxisLabel="€"
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(124,58,237,${opacity})`,
                labelColor: () => Colors.muted,
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  stroke: 'rgba(255,255,255,0.06)',
                },
              }}
              style={{ marginLeft: -8 }}
              withInnerLines
              showValuesOnTopOfBars
              fromZero
            />
          </GlassCard>
        )}

        {/* Category forecasts */}
        {(data?.forecast_by_category ?? []).length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>By Category</Text>
            {data!.forecast_by_category.map((item, i) => (
              <ForecastCard key={i} item={item} />
            ))}
          </View>
        )}

        {/* Anomalies */}
        {(data?.anomalies ?? []).length > 0 && (
          <GlassCard style={styles.anomalySection} noPadding>
            <Text style={[styles.sectionTitle, styles.sectionPadded]}>
              ⚠ Anomalies Detected
            </Text>
            {data!.anomalies.map((a, i) => (
              <AnomalyItem key={i} anomaly={a} />
            ))}
          </GlassCard>
        )}

        {(data?.anomalies ?? []).length === 0 && data && (
          <GlassCard>
            <Text style={styles.noAnomalies}>✅ No anomalies detected in your spending</Text>
          </GlassCard>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 2,
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
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    color: Colors.muted,
    fontSize: 13,
  },
  chartCard: {
    overflow: 'hidden',
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
  forecastCard: {
    marginBottom: 8,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forecastCategory: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeUp: {
    backgroundColor: 'rgba(244,63,94,0.15)',
  },
  badgeDown: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextUp: {
    color: Colors.danger,
  },
  badgeTextDown: {
    color: Colors.success,
  },
  forecastValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  forecastSub: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  anomalySection: {
    overflow: 'hidden',
  },
  anomalyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  anomalyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  anomalyInfo: {
    flex: 1,
    gap: 2,
  },
  anomalyDesc: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  anomalySub: {
    color: Colors.muted,
    fontSize: 11,
  },
  anomalyRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  anomalyAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  anomalyDev: {
    color: Colors.muted,
    fontSize: 11,
  },
  noAnomalies: {
    color: Colors.success,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
})

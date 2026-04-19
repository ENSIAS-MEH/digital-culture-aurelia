import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type {
  Transaction,
  TransactionSummary,
  ForecastCategory,
  Anomaly,
} from '@/types'

const PRIMARY = '#7C3AED'
const SECONDARY = '#D946EF'
const SUCCESS = '#10B981'
const DANGER = '#F43F5E'
const MUTED = '#6B6B80'
const TEXT = '#111122'
const BORDER = '#E4E4EC'
const SURFACE = '#F7F7FB'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    paddingBottom: 12,
    marginBottom: 20,
  },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: PRIMARY, letterSpacing: 1 },
  brandSub: { fontSize: 9, color: MUTED, marginTop: 2 },
  headerMeta: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEXT },
  reportSub: { fontSize: 9, color: MUTED, marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: TEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 6 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableCell: { fontSize: 9, color: TEXT },

  catDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  catRow: { flexDirection: 'row', alignItems: 'center' },

  empty: {
    fontSize: 9,
    color: MUTED,
    fontStyle: 'italic',
    padding: 10,
    textAlign: 'center',
    backgroundColor: SURFACE,
    borderRadius: 4,
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
})

export interface MonthlyReportData {
  userName: string
  userEmail: string
  periodLabel: string
  from: string
  to: string
  summary: TransactionSummary
  transactions: Transaction[]
  forecast: ForecastCategory[]
  anomalies: Anomaly[]
  generatedAt: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

export function MonthlyReport({ data }: { data: MonthlyReportData }) {
  const {
    userName, userEmail, periodLabel, summary,
    transactions, forecast, anomalies, generatedAt,
  } = data

  const topTxns = [...transactions]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 10)

  return (
    <Document
      title={`Aurelia Report — ${periodLabel}`}
      author="Aurelia"
      subject="Monthly Finance Report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>AURELIA</Text>
            <Text style={styles.brandSub}>AI-Powered Personal Finance</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.reportTitle}>Monthly Report · {periodLabel}</Text>
            <Text style={styles.reportSub}>{userName} · {userEmail}</Text>
            <Text style={styles.reportSub}>Generated {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Income</Text>
              <Text style={[styles.statValue, { color: SUCCESS }]}>
                {fmt(summary.totalIncome ?? 0)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Expenses</Text>
              <Text style={[styles.statValue, { color: DANGER }]}>
                {fmt(Math.abs(summary.totalExpenses ?? 0))}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: (summary.netBalance ?? 0) >= 0 ? SUCCESS : DANGER },
                ]}
              >
                {fmt(summary.netBalance ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {summary.byCategory.length === 0 ? (
            <Text style={styles.empty}>No categorized spending in this period.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Tx</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Total</Text>
              </View>
              {[...summary.byCategory]
                .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
                .map((c, i) => (
                  <View key={`${c.categoryName ?? 'other'}-${i}`} style={styles.tableRow}>
                    <View style={[styles.catRow, { flex: 3 }]}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: c.categoryColor ?? PRIMARY },
                        ]}
                      />
                      <Text style={styles.tableCell}>{c.categoryName ?? 'Other'}</Text>
                    </View>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {c.count}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                      ]}
                    >
                      {fmt(Math.abs(c.total))}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Transactions</Text>
          {topTxns.length === 0 ? (
            <Text style={styles.empty}>No transactions in this period.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 5 }]}>Description</Text>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Amount</Text>
              </View>
              {topTxns.map(t => (
                <View key={t.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{t.txnDate}</Text>
                  <Text style={[styles.tableCell, { flex: 5 }]}>{t.description}</Text>
                  <Text style={[styles.tableCell, { flex: 3, color: MUTED }]}>
                    {t.categoryName ?? 'Other'}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        flex: 2,
                        textAlign: 'right',
                        fontFamily: 'Helvetica-Bold',
                        color: t.amount < 0 ? DANGER : SUCCESS,
                      },
                    ]}
                  >
                    {fmt(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next-Month Forecast</Text>
          {forecast.length === 0 ? (
            <Text style={styles.empty}>Not enough history to forecast yet.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Last Month</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Forecast</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Δ%</Text>
              </View>
              {[...forecast]
                .sort((a, b) => b.forecast_next_month - a.forecast_next_month)
                .map(fc => {
                  const last = fc.monthly_totals[fc.monthly_totals.length - 1]?.total ?? 0
                  const pct = last > 0 ? ((fc.forecast_next_month - last) / last) * 100 : 0
                  const pctColor = pct > 0 ? DANGER : pct < 0 ? SUCCESS : MUTED
                  return (
                    <View key={fc.category} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 3 }]}>{fc.category}</Text>
                      <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                        {fmt(last)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                        ]}
                      >
                        {fmt(fc.forecast_next_month)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { flex: 1, textAlign: 'right', color: pctColor },
                        ]}
                      >
                        {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
                      </Text>
                    </View>
                  )
                })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anomalies</Text>
          {anomalies.length === 0 ? (
            <Text style={styles.empty}>No anomalous transactions detected.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 5 }]}>Description</Text>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>σ</Text>
              </View>
              {anomalies.map(a => (
                <View key={a.txn_id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{a.date}</Text>
                  <Text style={[styles.tableCell, { flex: 5 }]}>{a.description}</Text>
                  <Text style={[styles.tableCell, { flex: 3, color: MUTED }]}>{a.category}</Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 2, textAlign: 'right', color: DANGER, fontFamily: 'Helvetica-Bold' },
                    ]}
                  >
                    {fmt(a.amount)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {a.deviation.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>Aurelia · {userEmail}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
          <Text style={{ color: SECONDARY }}>{periodLabel}</Text>
        </View>
      </Page>
    </Document>
  )
}

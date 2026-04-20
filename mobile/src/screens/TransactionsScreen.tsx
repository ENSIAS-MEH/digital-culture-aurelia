import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { Colors } from '@/theme/colors'
import { CATEGORIES } from '@/constants/categories'
import type { Transaction } from '@/types'
import TransactionItem from '@/components/TransactionItem'
import AddTransactionModal from '@/components/AddTransactionModal'
import GlassCard from '@/components/GlassCard'

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [search, setSearch]             = useState('')
  const [selectedCat, setSelectedCat]   = useState<number | null>(null)
  const [error, setError]               = useState('')

  const load = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {}
      if (selectedCat) params.categoryId = selectedCat
      const { data } = await api.get<Transaction[]>('/transactions', { params })
      setTransactions(data)
      setError('')
    } catch {
      setError('Failed to load transactions')
    }
  }, [selectedCat])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const filtered = transactions.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.description.toLowerCase().includes(q) ||
      (t.merchant ?? '').toLowerCase().includes(q) ||
      (t.categoryName ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.count}>{filtered.length} entries</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search…"
          placeholderTextColor={Colors.muted}
        />
      </View>

      {/* Category filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedCat === null && styles.filterActive]}
          onPress={() => setSelectedCat(null)}
        >
          <Text style={[styles.filterText, selectedCat === null && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              { borderColor: `${cat.color}55` },
              selectedCat === cat.id && { backgroundColor: `${cat.color}25`, borderColor: cat.color },
            ]}
            onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
          >
            <Text style={[styles.filterText, selectedCat === cat.id && { color: cat.color }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={[styles.errorBox, { marginHorizontal: 16 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptyHint}>Tap + to add your first entry</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={load}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  count: {
    color: Colors.muted,
    fontSize: 13,
  },
  searchWrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.subtle,
    paddingHorizontal: 14,
  },
  search: {
    color: Colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.subtle,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
  },
  flatList: {
    flex: 1,
    marginHorizontal: 0,
  },
  list: {
    paddingBottom: 100,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
  },
})

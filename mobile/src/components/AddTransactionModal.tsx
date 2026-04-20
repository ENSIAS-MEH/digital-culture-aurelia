import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { api } from '@/lib/api'
import { Colors } from '@/theme/colors'
import { CATEGORIES } from '@/constants/categories'
import type { ManualTransactionInput } from '@/types'
import Input from './ui/Input'
import Button from './ui/Button'
import GlassCard from './GlassCard'

interface Props {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

const INCOME_CATEGORY_ID = 7
const DEFAULT_EXPENSE_CATEGORY_ID = 8

export default function AddTransactionModal({ visible, onClose, onCreated }: Props) {
  const [type, setType]               = useState<'expense' | 'income'>('expense')
  const [date, setDate]               = useState(new Date())
  const [showPicker, setShowPicker]   = useState(false)
  const [description, setDescription] = useState('')
  const [merchant, setMerchant]       = useState('')
  const [amount, setAmount]           = useState('')
  const [categoryId, setCategoryId]   = useState<number>(DEFAULT_EXPENSE_CATEGORY_ID)
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState<Record<string, string>>({})

  const handleTypeChange = (t: 'expense' | 'income') => {
    setType(t)
    if (t === 'income') {
      setCategoryId(INCOME_CATEGORY_ID)
    } else {
      if (categoryId === INCOME_CATEGORY_ID) setCategoryId(DEFAULT_EXPENSE_CATEGORY_ID)
    }
  }

  const reset = () => {
    setType('expense')
    setDate(new Date())
    setDescription('')
    setMerchant('')
    setAmount('')
    setCategoryId(DEFAULT_EXPENSE_CATEGORY_ID)
    setErrors({})
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!description.trim()) e.description = 'Description is required'
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) e.amount = 'Enter a valid positive amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const parsed = parseFloat(amount)
      const signedAmount = type === 'income' ? parsed : -parsed
      const payload: ManualTransactionInput = {
        txnDate:     date.toISOString().split('T')[0],
        description: description.trim(),
        merchant:    merchant.trim(),
        categoryId,
        amount:      signedAmount,
      }
      await api.post('/transactions', payload)
      reset()
      onCreated()
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const expenseCategories = CATEGORIES.filter((c) => c.id !== INCOME_CATEGORY_ID)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <GlassCard style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Transaction</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Type toggle */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'expense' && styles.typeBtnExpenseActive,
                ]}
                onPress={() => handleTypeChange('expense')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnExpenseText]}>
                  📉 Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'income' && styles.typeBtnIncomeActive,
                ]}
                onPress={() => handleTypeChange('income')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnIncomeText]}>
                  📈 Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
                <Text style={styles.calIcon}>📅</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                  maximumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowPicker(false)
                    if (selected) setDate(selected)
                  }}
                />
              )}
            </View>

            {/* Description */}
            <Input
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Grocery shopping"
              error={errors.description}
              containerStyle={styles.field}
            />

            {/* Merchant */}
            <Input
              label="Merchant"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Carrefour"
              containerStyle={styles.field}
            />

            {/* Amount */}
            <Input
              label="Amount (€) *"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
              containerStyle={styles.field}
            />

            {/* Category — only shown for expenses */}
            {type === 'expense' && (
              <View style={styles.field}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {expenseCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        { borderColor: `${cat.color}55` },
                        categoryId === cat.id && { backgroundColor: `${cat.color}30`, borderColor: cat.color },
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catLabel, categoryId === cat.id && { color: cat.color }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Submit */}
            <Button
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitBtn}
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
            </Button>
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.muted,
    fontSize: 14,
  },
  body: {
    flexGrow: 0,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.subtle,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  typeBtnExpenseActive: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderColor: Colors.danger,
  },
  typeBtnIncomeActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: Colors.success,
  },
  typeBtnText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  typeBtnExpenseText: {
    color: Colors.danger,
  },
  typeBtnIncomeText: {
    color: Colors.success,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.subtle,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateText: {
    color: Colors.text,
    fontSize: 15,
  },
  calIcon: {
    fontSize: 16,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catLabel: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
  },
})

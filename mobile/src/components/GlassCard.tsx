import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/theme/colors'

interface Props {
  children: React.ReactNode
  style?: ViewStyle
  noPadding?: boolean
}

export default function GlassCard({ children, style, noPadding }: Props) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  noPadding: {
    padding: 0,
  },
})

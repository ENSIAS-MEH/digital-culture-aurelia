import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import GlassCard from './GlassCard'
import { Colors } from '@/theme/colors'

interface Props {
  title: string
  value: string
  subtitle?: string
  gradientColors: readonly [string, string]
  icon: string
}

export default function StatCard({ title, value, subtitle, gradientColors, icon }: Props) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <LinearGradient
          colors={gradientColors}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.icon}>{icon}</Text>
        </LinearGradient>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
  },
  value: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
})

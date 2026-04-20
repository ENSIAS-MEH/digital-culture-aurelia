import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Gradients } from '@/theme/colors'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props {
  onPress?: () => void
  children: React.ReactNode
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

export default function Button({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth,
}: Props) {
  const isDisabled = disabled || loading

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.text, textStyle]}>{children}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'ghost'  && styles.ghost,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? Colors.danger : Colors.primary} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'ghost'  && styles.ghostText,
            variant === 'danger' && styles.dangerText,
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  ghost: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  danger: {
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  ghostText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.danger,
  },
})

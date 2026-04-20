import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native'
import { Colors } from '@/theme/colors'

interface Props extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
  rightElement?: React.ReactNode
}

export default function Input({ label, error, containerStyle, rightElement, ...rest }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused, error ? styles.errored : null]}>
        <TextInput
          {...rest}
          style={styles.input}
          placeholderTextColor={Colors.muted}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e) }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e) }}
        />
        {rightElement && (
          <View style={styles.rightEl}>{rightElement}</View>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.subtle,
    paddingHorizontal: 14,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  errored: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 13,
  },
  rightEl: {
    marginLeft: 8,
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
  },
})

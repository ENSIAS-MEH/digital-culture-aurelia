import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Gradients } from '@/theme/colors'
import type { AuthStackParams } from '@/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Props = NativeStackScreenProps<AuthStackParams, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleRegister = async () => {
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      await register(email.trim(), password, fullName.trim())
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Text style={styles.logoIcon}>⚡</Text>
            </LinearGradient>
            <Text style={styles.appName}>Aurelia</Text>
            <Text style={styles.tagline}>Start your finance journey</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>

            <View style={styles.form}>
              <Input
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Smith"
                autoComplete="name"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 characters"
                secureTextEntry
                autoComplete="new-password"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button onPress={handleRegister} loading={loading} fullWidth style={styles.submitBtn}>
                Create account
              </Button>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: '10%',
    left: '10%',
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  blobBottom: {
    width: 240,
    height: 240,
    bottom: '15%',
    right: '5%',
    backgroundColor: 'rgba(217,70,239,0.12)',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 26,
    color: '#fff',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.muted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  form: {
    gap: 14,
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
  submitBtn: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.muted,
    fontSize: 14,
  },
  link: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
})

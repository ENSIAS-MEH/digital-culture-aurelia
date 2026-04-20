import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, StyleSheet } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { Colors } from '@/theme/colors'

import LoginScreen    from '@/screens/auth/LoginScreen'
import RegisterScreen from '@/screens/auth/RegisterScreen'
import DashboardScreen    from '@/screens/DashboardScreen'
import TransactionsScreen from '@/screens/TransactionsScreen'
import InsightsScreen     from '@/screens/InsightsScreen'

export type AuthStackParams = {
  Login: undefined
  Register: undefined
}

export type MainTabParams = {
  Dashboard:    undefined
  Transactions: undefined
  Insights:     undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParams>()
const MainTab   = createBottomTabNavigator<MainTabParams>()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⚡',
    Transactions: '₿',
    Insights: '📊',
  }
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 18 }}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  )
}

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Transactions" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Insights" focused={focused} /> }}
      />
    </MainTab.Navigator>
  )
}

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login"    component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    )
  }

  return <MainTabs />
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
  },
})

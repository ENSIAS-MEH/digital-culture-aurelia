import './global.css'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/contexts/AuthContext'
import RootNavigator from './src/navigation'

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary:       '#7C3AED',
                background:    '#06060F',
                card:          '#0B0A1E',
                text:          '#F5F3FF',
                border:        'rgba(124,58,237,0.18)',
                notification:  '#D946EF',
              },
            }}
          >
            <StatusBar style="light" backgroundColor="#06060F" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

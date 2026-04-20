import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'aurelia_token'
const USER_KEY  = 'aurelia_user'

export const Storage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),

  getUser: async () => {
    const raw = await AsyncStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (user: object) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),

  clear: () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]),
}

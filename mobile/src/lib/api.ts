import axios from 'axios'
import { Storage } from './storage'

// For Android emulator: use 10.0.2.2 to reach host machine localhost
// For physical device: use your machine's LAN IP, e.g. http://192.168.1.x:8080
const BACKEND_URL = 'http://10.0.2.2:8090'

export const api = axios.create({ baseURL: `${BACKEND_URL}/api` })

api.interceptors.request.use(async (config) => {
  const token = await Storage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let _onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await Storage.clear()
      _onUnauthorized?.()
    }
    return Promise.reject(err)
  }
)

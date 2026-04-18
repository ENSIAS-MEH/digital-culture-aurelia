import axios from 'axios'

// Empty string = relative URL (production behind reverse proxy on same domain)
// Set VITE_BACKEND_URL=http://localhost:8080 in .env for local dev
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? ''
export const AI_URL = import.meta.env.VITE_AI_SERVICE_URL ?? ''

export const api = axios.create({ baseURL: `${BACKEND}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurelia_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aurelia_token')
      localStorage.removeItem('aurelia_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const getToken = () => localStorage.getItem('aurelia_token') ?? ''

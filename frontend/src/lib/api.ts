import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
export const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

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

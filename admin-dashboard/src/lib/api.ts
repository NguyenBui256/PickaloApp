// API client for backend communication

const API_BASE = '/api'

interface RequestConfig {
  method: string
  url: string
  params?: Record<string, string | number>
  body?: unknown
  headers?: Record<string, string>
}

async function apiRequest<T>(
  config: RequestConfig,
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (requireAuth) {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }
    headers.Authorization = `Bearer ${token}`
  }

  const url = new URL(`${API_BASE}${config.url}`, window.location.origin)
  
  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    method: config.method,
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return response.json()
}

export const api = {
  get: <T>(url: string, params?: Record<string, string | number>, requireAuth = true) =>
    apiRequest<T>({ method: 'GET', url, params }, requireAuth),

  post: <T>(url: string, body?: unknown, requireAuth = true) =>
    apiRequest<T>({ method: 'POST', url, body }, requireAuth),

  patch: <T>(url: string, body?: unknown, requireAuth = true) =>
    apiRequest<T>({ method: 'PATCH', url, body }, requireAuth),

  delete: <T>(url: string, requireAuth = true) =>
    apiRequest<T>({ method: 'DELETE', url }, requireAuth),
}

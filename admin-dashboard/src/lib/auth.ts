// Authentication utilities

import { api } from './api'
import type { LoginResponse } from '@/types/api'

export async function login(phone: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { phone, password }, false)
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function isTokenExpired(): boolean {
  const token = getAccessToken()
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Date.now() / 1000
    return payload.exp < now
  } catch {
    return true
  }
}

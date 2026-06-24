import api from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
}

export interface LoginResponse {
  token: string
  user: User
}

interface ApiEnvelope<T> {
  data: T
  message?: string
}

export const authService = {
  login: (payload: LoginPayload) => api.post<ApiEnvelope<LoginResponse>>('/auth/login', payload),
}

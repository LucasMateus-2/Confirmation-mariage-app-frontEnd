import api from './api'

export interface DashboardSummary {
  total: number
  attending: number
  declined: number
  pending: number
}

export const dashboardService = {
  // GET /dashboard — protegido
  getSummary: () => api.get<DashboardSummary>('/dashboard'),
}

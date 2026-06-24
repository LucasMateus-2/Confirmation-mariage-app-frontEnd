import api from './api'

export interface PlusOne {
  id: number
  guest_id: number
  name: string
  attending: boolean
}

export interface Guest {
  id: number
  name: string
  responded: boolean
  attending: boolean
  plus_ones?: PlusOne[]
}

export interface PlusOneConfirmation {
  id: number
  attending: boolean
}

export interface ConfirmInput {
  attending: boolean
  plus_ones?: PlusOneConfirmation[]
}

export const guestService = {
  listAll: () => api.get<Guest[]>('/guests'),

  getById: (id: number) => api.get<Guest>(`/guests/${id}`),

  confirm: (id: number, input: ConfirmInput) =>
    api.patch<{ message: string }>(`/guests/${id}/confirm`, input),
  // GET /guests/search?q=nome — público
  searchByName: (query: string) => api.get<Guest[]>('/guests/search', { params: { q: query } }),
}

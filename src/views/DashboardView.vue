<template>
  <div class="dashboard-container min-vh-100 p-4">
    <header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-white border-opacity-10">
      <div>
        <span class="text-uppercase tracking-wider small text-muted d-block">Painel de Controle</span>
        <h1 class="h3 fw-light m-0 text-white">Lucas & Maria Clara</h1>
      </div>
      <button @click="handleLogout" class="btn btn-outline-light btn-sm px-3 opacity-75 hover-opacity-100">
        <i class="bi bi-box-arrow-right me-2"></i>Sair
      </button>
    </header>

    <div v-if="isLoading" class="text-center my-5 py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Carregando dados...</span>
      </div>
      <p class="text-muted mt-3 small">Sincronizando com o servidor em Go...</p>
    </div>

    <!-- CORREÇÃO: v-elif -> v-else-if -->
    <div v-else-if="errorMessage" class="alert alert-danger border-0 text-center mx-auto" style="max-width: 500px; background: rgba(220, 53, 69, 0.2); color: #ff8080;">
      <i class="bi bi-exclamation-octagon-fill me-2"></i>{{ errorMessage }}
      <button @click="loadDashboardData" class="btn btn-sm btn-link text-white text-decoration-underline d-block mx-auto mt-2">Tentar novamente</button>
    </div>

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card dashboard-glass-card p-3 border-0 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-uppercase tracking-wide small text-muted mb-1">Confirmados</p>
                <h3 class="fw-light m-0 text-white">{{ stats.confirmedCount }}</h3>
              </div>
              <div class="metric-icon bg-success bg-opacity-20 text-success rounded-circle p-2">
                <i class="bi bi-people-fill fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card dashboard-glass-card p-3 border-0 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-uppercase tracking-wide small text-muted mb-1">Adultos</p>
                <h3 class="fw-light m-0 text-white">{{ stats.adultsCount }}</h3>
              </div>
              <div class="metric-icon bg-info bg-opacity-20 text-info rounded-circle p-2">
                <i class="bi bi-person-check-fill fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card dashboard-glass-card p-3 border-0 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-uppercase tracking-wide small text-muted mb-1">Crianças</p>
                <h3 class="fw-light m-0 text-white">{{ stats.childrenCount }}</h3>
              </div>
              <div class="metric-icon bg-warning bg-opacity-20 text-warning rounded-circle p-2">
                <i class="bi bi-backpack-fill fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card dashboard-glass-card p-3 border-0 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-uppercase tracking-wide small text-muted mb-1">Recusados</p>
                <h3 class="fw-light m-0 text-white">{{ stats.declinedCount }}</h3>
              </div>
              <div class="metric-icon bg-danger bg-opacity-20 text-danger rounded-circle p-2">
                <i class="bi bi-person-x-fill fs-5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card dashboard-glass-card border-0 p-4">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 class="h5 fw-light text-white m-0">Lista de Respostas Recebidas</h4>
          <span class="badge bg-white bg-opacity-10 text-white px-3 py-2 fw-light">Total: {{ guests.length }} registros</span>
        </div>

        <div class="table-responsive">
          <table class="table dashboard-table align-middle text-white m-0">
            <thead>
              <tr>
                <th>Nome / Grupo</th>
                <th>Presença</th>
                <th class="text-center">Adultos</th>
                <th class="text-center">Crianças</th>
                <th>Data da Resposta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="guest in guests" :key="guest.id">
                <td class="fw-medium">{{ guest.name }}</td>
                <td>
                  <span :class="guest.attending ? 'badge bg-success bg-opacity-20 text-success' : 'badge bg-danger bg-opacity-20 text-danger'">
                    {{ guest.attending ? 'Confirmado' : 'Não vai' }}
                  </span>
                </td>
                <td class="text-center opacity-75">{{ guest.adults }}</td>
                <td class="text-center opacity-75">{{ guest.children }}</td>
                <td class="small opacity-50">{{ formatDate(guest.updatedAt) }}</td>
              </tr>
              <tr v-if="guests.length === 0">
                <td colspan="5" class="text-center py-4 text-muted small">Nenhuma confirmação recebida até o momento.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import api from '../services/api'

interface Guest {
  id: string | number
  name: string
  attending: boolean
  adults?: number
  children?: number
  updatedAt?: string
}

interface DashboardStats {
  confirmedCount: number
  adultsCount: number
  childrenCount: number
  declinedCount: number
}

interface DashboardResponse {
  guests?: Guest[]
  stats?: DashboardStats
}

const isLoading = ref(true)
const errorMessage = ref('')

const guests = ref<Guest[]>([])
const stats = ref<DashboardStats>({
  confirmedCount: 0,
  adultsCount: 0,
  childrenCount: 0,
  declinedCount: 0
})

const loadDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get<DashboardResponse>('/dashboard')

    guests.value = response.data.guests || []
    stats.value = response.data.stats || {
      confirmedCount: guests.value.filter(g => g.attending).length,
      adultsCount: guests.value.reduce((acc, g) => acc + (g.adults || 0), 0),
      childrenCount: guests.value.reduce((acc, g) => acc + (g.children || 0), 0),
      declinedCount: guests.value.filter(g => !g.attending).length
    }
  } catch (error) {
    console.error('Erro ao carregar painel:', error)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      errorMessage.value = 'Sessão expirada ou acesso negado. Faça login novamente.'
      handleLogout()
    } else {
      errorMessage.value = 'Não foi possível carregar os dados do painel.'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

const handleLogout = () => {
  localStorage.removeItem('auth_token')
  window.location.href = '/login'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })
}
</script>

<style scoped>
.dashboard-container {
  background: linear-gradient(135deg, #1e251f 0%, #0f1310 100%);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.dashboard-glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px;
}

.dashboard-table th {
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  color: #a0aab0;
  font-size: 0.85rem;
  text-transform: uppercase; /* CORREÇÃO: text-uppercase → text-transform */
  letter-spacing: 0.5px;
  font-weight: 500;
  padding: 12px 8px;
}

.dashboard-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 14px 8px;
}

.metric-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tracking-wider {
  letter-spacing: 2px;
}
.tracking-wide {
  letter-spacing: 0.5px;
}
.hover-opacity-100:hover {
  opacity: 1 !important;
}
</style>

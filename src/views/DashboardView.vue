<template>
  <div class="dashboard-container min-vh-100 p-4">
    <header class="dash-header d-flex justify-content-between align-items-end mb-4 pb-3">
      <div>
        <span class="eyebrow d-block mb-1">Painel de Confirmações</span>
        <h1 class="dash-title m-0">Lucas <em>&</em> Maria Clara</h1>
      </div>
      <button @click="handleLogout" class="btn-logout">↪ Sair</button>
    </header>

    <div v-if="isLoading" class="text-center my-5 py-5">
      <div class="spinner-border" style="color: var(--rose)" role="status">
        <span class="visually-hidden">Carregando dados...</span>
      </div>
      <p class="mt-3 small" style="color: var(--muted)">Sincronizando com o servidor...</p>
    </div>

    <div v-else-if="errorMessage" class="error-box mx-auto text-center">
      <p>{{ errorMessage }}</p>
      <button @click="loadDashboardData" class="btn-retry mt-2">Tentar novamente</button>
    </div>

    <div v-else>
      <!-- Métricas -->
      <div class="metrics-grid mb-4">
        <div class="metric-card confirmed">
          <p class="metric-label">Pessoas confirmadas</p>
          <p class="metric-value">{{ totalConfirmedPeople }}</p>
          <span class="metric-icon">✓</span>
        </div>
        <div class="metric-card adults">
          <p class="metric-label">Convidados pendentes</p>
          <p class="metric-value">{{ summary.pending }}</p>
          <span class="metric-icon">♟</span>
        </div>
        <div class="metric-card declined">
          <p class="metric-label">Pessoas recusadas</p>
          <p class="metric-value">{{ totalDeclinedPeople }}</p>
          <span class="metric-icon">✕</span>
        </div>
        <div class="metric-card children">
          <p class="metric-label">Total esperado</p>
          <p class="metric-value">{{ totalExpectedPeople }}</p>
          <span class="metric-icon">✦</span>
        </div>
      </div>

      <!-- Tabela -->
      <div class="table-card">
        <div class="table-header">
          <h2 class="table-title">Respostas recebidas</h2>
          <span class="badge-total">{{ guests.length }} registros</span>
        </div>

        <div class="table-responsive">
          <table class="dash-table w-100">
            <thead>
              <tr>
                <th style="width: 40px"></th>
                <th>Nome</th>
                <th>Presença</th>
                <th class="text-center">Acompanhantes</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="guest in guests" :key="guest.id">
                <!-- Linha principal -->
                <tr>
                  <td>
                    <button
                      @click="toggleExpand(guest.id)"
                      class="btn-expand"
                      :aria-label="isExpanded(guest.id) ? 'Recolher' : 'Expandir'"
                    >
                      {{ isExpanded(guest.id) ? '▼' : '▶' }}
                    </button>
                  </td>
                  <td class="td-name">{{ guest.name }}</td>
                  <td>
                    <span :class="pillClass(guest)">
                      {{ pillLabel(guest) }}
                    </span>
                  </td>
                  <td class="text-center td-num">
                    <span v-if="hasPlusOnes(guest)">
                      {{ confirmedPlusOnesCount(guest) }} / {{ totalPlusOnesCount(guest) }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>

                <!-- Linha de detalhes (acompanhantes) -->
                <tr v-if="isExpanded(guest.id)" class="detail-row">
                  <td colspan="4">
                    <div class="detail-content">
                      <!-- Carregando -->
                      <div v-if="isLoadingDetail(guest.id)" class="text-center py-3">
                        <div class="spinner-sm"></div>
                        <p class="small text-muted mt-2">Carregando acompanhantes...</p>
                      </div>

                      <!-- Com acompanhantes -->
                      <div v-else-if="getGuestDetail(guest.id)?.plus_ones?.length">
                        <p class="detail-label">
                          Acompanhantes de {{ guest.name.split(' ')[0] }}
                          <span class="badge-detail">
                            {{ confirmedPlusOnesCount(guest) }}/{{ totalPlusOnesCount(guest) }}
                            confirmados
                          </span>
                        </p>
                        <ul class="plusone-list">
                          <li
                            v-for="plus in getGuestDetail(guest.id)!.plus_ones!"
                            :key="plus.id"
                            class="plusone-item"
                          >
                            <span class="plusone-name">{{ plus.name }}</span>
                            <span
                              :class="[
                                'plusone-status',
                                plus.attending ? 'status-yes' : 'status-no',
                              ]"
                            >
                              {{ plus.attending ? '✅ Vai comparecer' : '❌ Não vai' }}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <!-- Sem acompanhantes -->
                      <div v-else class="text-muted small py-3 text-center">
                        <span>✦</span> Nenhum acompanhante cadastrado para este convidado.
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="guests.length === 0">
                <td colspan="4" class="text-center py-4 td-empty">
                  Nenhuma confirmação recebida até o momento.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-ornament">✦ ✦ ✦</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { dashboardService, type DashboardSummary } from '../services/dashboardService'
import { guestService, type Guest } from '../services/guestService'

// ===== ESTADOS =====
const isLoading = ref(true)
const errorMessage = ref('')
const guests = ref<Guest[]>([])
const summary = ref<DashboardSummary>({
  total: 0,
  attending: 0,
  declined: 0,
  pending: 0,
})

// Controle de expansão
const expandedGuestId = ref<number | null>(null)

// Cache de detalhes dos convidados (com plusOnes)
const guestDetailsMap = ref<Map<number, Guest>>(new Map())
const loadingDetails = ref<Set<number>>(new Set())

// ===== TOTAIS REAIS (convidados + acompanhantes) =====

const totalConfirmedPeople = computed(() =>
  guests.value.reduce((acc, guest) => {
    const guestCount = guest.attending ? 1 : 0
    const plusOnesCount = guest.plus_ones?.filter((p) => p.attending).length ?? 0
    return acc + guestCount + plusOnesCount
  }, 0),
)

const totalDeclinedPeople = computed(() =>
  guests.value.reduce((acc, guest) => {
    if (!guest.responded) return acc
    const guestCount = !guest.attending ? 1 : 0
    const plusOnesCount = guest.plus_ones?.filter((p) => !p.attending).length ?? 0
    return acc + guestCount + plusOnesCount
  }, 0),
)

const totalExpectedPeople = computed(() =>
  guests.value.reduce((acc, guest) => acc + 1 + (guest.plus_ones?.length ?? 0), 0),
)

// ===== AUXILIARES DE ACOMPANHANTES =====
const hasPlusOnes = (guest: Guest): boolean => {
  const detail = guestDetailsMap.value.get(guest.id)
  return !!(detail?.plus_ones?.length ?? guest.plus_ones?.length)
}

const totalPlusOnesCount = (guest: Guest): number => {
  const detail = guestDetailsMap.value.get(guest.id)
  return detail?.plus_ones?.length ?? guest.plus_ones?.length ?? 0
}

const confirmedPlusOnesCount = (guest: Guest): number => {
  const detail = guestDetailsMap.value.get(guest.id)
  const plusOnes = detail?.plus_ones ?? guest.plus_ones ?? []
  return plusOnes.filter((p) => p.attending).length
}

// ===== FUNÇÕES PRINCIPAIS =====
const loadDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [summaryResponse, guestsResponse] = await Promise.all([
      dashboardService.getSummary(),
      guestService.listAll(),
    ])

    summary.value = summaryResponse.data
    guests.value = guestsResponse.data
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

// ===== AUXILIARES DA TABELA =====
const pillLabel = (guest: Guest): string => {
  if (!guest.responded) return 'Pendente'
  return guest.attending ? 'Confirmado' : 'Não vai'
}

const pillClass = (guest: Guest): string => {
  if (!guest.responded) return 'pill pill-pending'
  return guest.attending ? 'pill pill-yes' : 'pill pill-no'
}

// ===== CONTROLE DE EXPANSÃO =====
const isExpanded = (id: number) => expandedGuestId.value === id
const isLoadingDetail = (id: number) => loadingDetails.value.has(id)
const getGuestDetail = (id: number) => guestDetailsMap.value.get(id)

const toggleExpand = async (id: number) => {
  if (isExpanded(id)) {
    expandedGuestId.value = null
    return
  }

  expandedGuestId.value = id

  if (guestDetailsMap.value.has(id)) return

  loadingDetails.value.add(id)
  try {
    const response = await guestService.getById(id)
    const guestData = response.data
    guestData.plus_ones = guestData.plus_ones ?? []

    guestDetailsMap.value.set(id, guestData)

    const index = guests.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      const current = guests.value[index]

      if (!current) return

      guests.value[index] = {
        id: current.id,
        name: current.name,
        responded: current.responded,
        attending: current.attending,
        plus_ones: guestData.plus_ones,
      }
    }
  } catch (error) {
    console.error(`Erro ao carregar detalhes do convidado ${id}:`, error)
  } finally {
    loadingDetails.value.delete(id)
  }
}

const refreshData = () => {
  loadDashboardData()
  guestDetailsMap.value.clear()
}

defineExpose({
  refreshData,
})
</script>

<style scoped src="../assets/css/DashBoardView.css"></style>

<style scoped>
.btn-expand {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px 8px;
  transition: all 0.2s;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-expand:hover {
  background: #f0ece8;
  color: var(--rose, #c44569);
}

.detail-row td {
  background-color: #faf8f6 !important;
  padding: 0 !important;
}

.detail-content {
  padding: 16px 20px 20px 50px;
  border-top: 1px solid #eee;
}

.detail-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge-detail {
  font-size: 0.75rem;
  font-weight: 500;
  background: #f0ece8;
  color: #666;
  padding: 2px 10px;
  border-radius: 20px;
}

.plusone-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plusone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0ece8;
  transition: background 0.2s;
}

.plusone-item:hover {
  background: #f5f2ef;
}

.plusone-item:last-child {
  border-bottom: none;
}

.plusone-name {
  font-weight: 500;
  color: #333;
}

.plusone-status {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 2px 12px;
  border-radius: 20px;
}

.status-yes {
  color: #2b7a4b;
  background: #e6f4ea;
}

.status-no {
  color: #b33c3c;
  background: #fde8e8;
}

.spinner-sm {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-top-color: var(--rose, #c44569);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.text-muted {
  color: #999;
}

.text-center {
  text-align: center;
}

.py-3 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.dash-table .td-num {
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-content {
    padding-left: 20px;
  }

  .plusone-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

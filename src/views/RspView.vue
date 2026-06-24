<template>
  <div class="rsvp-container min-vh-100 d-flex align-items-center justify-content-center p-3">
    <!-- ETAPA 1: Busca por nome -->
    <div v-if="step === 'search'" class="rsvp-card">
      <div class="card-ornament">✦</div>
      <p class="eyebrow">Confirmação de Presença</p>
      <h1 class="card-title">Lucas <em>&</em> Maria Clara</h1>
      <p class="card-subtitle">Digite seu nome para encontrarmos seu convite</p>

      <div class="search-wrapper mt-4">
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          class="rsvp-input"
          placeholder="Ex: João Silva..."
          autocomplete="off"
        />
        <i class="search-icon">⌕</i>
      </div>

      <ul v-if="searchResults && searchResults.length > 0" class="results-list">
        <li
          v-for="guest in searchResults"
          :key="guest.id"
          @click="selectGuest(guest)"
          class="result-item"
        >
          <span class="result-name">{{ guest.name }}</span>
          <span v-if="guest.responded" class="result-badge responded">Já respondeu</span>
          <span v-else class="result-badge pending">Pendente</span>
        </li>
      </ul>

      <p
        v-if="
          searchQuery.length >= 2 && (!searchResults || searchResults.length === 0) && !isSearching
        "
        class="no-results"
      >
        Nenhum convidado encontrado. Verifique o nome ou entre em contato.
      </p>

      <div v-if="isSearching" class="text-center mt-3">
        <div class="spinner-sm"></div>
      </div>
    </div>

    <!-- ETAPA 2: Formulário de confirmação -->
    <div v-else-if="step === 'form'" class="rsvp-card">
      <button @click="goBackToSearch" class="btn-back">← Voltar</button>
      <div class="card-ornament">✦</div>
      <p class="eyebrow">Olá, {{ selectedGuest?.name?.split(' ')[0] || 'Convidado' }}!</p>
      <h1 class="card-title">Você vai <em>comparecer</em>?</h1>

      <div class="attend-toggle mt-4">
        <button
          @click="setAttending(true)"
          :class="['toggle-btn', 'toggle-yes', { active: form.attending === true }]"
        >
          ✓ Sim, vou comparecer
        </button>
        <button
          @click="setAttending(false)"
          :class="['toggle-btn', 'toggle-no', { active: form.attending === false }]"
        >
          ✕ Não poderei ir
        </button>
      </div>

      <!-- Acompanhantes pré-cadastrados, cada um com seu próprio toggle -->

      <transition name="fade-slide">
        <div
          v-if="form.attending === true && form.plusOnes && form.plusOnes.length > 0"
          class="extra-fields mt-4"
        >
          <p class="fields-label">Seus acompanhantes também vão?</p>

          <div v-for="plusOne in form.plusOnes" :key="plusOne.id" class="plus-one-row">
            <span class="plus-one-name">{{ plusOne.name }}</span>
            <div class="attend-toggle attend-toggle-sm">
              <button
                @click="togglePlusOne(plusOne.id, true)"
                :class="['toggle-btn', 'toggle-yes', { active: plusOne.attending === true }]"
              >
                ✓ Vai
              </button>
              <button
                @click="togglePlusOne(plusOne.id, false)"
                :class="['toggle-btn', 'toggle-no', { active: plusOne.attending === false }]"
              >
                ✕ Não vai
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Resumo da confirmação -->
      <div v-if="form.attending !== null" class="confirmation-summary mt-4">
        <p class="summary-text">
          <span v-if="form.attending">
            ✅ Você vai comparecer
            <span v-if="confirmedPlusOnesCount > 0">
              com {{ confirmedPlusOnesCount }} acompanhante{{
                confirmedPlusOnesCount !== 1 ? 's' : ''
              }}
            </span>
          </span>
          <span v-else> ❌ Você não vai comparecer </span>
        </p>
      </div>

      <p v-if="errorMessage" class="form-error mt-3">{{ errorMessage }}</p>

      <button
        v-if="form.attending !== null"
        @click="submitRsvp"
        :disabled="isSubmitting"
        class="btn-submit mt-4"
      >
        <span v-if="isSubmitting"> <span class="spinner-sm-inline"></span> Enviando... </span>
        <span v-else>Confirmar resposta →</span>
      </button>
    </div>

    <!-- ETAPA 3: Confirmação final -->
    <div v-else-if="step === 'done'" class="rsvp-card text-center">
      <div class="done-icon">{{ form.attending ? '♥' : '✦' }}</div>
      <p class="eyebrow mt-3">{{ form.attending ? 'Até lá!' : 'Obrigado por avisar' }}</p>
      <h1 class="card-title">
        <span v-if="form.attending">Presença <em>confirmada</em></span>
        <span v-else>Vamos <em>sentir</em> sua falta</span>
      </h1>
      <p class="card-subtitle mt-3" v-if="form.attending">
        Confirmamos sua presença
        <span v-if="confirmedPlusOnesCount > 0">
          e de {{ confirmedPlusOnesCount }} acompanhante{{
            confirmedPlusOnesCount !== 1 ? 's' : ''
          }} </span
        >. <br />Estamos ansiosos para celebrar com você!
      </p>
      <p class="card-subtitle mt-3" v-else>
        Obrigado por nos avisar. Você será lembrado com carinho neste dia especial.
      </p>
      <div class="done-ornament mt-4">✦ ✦ ✦</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import { guestService, type Guest, type PlusOneConfirmation } from '../services/guestService'
import '../assets/css/RspForm.css'

type Step = 'search' | 'form' | 'done'

// Estado de UI para cada acompanhante: carrega o nome (só exibição),
// além de id/attending que vão de fato pro backend.
interface PlusOneFormState {
  id: number
  name: string
  attending: boolean
}

// ===== ESTADOS =====
const step = ref<Step>('search')
const searchQuery = ref('')
const searchResults = ref<Guest[]>([]) // ← Inicializa como array vazio, não null
const selectedGuest = ref<Guest | null>(null)
const isSearching = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = ref<{
  attending: boolean | null
  plusOnes: PlusOneFormState[]
}>({
  attending: null,
  plus_ones: [], // ← Inicializa como array vazio
})

const confirmedPlusOnesCount = computed(
  () => form.value.plusOnes?.filter((p) => p.attending === true).length ?? 0,
)

let searchTimeout: ReturnType<typeof setTimeout>

// ===== BUSCA =====
const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchResults.value = [] // ← Garante que seja um array vazio

  if (searchQuery.value.length < 2) {
    return
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const response = await guestService.searchByName(searchQuery.value)
      // Garante que response.data seja um array
      searchResults.value = Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Erro na busca:', error)
      searchResults.value = [] // ← Em caso de erro, mantém array vazio
    } finally {
      isSearching.value = false
    }
  }, 400)
}

// ===== SELEÇÃO =====
const selectGuest = async (guest: Guest) => {
  if (guest.responded) {
    errorMessage.value = 'Este convidado já enviou uma resposta anteriormente.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  selectedGuest.value = guest
  form.value.attending = null
  form.value.plusOnes = []
  errorMessage.value = ''

  const response = await guestService.getById(guest.id)
  const fullGuest = response.data
  console.log('fullGuest:', fullGuest)
  console.log('plus_ones:', fullGuest.plus_ones)
  selectedGuest.value = fullGuest

  form.value.plusOnes = (fullGuest.plus_ones || []).map((p) => ({
    id: p.id,
    name: p.name,
    attending: false,
  }))
  console.log('form.plusOnes:', form.value.plusOnes)
  step.value = 'form'
}
// ===== FUNÇÕES DO FORMULÁRIO =====
const setAttending = (value: boolean) => {
  form.value.attending = value
  errorMessage.value = ''
}

const togglePlusOne = (id: number, attending: boolean) => {
  const plusOne = form.value.plusOnes?.find((p) => p.id === id)
  if (plusOne) {
    plusOne.attending = attending
  }
}

const goBackToSearch = () => {
  step.value = 'search'
  form.value = {
    attending: null,
    plusOnes: [],
  }
  selectedGuest.value = null
  errorMessage.value = ''
}

// ===== SUBMISSÃO =====
const submitRsvp = async () => {
  if (!selectedGuest.value) {
    errorMessage.value = 'Convidado não selecionado. Tente novamente.'
    return
  }

  if (form.value.attending === null) {
    errorMessage.value = 'Por favor, selecione se você vai comparecer.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const plusOnesPayload: PlusOneConfirmation[] = form.value.attending
      ? form.value.plusOnes.map(({ id, attending }) => ({ id, attending }))
      : []

    await guestService.confirm(Number(selectedGuest.value.id), {
      attending: form.value.attending,
      plus_ones: plusOnesPayload, // ← snake_case
    })

    step.value = 'done'
  } catch (error) {
    console.error('Erro ao confirmar:', error)

    if (axios.isAxiosError(error)) {
      const responseError = error.response?.data?.error
      if (responseError) {
        errorMessage.value = responseError
      } else if (error.response?.status === 404) {
        errorMessage.value = 'Convidado não encontrado. Tente novamente.'
      } else {
        errorMessage.value = 'Erro ao enviar. Tente novamente mais tarde.'
      }
    } else {
      errorMessage.value = 'Erro inesperado. Tente novamente.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="../assets/css/RspForm.css"></style>

<!-- ESTILOS ADICIONAIS -->
<style scoped>
/* Spinner inline para o botão */
.spinner-sm-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Resumo da confirmação */
.confirmation-summary {
  padding: 12px 16px;
  background: #f8f5f2;
  border-radius: 8px;
  border-left: 3px solid var(--rose, #c44569);
}

.summary-text {
  margin: 0;
  font-size: 0.95rem;
  color: #333;
}

.summary-text span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Estilos para os resultados da busca */
.results-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f0ece8;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8f5f2;
}

.result-name {
  font-weight: 500;
  color: #2d2d2d;
}

.result-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.result-badge.responded {
  background: #e6f4ea;
  color: #2b7a4b;
}

.result-badge.pending {
  background: #fff3e0;
  color: #b36b1e;
}

/* Mensagem de erro */
.form-error {
  color: #d32f2f;
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  background: #fde8e8;
  border-radius: 6px;
  border: 1px solid #f5c6c6;
}

/* Spinner de busca */
.spinner-sm {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #f0ece8;
  border-top-color: var(--rose, #c44569);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Animações */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsividade */
@media (max-width: 480px) {
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .plus-one-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .attend-toggle-sm {
    width: 100%;
  }

  .attend-toggle-sm .toggle-btn {
    flex: 1;
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}
</style>

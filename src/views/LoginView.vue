<template>
  <div class="auth-container">
    <GlassCard>
      <div class="text-center mb-4">
        <div class="d-flex align-items-center justify-content-center gap-2 mb-1">
          <h2 class="cursive-font m-0">Lucas Mateus</h2>
          <span class="cursive-font m-0" style="font-size: 2.2rem">&</span>
          <h2 class="cursive-font m-0">Maria Clara</h2>
        </div>
        <p class="small text-uppercase tracking-wider mb-2">Sábado · 07 · Novembro · 2026</p>
        <hr class="glass-divider my-3" />
        <h5 class="fw-light tracking-wide">Confirmação de Presença</h5>
      </div>
      <FeedbackMessage :message="errorMessage" type="error" />
      <FeedbackMessage :message="successMessage" type="success" />
      <form @submit.prevent="handleLogin">
        <EmailInput v-model="email" />
        <PasswordInput v-model="password" />
        <SubmitButton :loading="isLoading" label="Acessar" />
      </form>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { authService } from '../services/authService'
import GlassCard from '../components/Layout/GlassCard.vue'
import EmailInput from '../components/Auth/EmailInput.vue'
import PasswordInput from '../components/Auth/PasswordInput.vue'
import FeedbackMessage from '../components/Auth/FeedbackMessage.vue'
import SubmitButton from '../components/Auth/SubmitButton.vue'

interface ErrorResponse {
  message?: string
}

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await authService.login({
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('auth_token', response.data.data.token)
    successMessage.value = 'Acesso liberado! Entrando no painel...'
    setTimeout(() => router.push('/dashboard'), 1500)
  } catch (error) {
    const data = axios.isAxiosError<ErrorResponse>(error) ? error.response?.data : null
    errorMessage.value = data?.message || 'Erro ao conectar ao servidor.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button type="submit" class="btn btn-glass-primary w-100 mt-2" :disabled="loading">
    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
    {{ loading ? 'Autenticando...' : label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  label: string
}>()
</script>

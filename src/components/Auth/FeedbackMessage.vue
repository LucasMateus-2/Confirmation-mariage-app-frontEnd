<template>
  <div
    v-if="message"
    :class="[
      'alert py-2 px-3 small text-center mb-3 border-0',
      type === 'error' ? 'alert-danger' : 'alert-success'
    ]"
    :style="type === 'error'
      ? 'background: rgba(220, 53, 69, 0.2); color: #ff8080; border-radius: 10px;'
      : 'background: rgba(40, 167, 69, 0.2); color: #85e39d; border-radius: 10px;'"
  >
    <i :class="type === 'error' ? 'bi bi-exclamation-triangle-fill me-2' : 'bi bi-check-circle-fill me-2'"></i>
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  type: 'error' | 'success'
}>()
</script>


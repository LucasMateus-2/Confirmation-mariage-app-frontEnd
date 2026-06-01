<template>
  <div class="mb-4 glass-input-group">
    <label class="form-label">E-mail de Acesso</label>
    <div class="input-group">
      <span class="input-group-text"><i class="bi bi-envelope"></i></span>
      <input
        type="email"
        class="form-control"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="seu-email@exemplo.com"
        required
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])
</script>

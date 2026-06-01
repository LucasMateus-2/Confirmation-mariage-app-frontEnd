<template>
  <div class="mb-4 glass-input-group">
    <label class="form-label">Senha</label>
    <div class="input-group">
      <span class="input-group-text"><i class="bi bi-lock"></i></span>

      <input
        :type="show ? 'text' : 'password'"
        class="form-control"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="••••••••"
        required
      />

      <button class="btn btn-eye" type="button" @click="show = !show">
        <i :class="show ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const show = ref(false)
</script>


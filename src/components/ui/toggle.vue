<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui';
import IconLocal from './icon-local.vue';

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { modelValue } = defineProps<{
  modelValue: boolean;
}>();
</script>

<template>
  <CheckboxRoot
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v as boolean)"
    class="CheckboxRoot"
  >
    <CheckboxIndicator class="CheckboxIndicator">
      <IconLocal icon="radix-icons:check" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<style scoped>
.CheckboxRoot {
  background-color: var(--background-glass);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.CheckboxRoot:hover {
  background-color: var(--primary);
  border-color: var(--primary);
}

.CheckboxRoot:focus {
  box-shadow: 0 0 0 2px var(--primary, #007bff33);
  border-color: var(--primary);
}

.CheckboxIndicator {
  color: var(--secondary);
  font-size: 16px;
}
</style>

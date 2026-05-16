<script setup lang="ts">
import type { SelectItemProps } from 'reka-ui'
import { SelectItem, SelectItemText } from 'reka-ui'

const props = defineProps<SelectItemProps>()
</script>

<template>
  <SelectItem v-bind="props" class="SelectItem">
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

<style scoped>
.SelectItem {
  display: flex;
  align-items: center;
  position: relative;
  user-select: none;
  border-radius: 6px;
  padding: 4px 6px !important;
  outline: none !important;
  transition: all 0.2s ease-in-out;

}

.SelectItem:hover {
  background-color: var(--background-glass);
  backdrop-filter: blur(10px);
  border-radius: 6px;
}
</style>
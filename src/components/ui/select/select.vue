<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
import { SelectContent, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue, SelectViewport, useForwardPropsEmits } from 'reka-ui'
import IconLocal from '../icon-local.vue'

const props = defineProps<SelectRootProps & {class?: string}>()
const emits = defineEmits<SelectRootEmits>()

const forward = useForwardPropsEmits(props, emits)

</script>

<template>
  <SelectRoot v-bind="forward">
    <SelectTrigger :class="['SelectTrigger', props.class]">
      
        <SelectValue>
<template v-if="$slots.trigger">
        <slot name="trigger" />
      </template>
        </SelectValue>
    </SelectTrigger>

    <SelectPortal class="SelectViewport">
      <SelectContent class="SelectContent">
        <SelectScrollUpButton>
          <IconLocal icon="radix-icons:chevron-up" />
        </SelectScrollUpButton>
        <SelectViewport>
          <slot />
        </SelectViewport>
        <SelectScrollDownButton>
          <IconLocal icon="radix-icons:chevron-down" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
button {
  all: unset;
}

.SelectTrigger {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 6px;
  padding: 4px 6px;
  border: 1px solid var(--background);
  background: var(--secondary-glass);
  backdrop-filter: blur(10px);
  height: -webkit-fill-available;
  transition: all 0.2s ease-in-out;
}
.SelectTrigger:hover {
  background-color: var(--mauve-3);
}
.SelectTrigger[data-placeholder] {
  color: var(--grass-9);
}

:deep(.SelectContent) {
  padding: 4px;
  background: var(--secondary-glass);
  border: 1px solid var(--border);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  z-index: 10;
}


</style>

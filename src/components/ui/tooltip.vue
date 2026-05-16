<script setup lang="ts">
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'
import { TooltipArrow, TooltipContent, TooltipRoot, TooltipTrigger, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<TooltipRootProps & { content?: string }>()
const emits = defineEmits<TooltipRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forward">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent
      side="top"
      align="center"
      class="TooltipContent"
    >
      {{ content }}
      <TooltipArrow
        :width="11"
        :height="5"
        class="TooltipArrow"
      />
    </TooltipContent>
  </TooltipRoot>
</template>

<style scoped>
button {
  all: unset;
}

:deep(.TooltipContent) {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  padding: 4px;
  font-size: 12px;
  line-height: 1;
  background-color: var(--background-glass);
  user-select: none;
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.TooltipContent[data-state='delayed-open'][data-side='top'] {
  animation-name: slideDownAndFade;
}
.TooltipContent[data-state='delayed-open'][data-side='right'] {
  animation-name: slideLeftAndFade;
}
.TooltipContent[data-state='delayed-open'][data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.TooltipContent[data-state='delayed-open'][data-side='left'] {
  animation-name: slideRightAndFade;
}

.TooltipArrow {
  fill: var(--background-glass);
}

.IconButton {
  font-family: inherit;
  border-radius: 100%;
  height: 35px;
  width: 35px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.IconButton:hover {
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px);
}

@keyframes slideUpAndFade {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRightAndFade {
  from {
    opacity: 0;
    transform: translateX(-2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeftAndFade {
  from {
    opacity: 0;
    transform: translateX(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
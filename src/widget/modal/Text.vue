<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import Input from '../../components/ui/input.vue';
import { ref } from 'vue';

const { defaultText, onSubmit, label, placeholder } = defineProps<{
	defaultText?: string;
  label?: string;
  placeholder?: string;
	onSubmit: (text: string) => void;
}>();

const open = ref(false)

const handleEnter = (e: KeyboardEvent) => {
  onSubmit((e.currentTarget as HTMLInputElement).value)
  open.value = false;
}

</script>

<template>
  <DialogRoot :open="open" @update:open="(b) => open = b">
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="DialogOverlay" />
      <DialogContent class="DialogContent">
        <DialogTitle v-if="label" class="DialogTitle">
          {{ label }}
        </DialogTitle>
        <Input :value="defaultText" :placeholder="placeholder" v-on:keyup.enter="handleEnter" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
 
<style scoped>

/* reset */
button,
fieldset,
input {
  all: unset;
}



.DialogOverlay {
  position: fixed;
  z-index: 1000;

  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.DialogContent {
  position: fixed;
  z-index: 1000;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);

    border-radius: 6px;
    opacity: 1;
    transition: all 0.2s ease-in-out;
    display: flex;
    gap: 4px;
    flex-direction: column;
}
.DialogTitle {
  margin: 0;
  font-weight: 500;
  color: var(--mauve-12);
  font-size: 24px;
}
.SliderRoot {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  width: 200px;
  height: 20px;
}

.SliderTrack {
  background-color: var(--secondary-glass);
  position: relative;
  flex-grow: 1;
  border-radius: 9999px;
  height: 3px;
}

.SliderRange {
  position: absolute;
  background-color: white;
  border-radius: 9999px;
  height: 100%;
}

.SliderThumb {
  display: block;
  width: 20px;
  height: 20px;
  background-color: var(--foreground);
  border-radius: 10px;
}

.SliderValue {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
 background-color: var(--background-glass);
    border: 1px solid var(--secondary);
    border-radius: 6px;
    opacity: 0;
    transition: all 0.2s ease-in-out;
    display: flex;
    padding: 4px;
    gap: 4px;
    flex-direction: column;
    backdrop-filter: blur(10px);
}

.SliderThumb:hover {
  & > .SliderValue {
    opacity: 1;
  }
}
.SliderThumb:focus {
  & > .SliderValue {
    opacity: 1;
  }
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
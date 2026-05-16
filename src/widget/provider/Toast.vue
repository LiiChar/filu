<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { hideToast, useToast } from '../../store/toast';
import {
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from 'reka-ui';
import Button from '../../components/ui/button.vue';

const toast = useToast();
const { open, title, content } = storeToRefs(toast);
</script>

<template>
  <ToastProvider>
    <ToastRoot :force-mount="true" v-if="open" @update:open="() => hideToast()" class="ToastRoot">
      <div class="ToastContent">
        <ToastTitle v-if="title">{{ title }}</ToastTitle>
       <ToastDescription v-if="content">
        <component :is="content" v-if="typeof content !== 'string'" />
        <template v-else>{{ content }}</template>
      </ToastDescription>
      </div>
      <ToastClose as-child aria-label="Close"><Button class="ToastButton" variant="rounded" aria-hidden="true">×</Button></ToastClose>
    </ToastRoot>

    <ToastViewport class="ToastViewport" />
    <slot></slot>
  </ToastProvider>
</template>

<style>
.ToastButton {
  aspect-ratio: 1 / 1;
  height: 30px;
  width: 30px;
}
.ToastViewport {
  --viewport-padding: 25px;
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--viewport-padding);
  gap: 10px;
  max-width: 100vw;
  margin: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
}

.ToastRoot {
  background-color: var(--background-glass);

  border-radius: 6px;
  display: flex;
  padding: 15px;
  display: grid;
  grid-template-areas: 'title action' 'description action';
  grid-template-columns: auto max-content;
  column-gap: 15px;
  align-items: center;
}
.ToastRoot[data-state='open'] {
  animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ToastRoot[data-state='closed'] {
  animation: hide 100ms ease-in;
}
.ToastRoot[data-swipe='move'] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}
.ToastRoot[data-swipe='cancel'] {
  transform: translateX(0);
  transition: transform 200ms ease-out;
}
.ToastRoot[data-swipe='end'] {
  animation: swipeOut 100ms ease-out;
}
@keyframes hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes slideIn {
  from {
    transform: translateX(calc(100% + var(--viewport-padding)));
  }
  to {
    transform: translateX(0);
  }
}
@keyframes swipeOut {
  from {
    transform: translateX(var(--reka-toast-swipe-end-x));
  }
  to {
    transform: translateX(calc(100% + var(--viewport-padding)));
  }
}
</style>

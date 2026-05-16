<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MediaPlayer from '../media/MediaPlayer.vue';
import { useRouter } from 'vue-router';
import { useVideoStore } from '../../store/video';
import { storeToRefs } from 'pinia';
import { clamp } from '../../utils/math';
import { getCurrentWindow } from '@tauri-apps/api/window';

const {currentRoute} = useRouter();
const {video} = storeToRefs(useVideoStore());

const draggableRef = ref<HTMLDivElement>();

function startDrag(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  const clientWidth = document.body.clientWidth
  const clientHeight = document.body.clientHeight
  
  const target = e.currentTarget as HTMLDivElement;

  const isTouch = 'touches' in e;
  const startX = isTouch ? e.touches[0].clientX : e.clientX;
  const startY = isTouch ? e.touches[0].clientY : e.clientY;

  const computedStyle = window.getComputedStyle(target);
  const startWidth = parseFloat(computedStyle.width) || 250;
  const startHeight = parseFloat(computedStyle.height) || 200;
  const startLeft = parseFloat(computedStyle.left) || 20;
  const startTop = parseFloat(computedStyle.top) || 20;

  const drag = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const isTouchMove = 'touches' in event;
    const clientX = isTouchMove ? event.touches[0].clientX : event.clientX;
    const clientY = isTouchMove ? event.touches[0].clientY : event.clientY;

    const left = clamp(0, startLeft + (clientX - startX), clientWidth - startWidth);
    const top = clamp(0, startTop + (clientY - startY), clientHeight - startHeight);

    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
  };

  const endDrag = () => {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  };

  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
}

function startResize(e: MouseEvent | TouchEvent, direction: string) {
  e.preventDefault();
  e.stopPropagation();

  const target = (e.currentTarget as HTMLElement)?.parentElement as HTMLDivElement;
  if (!target) return;

  const isTouch = 'touches' in e;
  const startX = isTouch ? e.touches[0].clientX : e.clientX;
  const startY = isTouch ? e.touches[0].clientY : e.clientY;

  const computedStyle = window.getComputedStyle(target);
  const startWidth = parseFloat(computedStyle.width) || 250;
  const startHeight = parseFloat(computedStyle.height) || 200;
  const startLeft = parseFloat(computedStyle.left) || 0;
  const startTop = parseFloat(computedStyle.top) || 0;

  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;

  const resize = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();

    const isTouchMove = 'touches' in event;
    const clientX = isTouchMove ? event.touches[0].clientX : event.clientX;
    const clientY = isTouchMove ? event.touches[0].clientY : event.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // --- горизонталь ---
    if (direction.includes('right')) {
      newWidth = Math.max(100, startWidth + deltaX);
      if (newLeft + newWidth > clientWidth)
        newWidth = clientWidth - newLeft;
    }

    if (direction.includes('left')) {
      newWidth = Math.max(100, startWidth - deltaX);
      newLeft = startLeft + (startWidth - newWidth);
      if (newLeft < 0) {
        newWidth += newLeft; // уменьшаем ширину на выход
        newLeft = 0;
      }
    }

    // --- вертикаль ---
    if (direction.includes('bottom')) {
      newHeight = Math.max(100, startHeight + deltaY);
      if (newTop + newHeight > clientHeight)
        newHeight = clientHeight - newTop;
    }

    if (direction.includes('top')) {
      newHeight = Math.max(100, startHeight - deltaY);
      newTop = startTop + (startHeight - newHeight);
      if (newTop < 0) {
        newHeight += newTop; // уменьшаем высоту на выход
        newTop = 0;
      }
    }

    // финальные ограничения
    newLeft = clamp(0, newLeft, clientWidth - newWidth);
    newTop = clamp(0, newTop, clientHeight - newHeight);

    target.style.width = `${newWidth}px`;
    target.style.height = `${newHeight}px`;
    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
  };

  const endResize = () => {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('touchmove', resize);
    document.removeEventListener('mouseup', endResize);
    document.removeEventListener('touchend', endResize);
  };

  document.addEventListener('mousemove', resize);
  document.addEventListener('touchmove', resize);
  document.addEventListener('mouseup', endResize);
  document.addEventListener('touchend', endResize);
}

const handleResize = (clientWidth: number, clientHeight: number) => {
  if (!draggableRef.value) return;

  const target = draggableRef.value as HTMLDivElement;
  const rect = target.getBoundingClientRect();
  const style = window.getComputedStyle(target);

  let startLeft = parseFloat(style.left) || rect.left;
  let startTop = parseFloat(style.top) || rect.top;
  let width = parseFloat(style.width) || rect.width;
  let height = parseFloat(style.height) || rect.height;

  // Корректируем позицию, чтобы не выходил за край
  const left = clamp(0, startLeft, clientWidth - width);
  const top = clamp(0, startTop, clientHeight - height);

  target.style.left = `${left}px`;
  target.style.top = `${top}px`;
};

onMounted(async () => {
  const monitor = getCurrentWindow();

  // Сразу получить правильный scaleFactor
  const scaleFactor = await monitor.scaleFactor();

  monitor.onResized(async ({ payload }) => {
    // В payload.width / height — физические пиксели, переводим в логические
    const logicalWidth = payload.width / scaleFactor;
    const logicalHeight = payload.height / scaleFactor;

    handleResize(logicalWidth, logicalHeight);
  });
});

</script>

<template>
  <div v-if="video && currentRoute.path !== '/'" :class="['draggable-container', { 'player': currentRoute.path === '/' }]">
    <div ref="draggableRef" class="draggable" @mousedown="startDrag" @touchstart="startDrag">
      <MediaPlayer :preview="true"/>
      <!-- Resize handles -->
      <!-- Corner handles -->
      <div class="resize-handle corner top-left" @mousedown="(e) => startResize(e, 'top-left')" @touchstart="(e) => startResize(e, 'top-left')"></div>
      <div class="resize-handle corner top-right" @mousedown="(e) => startResize(e, 'top-right')" @touchstart="(e) => startResize(e, 'top-right')"></div>
      <div class="resize-handle corner bottom-left" @mousedown="(e) => startResize(e, 'bottom-left')" @touchstart="(e) => startResize(e, 'bottom-left')"></div>
      <div class="resize-handle corner bottom-right" @mousedown="(e) => startResize(e, 'bottom-right')" @touchstart="(e) => startResize(e, 'bottom-right')"></div>
      <!-- Side handles -->
      <div class="resize-handle side top" @mousedown="(e) => startResize(e, 'top')" @touchstart="(e) => startResize(e, 'top')"></div>
      <div class="resize-handle side bottom" @mousedown="(e) => startResize(e, 'bottom')" @touchstart="(e) => startResize(e, 'bottom')"></div>
      <div class="resize-handle side left" @mousedown="(e) => startResize(e, 'left')" @touchstart="(e) => startResize(e, 'left')"></div>
      <div class="resize-handle side right" @mousedown="(e) => startResize(e, 'right')" @touchstart="(e) => startResize(e, 'right')"></div>
    </div>
  </div>
</template>

<style scoped>
  .draggable {
    position: absolute;
    left: 40px;
    top: 40px;
    z-index: 10000;
    width: 250px;
    height: 200px;
    background: var(--background-glass);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .draggable-container.player .draggable :deep(video) {
    object-fit: cover !important;
  }

  .draggable-container.player {
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 0;
    filter: blur(10px);
    width: 100%;
    height: 100%;
  }

  .draggable-container.player .draggable {
    left: 0px;
    top: 0px;
    z-index: 1;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(10px);
  }

  .draggable-container {
    position: relative;
  }

  .resize-handle {
    position: absolute;
    cursor: pointer;
  }

  /* Corner handles */
  .resize-handle.corner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    z-index: 2;
  }

  .resize-handle.top-left {
    top: -5px;
    left: -5px;
    cursor: nw-resize;
  }

  .resize-handle.top-right {
    top: -5px;
    right: -5px;
    cursor: ne-resize;
  }

  .resize-handle.bottom-left {
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
  }

  .resize-handle.bottom-right {
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
  }

  /* Side handles */
  .resize-handle.side {
    z-index: 1;

  }

  .resize-handle.top {
    top: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: n-resize;
  }

  .resize-handle.bottom {
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: s-resize;
  }

  .resize-handle.left {
    left: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: w-resize;
  }

  .resize-handle.right {
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: e-resize;
  }
</style>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  ProgressIndicator,
  ProgressRoot,
} from 'reka-ui'
import { ref } from 'vue'
import Button from '../../components/ui/button.vue'
import { useI18n } from '../../composables/useI18n'
import { storeToRefs } from 'pinia';
import { useDownloadStore } from '../../store/donwload';
import IconLocal from '../../components/ui/icon-local.vue'

const toggleState = ref(false)

const { t } = useI18n();


const {activeDownloads} = storeToRefs(useDownloadStore());



</script>

<template>
  <DropdownMenuRoot class="header-container" v-model:open="toggleState">
    <DropdownMenuTrigger
      as-child
    >
    <Button class="IconButton header-trigger"
    variant="rounded"
      :class="{'open-download': toggleState, 'download-trigger': true}"
      aria-label="Customise options">
        <IconLocal icon="material-symbols:download-rounded" />
    </Button>
      
    </DropdownMenuTrigger>

    <DropdownMenuPortal force-mount>
      <DropdownMenuContent
      as-child
        side="top"
        :side-offset="5"
      >
      <div class="DropdownMenuContent">
        <div class="download-item" v-for="download in activeDownloads" :key="download.id">
          <div class="download-info">
            <div class="download-title-container">
              <div class="download-thumbnail">
                <img v-if="download.metadata" :src="download.metadata?.thumbnail" alt="" class="thumbnail-image"></img>
                <IconLocal v-else icon="tabler:video-filled" class="thumbnail-icon" />
              </div>
              <div class="download-details">
                <div class="download-title">{{ download.title }}</div>
                <div class="download-meta">
                  <span class="download-total" v-if="download.progress.ETA">{{ download.progress.ETA }}</span>
                  <span class="download-status" :class="download.status">{{ download.status }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="download-progress-section">
            <ProgressRoot class="ProgressRoot" v-bind:model-value="download.progress.percent">
              <ProgressIndicator :style="`transform: translateX(-${100 - download.progress.percent}%)`" class="ProgressIndicator" />
            </ProgressRoot>
            <div class="download-progress-info">
              <div class="download-percent">{{ download.progress.percent }}%</div>
              <div class="download-speed">{{ download.progress.speed }}</div>
            </div>
          </div>
        </div>
        <div v-if="activeDownloads.length === 0" class="no-downloads">
          <IconLocal icon="material-symbols:download-done" />
          <span>{{ t('download.title') }}</span>
        </div>
      </div>

      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style scoped>
.download-trigger {
  z-index: 543532623453425324 !important;
  height: 17px;
  width: 17px;
}

body:has(.open-download) .header-trigger {
  opacity: 1 !important;
}

body:has(.open-download):hover .header-trigger {
opacity: 1 !important;
}

.header-trigger {
  z-index: 1000000000;
  cursor: pointer;
}


.header-trigger:hover {
  opacity: 1 !important;
}
.DropdownMenuArrow {
  height: 12px !important;
  width: 14px !important;
  width: 100%;
  height: 100%;
}

.ProgressRoot {
  position: relative;
  overflow: hidden;
  background: var(--secondary-glass);
  border-radius: 99999px;
  width: 300px;
  height: 3px;
  transform: translateZ(0);
}

.ProgressIndicator {
  background-color: var(--primary);
  width: 100%;
  height: 100%;
  transition: transform 660ms cubic-bezier(0.65, 0, 0.35, 1);
}

button {
  all: unset;
}

body:has(.open-download) .header-trigger {
  backdrop-filter: blur(0px) !important;
  background-color: var(--background-glass) !important;
}

.DropdownMenuContent {
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background-color: var(--background-glass);
  backdrop-filter: blur(10px) ;
  border-radius: 6px;
  overflow: hidden;
  margin-right: -10px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  translate: 8px 0;
}

.DropdownMenuContent[data-side='top'],
.DropdownMenuSubContent[data-side='top'] {
  animation-name: slideDownAndFade;
}
.DropdownMenuContent[data-side='right'],
.DropdownMenuSubContent[data-side='right'] {
  animation-name: slideLeftAndFade;
}
.DropdownMenuContent[data-side='bottom'],
.DropdownMenuSubContent[data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.DropdownMenuContent[data-side='left'],
.DropdownMenuSubContent[data-side='left'] {
  animation-name: slideRightAndFade;
}


.DropdownMenuArrow path {
  fill: var(--secondary-glass) !important;
}

.IconButton {
    position: absolute;
    bottom: 36px;
    transform: translateY(50%);
    left: 38px;
    z-index: 100;
    position: fixed;
    padding: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    border-color: transparent;
    background-color: var(--secondary-glass);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease-in-out;
}
.IconButton:hover {
  backdrop-filter: blur(0px) !important;
  background-color: var(--background-glass) !important;
}

.RightSlot {
  margin-left: auto;
  padding-left: 20px;
  color: var(--mauve-11);
}
[data-highlighted] > .RightSlot {
  color: white;
}
[data-disabled] .RightSlot {
  color: var(--mauve-8);
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

/* New styles for improved design */
.download-item {
  padding: 12px;
  border-bottom: 1px solid var(--secondary-glass);
  transition: background-color 0.2s ease;
}

.download-item:last-child {
  border-bottom: none;
}

.download-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.download-title-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.download-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--secondary-glass);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-icon {
  font-size: 20px;
  color: var(--text-secondary);
}

.download-details {
  flex: 1;
  min-width: 0;
}

.download-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.download-total {
  color: var(--text-secondary);
}

.download-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.download-status.downloading {
  background-color: var(--primary);
  color: white;
}

.download-status.completed {
  background-color: #10b981;
  color: white;
}

.download-status.failed {
  background-color: #ef4444;
  color: white;
}

.download-status.paused {
  background-color: #f59e0b;
  color: white;
}

.download-status.pending {
  background-color: #3b82f6;
  color: white;
}

.download-progress-section {
  margin-top: 8px;
}

.download-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.download-percent {
  font-weight: 500;
}

.download-speed {
  opacity: 0.8;
}

.no-downloads {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-downloads .thumbnail-icon {
  font-size: 24px;
  opacity: 0.6;
}
</style>

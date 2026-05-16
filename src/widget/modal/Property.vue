<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from 'reka-ui'
import { useVideoStore } from '../../store/video'
import { storeToRefs } from 'pinia'
import { formattedTime } from '../../utils/time'
import Button from '../../components/ui/button.vue'
import { onMounted, ref, computed } from 'vue'
import { parseWebStream } from 'music-metadata'
import { convertFileSrc } from '@tauri-apps/api/core'
import { getSep } from '../../utils/path'
import { openPath } from '../../api/file'
import IconLocal from '../../components/ui/icon-local.vue'

const videoStore = useVideoStore()
const { metadata, video } = storeToRefs(videoStore)
const loading = ref(false)
const activeTab = ref('Файл')

onMounted(async () => {
  if (video.value) {
    loading.value = true
      const response = await fetch(convertFileSrc(video.value?.path));


    const contentLength = response.headers.get('Content-Length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;
    const metadata = await parseWebStream(response.body, {
      mimeType: response.headers.get('Content-Type')!,
      size 
    });
    console.log(metadata);
    
    videoStore.metadata = metadata;
    loading.value = false

  }
      
})


const sections = computed(() => [
  {
    title: 'Общее',
    icon: 'mdi:information-outline',
    items: [
      {
        key: 'artist',
        label: 'Артист',
        icon: 'mdi:microphone',
        get: () => metadata.value?.common?.artist,
      },
      {
        key: 'year',
        label: 'Год',
        icon: 'mdi:calendar',
        get: () => metadata.value?.common?.year,
      },
      {
        key: 'date',
        label: 'Дата',
        icon: 'mdi:calendar-check',
        get: () => metadata.value?.common?.date,
      },
      {
        key: 'comment',
        label: 'Комментарий',
        icon: 'mdi:comment-text',
        get: () => metadata.value?.common?.comment?.[0]?.text,
      },
      {
        key: 'description',
        label: 'Описание',
        icon: 'mdi:text',
        get: () => metadata.value?.common?.description?.[0],
      },
    ],
  },
  {
    title: 'Файл',
    icon: 'mdi:file-outline',
    items: [
      {
        key: 'title',
        label: 'Название',
        icon: 'mdi:movie',
        get: () => video.value?.title?.split('.')[0],
      },
      {
        key: 'type',
        label: 'Тип файла',
        icon: 'mdi:file-code',
        get: () => video.value?.title?.split('.').pop(),
      },
      {
        key: 'path',
        label: 'Расположение',
        icon: 'mdi:folder-outline',
        get: () => video.value?.path,
      },
      {
        key: 'encodedby',
        label: 'Кодировщик',
        icon: 'mdi:account-cog',
        get: () => metadata.value?.common?.encodedby,
      },
    ],
  },
  {
    title: 'Формат',
    icon: 'mdi:video-outline',
    items: [
      {
        key: 'container',
        label: 'Контейнер',
        icon: 'mdi:package-variant-closed',
        get: () => metadata.value?.format?.container,
      },
      {
        key: 'codec',
        label: 'Кодек',
        icon: 'mdi:video',
        get: () => metadata.value?.format?.codec,
      },
      {
        key: 'duration',
        label: 'Длительность',
        icon: 'mdi:clock-outline',
        get: () =>
          metadata.value?.format?.duration
            ? formattedTime(metadata.value.format.duration, 's', 'h:m:s')
            : null,
      },
      {
        key: 'bitrate',
        label: 'Битрейт',
        icon: 'mdi:speedometer',
        get: () =>
          metadata.value?.format?.bitrate
            ? `${(metadata.value.format.bitrate / 1000).toFixed(0)} kbps`
            : null,
      },
    ],
  },
  {
    title: 'Аудио',
    icon: 'mdi:music',
    items: [
      {
        key: 'sampleRate',
        label: 'Частота дискретизации',
        icon: 'mdi:waveform',
        get: () =>
          metadata.value?.format?.sampleRate
            ? `${metadata.value.format.sampleRate} Hz`
            : null,
      },
      {
        key: 'bitsPerSample',
        label: 'Битность',
        icon: 'tabler:binary',
        get: () =>
          metadata.value?.format?.bitsPerSample
            ? `${metadata.value.format.bitsPerSample} bit`
            : null,
      },
      {
        key: 'channels',
        label: 'Звуковые каналы',
        icon: 'mdi:speaker',
        get: () => metadata.value?.format?.numberOfChannels,
      },
    ],
  },
  {
    title: 'Видео',
    icon: 'mdi:filmstrip',
    items: [
      {
        key: 'hasVideo',
        label: 'Наличие видео',
        icon: 'mdi:check-circle',
        get: () => (metadata.value?.format?.hasVideo ? 'Да' : 'Нет'),
      },
      {
        key: 'videoCodecs',
        label: 'Кодеки видео',
        icon: 'mdi:video-box',
        get: () => {
          const tracks = metadata.value?.format?.trackInfo || []
          const videoTracks = tracks.filter(t => t.type === 2 && t.codecName && t.codecName !== 'MPEG-4/AAC')
          return videoTracks.length ? videoTracks.map(t => t.codecName).join(', ') : null
        },
      },
    ],
  },
  
])

const currentSection = computed(() => sections.value.find(s => s.title === activeTab.value) || sections.value[0])
</script>

<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="DialogOverlay" />
      <DialogContent class="DialogContent">
        <div class="dialog_header">
          <DialogTitle class="DialogTitle">Свойства</DialogTitle>
          <div class="header_actions">
            <Button :aria-label="'Open dir from path - '+ video.path.split(getSep()).slice(0, -1).join(getSep())" v-if="video" @click="async () => await openPath(video!.path.split(getSep()).slice(0, -1).join(getSep()))">
              <IconLocal icon="mdi:folder-outline"/>
            </Button>
            <DialogClose as-child>
              <Button aria-label="Close">
                <IconLocal icon="mdi:close" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div v-if="metadata && video" class="content-wrapper">
          <div class="tabs">
            <Button
              v-for="section in sections"
              style="width: 33px; height: 33px; padding: 6px;"
              :key="section.title"
              @click="activeTab = section.title"
              :variant="activeTab === section.title ? 'default' : 'ghost'"
              :title="section.title"
              class="tabs-el"
            >
              <IconLocal v-if="section.items[0].get()" width="100%" height="100%" :icon="section.icon as any" />
            </Button>
          </div>
          <div class="section">
            <div class="section_header">
              <IconLocal :icon="currentSection.icon as any" class="section_icon" />
              <h3 class="section_title">{{ currentSection.title }}</h3>
            </div>
            <div class="metadata_list">
              <div
                v-for="item in currentSection.items"
                :key="item.key"
                class="metadata_item"
                :class="{ 'description-item': item.key === 'description' }"
              >
                <div class="metadata_label">
                  <IconLocal :icon="item.icon as any" class="metadata_icon" />
                  <div class="metadata_title">{{ item.label }}</div>
                </div>
                <div class="metadata_property" :title="item.get()?.toString() ?? ''">
                  {{ item.get() }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading">
              Идёт загрузка метаданных
            </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.tabs-el:empty {
  display: none;
}
.header_actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dialog_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section_header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section_icon {
  font-size: 18px;
  color: var(--mauve-11);
}
.section_title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  margin-bottom: 4px;
}

.metadata_list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.metadata_item {
  display: flex;
  flex-direction: column;
  padding: 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--secondary);
  backdrop-filter: blur(6px);
  transition: background 0.2s;
}
.metadata_item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.metadata_label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.metadata_icon {
  font-size: 18px;
  color: var(--mauve-12);
}

.metadata_title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mauve-12);
}

.metadata_property {
  font-size: 14px;
  color: var(--mauve-11);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description-item .metadata_property {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-wrap: break-word;
}

.DialogOverlay {
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.DialogContent {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  padding: 20px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  background-color: var(--background-glass);
  border: 1px solid var(--secondary);
  border-radius: 12px;
  opacity: 1;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: calc(100vw - 80px);  
  overflow-y: auto;
}

.content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tabs {
  display: flex;
  flex-direction: column;
}

.section {
  flex: 1;
}

.DialogTitle {
  margin: 0;
  font-weight: 600;
  font-size: 20px;
  color: var(--mauve-12);
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
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

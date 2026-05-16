<script setup lang="ts">
import { ref, computed, watch, onUnmounted, h } from 'vue';
import Select from '../../components/ui/select/select.vue';
import SelectItem from '../../components/ui/select/select-item.vue';
import Input from '../../components/ui/input.vue';
import Button from '../../components/ui/button.vue';
import { VideoMetadata } from '../../types/metadata';
import { isUrl } from '../../utils/text';
import { hideToast, showToast } from '../../store/toast';
import { useRouter } from 'vue-router';
import { useVideoStore } from '../../store/video';
import { open } from '@tauri-apps/plugin-dialog';
import { getSep } from '../../utils/path';
import { openPath } from '../../api/file';
import { Toggle } from 'reka-ui';
import Tooltip from '../../components/ui/tooltip.vue';
import { formattedTime } from '../../utils/time';
import TimeSelect from '../../components/download/TimeSelect.vue';
import { useI18n } from '../../composables/useI18n';
import { useDownloadStore, type Download } from '../../store/donwload';
import { event } from '@tauri-apps/api';
import { downloadVideo } from '../../api/video';
import IconLocal from '../../components/ui/icon-local.vue';

// Props - получаем экземпляр download из родителя
const props = defineProps<{
  download: Download;
}>();

const emit = defineEmits<{
  'poster': [url: string];
}>();

const { t } = useI18n();
const downloadStore = useDownloadStore();
const router = useRouter();

// Локальные переменные компонента (не хранятся в store)
const metadata = ref<VideoMetadata | null>(null);
const confirm = ref(!!props.download.metadata || false);
const maxPartTime = ref('00:00:00');
const showDesc = ref(true);
const showLogs = ref(true);
const isShowOptions = ref(false);

// Computed свойства для UI
const isDownloading = computed(() => props.download.status === 'downloading');
const isCompleted = computed(() => props.download.status === 'completed');
const isFailed = computed(() => props.download.status === 'failed');
const currentProgress = computed(() => props.download.progress);
const currentLog = computed(() => props.download.log);
const settings = computed(() => props.download.settings);

const formatOptions = computed({
  get: () => downloadStore.formatOptionsForSettings(settings.value),
  set: () => {}
});



// Возобновить загрузку
const handleResume = async () => {
  downloadStore.resumeDownload(props.download.id);
  await handleDownload();
};

// Запустить загрузку
const handleDownload = async () => {
  try {
    // Устанавливаем начальный прогресс
    downloadStore.updateProgressById(props.download.id, {
      label: t('downloadInput.sendingRequest'),
      percent: 0,
      speed: '',
      ETA: '',
      total: '',
    });

    // Запускаем загрузку в store
    downloadStore.startDownload(props.download.id);

    // Получаем property объект для API
    const property: Record<string, any> = downloadStore.getDownloadProperty(props.download);

    // Запускаем загрузку через API
    const path = await downloadVideo(props.download.url, property);

    // Завершаем загрузку успешно
    downloadStore.completeDownload(props.download.id, path);

    // Показ уведомление
    showToast(t('downloadInput.videoLoadedToast'), h('div', {
      style: { display: 'flex', gap: '4px' }
    }, [
      h(Button, {
        style: { marginTop: '4px' },
        onClick: async () => {
          await router.replace('/');
          await useVideoStore().setVideo({
            path: path,
            title: path.split(getSep()).pop()!,
          });
          hideToast();
        }
      }, t('downloadInput.watchVideo')),
      h(Button, {
        style: { marginTop: '4px' },
        onClick: async () => {
          await openPath(path.split(getSep()).slice(0, -1).join(getSep()));
        }
      }, t('downloadInput.openFolder'))
    ]));

  } catch (error: any) {
    console.error('Download failed:', error);
    // Отмечаем загрузку как неудачную
    downloadStore.failDownload(props.download.id, error.message || error.toString());
    throw error;
  }
};

// Обновить настройки загрузки по ключу
function updateSetting<K extends keyof typeof settings.value>(key: K, value: (typeof settings.value)[K]) {
  downloadStore.updateDownloadSetting(props.download.id, key, value);
}

// Простая логика обновления типа контента
function updateContentType(target: 'video' | 'audio' | 'poster', newValue: boolean) {
  const { type } = settings.value;
  const otherType = target === 'video' ? 'audio' : 'video';
    

  
  if (target === 'poster') {
    updateSetting('downloadPoster', newValue);

    // Если включаем постер, но контент выключен — активируем оба
    if (!newValue && type === 'none') {
      updateSetting('type', 'all');
    }
    return;
  }
console.log(target, type, newValue);
  // ---- VIDEO / AUDIO ----
  if (newValue) {
    // ✅ Включаем target
    switch (type) {
      case 'none':
        console.log(1);
        
        // ничего не было → включаем выбранный
        updateSetting('type', target);
        break;
      case 'video':
      case 'audio':
        // включаем другой → оба активны
        if (type !== target) updateSetting('type', 'all');
        break;
      case 'all':
        // оба уже активны — ничего не делаем
        break;
    }
  } else {
    // ❌ Выключаем target
    switch (type) {
      case 'all':
        // было оба → оставляем только другой
        updateSetting('type', otherType);
        break;
      case target:
        // выключили последний → отключаем всё
        updateSetting('type', 'none');
        updateSetting('downloadPoster', true);
        break;
    }
  }
}

// Обработчики выбора папок
const handlePath = async () => {
  const file = await open({ directory: true });
  if (file && typeof file === 'string') {
    updateSetting('outputPath', file);
  }
};

const handlePosterPath = async () => {
  const file = await open({ directory: true });
  if (file && typeof file === 'string') {
    updateSetting('postersPath', file);
  }
};

// Загрузка мета-данных при изменении URL
watch(() => props.download?.url, async (urlValue) => {
  if (isUrl(urlValue)) {
    confirm.value = false;

    try {
      confirm.value = true;
      const fetchedMetadata = await downloadStore.loadMetadataForDownload(props.download.id, urlValue);
      metadata.value = fetchedMetadata;

      // Устанавливаем полный диапазон для видео
      const duration = formattedTime(fetchedMetadata.duration, 's', 'hh:mm:ss');
      maxPartTime.value = duration;
      updateSetting('partTime', `00:00:00-${duration}`);

      if (fetchedMetadata.thumbnail) {
        emit('poster', fetchedMetadata.thumbnail);
      }

    } catch (error) {
      console.error('Error loading metadata:', error);
      showToast(t('downloadInput.invalidLink'));
      confirm.value = false;
      metadata.value = null;
    }
  } else {
    confirm.value = false;
    metadata.value = null;
  }
});


// Логика плейлиста - обновляет title при переключении
watch(() => settings.value.isPlaylist, (isPlaylist) => {
  if (metadata.value) {
    if (isPlaylist) {
      props.download.title = `/%(playlist_index)s - %(title)s.${settings.value.ext}`;
    } else {
      props.download.title = metadata.value.title;
    }
    downloadStore.saveToStorage();
  }
});

// Синхронизация с метаданными
watch(metadata, (newMetadata) => {
  if (newMetadata && settings.value.isPlaylist) {
    props.download.title = `/%(playlist_index)s - %(title)s.${settings.value.ext}`;
    downloadStore.saveToStorage();
  }
});

// Watch для автоматической установки poster path
watch(() => settings.value.downloadPoster, (downloadPosterEnabled) => {
  if (downloadPosterEnabled && settings.value.postersPath.length === 0) {
    updateSetting('postersPath', settings.value.outputPath);
  }
});

// Watch для валидации расширения при изменении типа
watch(() => settings.value.type, () => {
  const availableExts = formatOptions.value.map((opt) => opt.value);
  if (!availableExts.includes(settings.value.ext)) {
    const defaultExt = availableExts[0] || 'mp4';
    updateSetting('ext', defaultExt as typeof settings.value.ext);
  }
});

onUnmounted(() => {
  event.emit('download-close');
});
</script>

<template>
  <div class="download-wrapper">
    <!-- Metadata display -->
    <div v-if="metadata" class="download-metadata">
      <div v-if="showDesc" class="metadata-container">
        <div class="thumbnail-wrapper">
          <img :src="metadata.thumbnail" class="thumbnail" />
        </div>
        <div class="metadata-info">
          <div class="metadata-title">{{ metadata.title }}</div>
          <div class="metadata-author">
            <div class="metadata-author-info" @click="openPath(metadata.channel_url)">
              <div v-if="metadata.channel" class="channel-image-container">
                <img class="channel-image" :src="metadata.thumbnail" />
              </div>
              <div v-if="metadata.channel" class="channel-title">
                {{ metadata.channel }}{{ metadata.categories?.[0] }}
              </div>
            </div>
            <div class="metadata-likes">
              <div>{{ metadata.like_count }}</div>
              <IconLocal width="24px" height="24px" icon="material-symbols:favorite-outline-rounded" />
            </div>
          </div>
          <div class="metadata-description">{{ metadata.description }}</div>
          <div class="metadata-tags">
            <div v-for="tag in metadata.tags" class="metadata-tag">{{ tag }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main controls -->
    <div class="download-controls">
      <Select v-if="settings.type === 'all' || settings.type === 'video'" class="select-root" :model-value="settings.quality" @update:model-value="(val) => updateSetting('quality', val as any)">
        <SelectItem value="1080p">1080p</SelectItem>
        <SelectItem value="720p">720p</SelectItem>
        <SelectItem value="480p">480p</SelectItem>
        <SelectItem value="240p">240p</SelectItem>
        <SelectItem value="144p">144p</SelectItem>
      </Select>

      <Input v-model="props.download.url" type="text" class="input_url" :placeholder="t('downloadInput.pasteVideoLink')" />

      <div class="optional-settings">
        <Button variant="rounded" :active="isShowOptions" @click="isShowOptions = !isShowOptions">
          <IconLocal icon="uil:setting" />
        </Button>
      </div>
    </div>

    <!-- Options panel -->
    <Transition name="show">
      <div v-if="isShowOptions" class="options">
        <!-- Title and Extension -->
        <div class="output_file">
          <Input v-model="props.download.title" type="text" :placeholder="settings.isPlaylist ? t('downloadInput.playlistTemplate') : settings.downloadPoster && settings.type === 'none' ? t('downloadInput.enterPosterName') : t('downloadInput.enterVideoTitle')" />
          <Select v-if="settings.type !== 'none'" class="output-file-ext" :model-value="settings.ext" @update:model-value="(val) => updateSetting('ext', val as any)">
            <SelectItem v-for="opt in formatOptions" :value="opt.value" :key="opt.value">{{ opt.text }}</SelectItem>
          </Select>
        </div>

        <!-- Output path -->
        <div class="output_file">
          <div class="left-corner">
            <IconLocal icon="material-symbols:download-rounded" />
          </div>
          <Input v-model="settings.outputPath" type="text" :placeholder="t('downloadInput.enterPath')" />
          <Button class="output-file-dir" @click="handlePath">
            <IconLocal icon="material-symbols:folder-open-rounded" />
          </Button>
        </div>

        <!-- Poster path (if enabled) -->
        <div v-if="settings.downloadPoster" class="output_file poster">
          <div class="left-corner">
            <IconLocal icon="material-symbols:image-outline" />
          </div>
          <Input v-model="settings.postersPath" type="text" :placeholder="t('downloadInput.enterPath')" />
          <Button class="output-file-dir" @click="handlePosterPath">
            <IconLocal icon="material-symbols:folder-open-rounded" />
          </Button>
        </div>

        <!-- Time selection (if enabled) -->
        <div v-if="settings.downloadPart" class="output_file part">
          <div class="left-corner">
            <IconLocal icon="mingcute:time-line" />
          </div>
          <TimeSelect :max-time="maxPartTime" :time="settings.partTime" @on-change="(val) => updateSetting('partTime', val)" />
        </div>

        <!-- Toggle controls -->
        <div class="checkboxs">
          <Tooltip :content="t('downloadInput.showDescription')">
            <Toggle v-model="showDesc" aria-label="Toggle description" class="Toggle" >
              <IconLocal icon="material-symbols:description-rounded" />
            </Toggle>
            
          </Tooltip>

          <Tooltip :content="t('downloadInput.showLogs')">
            <Toggle v-model="showLogs" aria-label="Toggle logs" class="Toggle" >
              <IconLocal icon="material-symbols:code-rounded" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadPart')">
            <Toggle v-model="settings.downloadPart" ari el="Toggle part" class="Toggle" >
              <IconLocal icon="material-symbols:radio-button-partial-outline" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.embedSubtitles')">
            <Toggle v-model="settings.embedSubs" aria-label="Toggle subs" class="Toggle" >
              <IconLocal icon="material-symbols:comment-rounded" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadPlaylist')">
            <Toggle v-model="settings.isPlaylist" aria-label="Toggle playlist" class="Toggle" >
              <IconLocal icon="majesticons:playlist" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadMetadata')">
            <Toggle v-model="settings.hasMetadata" aria-label="Toggle metadata" class="Toggle"  >
              <IconLocal icon="gg:data" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadVideo')">
            <Toggle :model-value="settings.type === 'video' || settings.type === 'all'" @update:model-value="(val) => updateContentType('video', val)" aria-label="Toggle video" class="Toggle" >
              <IconLocal icon="mynaui:video-solid" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadAudio')">
            <Toggle :model-value="settings.type === 'audio' || settings.type === 'all'" @update:model-value="(val) => updateContentType('audio', val)" aria-label="Toggle audio" class="Toggle" >
              <IconLocal icon="gridicons:audio" />
            </Toggle>
          </Tooltip>

          <Tooltip :content="t('downloadInput.downloadPoster')">
            <Toggle v-model="settings.downloadPoster" @update:model-value="(val) => updateContentType('poster', val)" aria-label="Toggle poster" class="Toggle" >
                <IconLocal icon="material-symbols:image-outline" />
              </Toggle>
          </Tooltip>
          <Tooltip :content="t('downloadInput.downloadContinue')">
            <Toggle v-model="settings.isContinue"  aria-label="Toggle continue download" class="Toggle" >
                <IconLocal icon="material-symbols:autoplay-rounded" />
              </Toggle>
          </Tooltip>
        </div>
      </div>
    </Transition>

    <!-- Progress and Download button -->
    <div class="progress-bar">
      <div v-if="isDownloading" class="progress-fill" :style="{ width: currentProgress.percent + '%' }"></div>
      <div v-if="isDownloading || props.download.status === 'paused'" class="progress-info">
        <div class="progress-info-item">{{ currentProgress.percent.toFixed(1) }}%</div>
        <div :class="{'progress-info-item': true, 'label-container': true, 'progress-paused': props.download.status === 'paused'}">
          <div class="label">
            {{ currentProgress.label }}
          </div>
          <div class="label-actions">
            <Button v-if="isDownloading" @click="downloadStore.stopDownload(props.download.id)">
              <IconLocal width="12px" icon="material-symbols:stop"/>
            </Button>
            <Button v-if="props.download.status === 'paused'" @click="handleResume">
              <IconLocal width="12px" icon="material-symbols:play-arrow"/>
            </Button>
            <Button @click="downloadStore.resetDownload(props.download.id)">
              <IconLocal width="12px" icon="mdi:reload"/>
            </Button>
            <Button @click="downloadStore.newDownlaodById(props.download.id)">
              <IconLocal width="12px" icon="material-symbols:add-rounded"/>
            </Button>
          </div>
        </div>
        <div class="progress-info-item progress-total">
          <span class="progress-eta">
            {{ currentProgress.ETA }}
          </span>
          <span class="progress-speed">
            {{ currentProgress.speed }}
          </span>
        </div>
      </div>
      <Button v-if="(!isDownloading && !isCompleted && !isFailed) && !(props.download.status === 'paused')" :disable="!confirm" class="btn" @click="handleDownload">
        {{ t('downloadInput.download') }}
      </Button>
      <div v-if="isCompleted" class="completed-wrapper">
        <div class="completed">
          <IconLocal icon="material-symbols:check-circle-rounded" />
          {{ t('download.completed') }}
        </div>
        <div class="completed-icon">
          <Button variant="rounded" size="sm" @click="downloadStore.resetDownload(props.download.id)">
            <IconLocal width="12px" icon="mdi:reload"/>
          </Button>
          <Button variant="rounded" size="sm" @click="downloadStore.newDownlaodById(props.download.id)">
            <IconLocal width="12px" icon="material-symbols:add-rounded"/>
          </Button>
        </div>
      </div>
      <div v-if="isFailed" class="failed">
        <IconLocal icon="material-symbols:error-rounded" />
        {{ t('download.failed') }}
      </div>
    </div>

    <!-- Logs -->
    <div v-if="currentLog && showLogs" class="progress-wrapper">
      <pre class="log">{{ currentLog }}</pre>
    </div>
  </div>
</template>

<style scoped>

.progress-info-item.progress-total .progress-eta {
  display: block;
}

.progress-info-item.progress-total .progress-speed {
  display: none;
}

.progress-info-item.progress-total:hover .progress-eta {
    display: none;
}

.progress-info-item.progress-total:hover .progress-speed {
    display: block;
}

.progress-info-item.label-container.progress-paused > .label-actions {
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.progress-info-item.label-container.progress-paused > .label {
  opacity: 0;
}
.label-actions {
  display: none;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.progress-info-item.label-container {
  position: relative;
}

.progress-info-item.label-container:hover > .label-actions {
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.progress-info-item.label-container:hover > .label {
  opacity: 0;
}

.progress-wrapper {
  margin-top: 4px;
}

.completed-icon {
  display: flex;
  gap: 3px;
}

.progress-bar:has(.completed-wrapper) {
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px);
}

.completed-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;

}
.download-wrapper {
  display: flex;
  flex-direction: column;
  color: var(--foreground);
}

.download-metadata {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--background-glass);
  backdrop-filter: blur(10px);
  margin-bottom: 4px;
}

.metadata-container {
  overflow: hidden auto;
  max-height: 240px;
  padding: 4px;
}

.thumbnail {
  height: 100%;
  width: 100%;
  border-radius: 8px;
}

.checkboxs > button:first-child {
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
}

.checkboxs > button:last-child {
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
}


.metadata-title {
  text-align: center;
  padding: 4px 0;
  font-weight: 700;
}

.metadata-author {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metadata-author-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  margin-top: 4px;
  cursor: pointer;
}

.channel-image {
  aspect-ratio: 1 / 1;
  height: 32px;
  width: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.channel-image-container {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.channel-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--foreground);
  text-decoration: none;
}

.metadata-likes {
  display: flex;
  gap: 4px;
}

.metadata-likes > div {
  transform: translateY(1px);
}

.metadata-description {
  font-size: 13px;
}

.metadata-tags {
  display: flex;
  gap: 4px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.metadata-tag {
  padding: 4px 6px;
  white-space: nowrap;
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  width: min-content;
  font-size: 12px;
}

.download-controls {
  transition: all 0.2s ease-in-out;
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: var(--background-glass);
  border-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  backdrop-filter: blur(10px);
}

.btn {
  padding: 8px 16px;
  background: var(--primary);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-root {
  border-top-right-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border: 1px solid transparent !important;
}

.input_url {
  flex: 1;
  padding: 12px 12px 8px;
  background: var(--secondary-glass);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--foreground);
  border-left: 0;
  height: 22px;
  border-top-left-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  padding-right: 0px;
}

.optional-settings {
  position: absolute;
  top: 0;
  right: 2px;
  display: flex;
  height: calc(100% - 8px);
  justify-content: center;
  align-items: center;
  padding: 4px;
}

.progress-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: var(--background-glass);
  overflow: hidden;
  border-radius: 8px;
    border-top-left-radius: 0px !important;
  border-top-right-radius: 0px !important;
  height: 30px;

}
.progress-bar > button {
  border-top-left-radius: 0px !important;
  border-top-right-radius: 0px !important;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background-color: rgb(80, 180, 80);
  transition: width 0.3s, background-color 0.3s;
}

.progress-info {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  height: 100%;
  width: calc(100% - 8px);
  left: 4px;
}

:deep(.select-root)  {
  border-top-right-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border: 1px solid transparent !important;
}

.progress-info-item {
  padding: 2px 4px;
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px);
  border-radius: 6px;
}

.progress-wrapper {
  background: var(--secondary-glass);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.log {
  padding: 8px;
  font-size: 12px;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  margin: 0;
  overflow: auto;
}

.options {
  display: flex;
  flex-direction: column;
  padding: 2px 0;
  gap: 2px;
  background: var(--background-glass);
  overflow: hidden;
}

.output_file {
  display: flex;
  width: 100%;
  min-height: 35px;
}

.output_file input {
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
}

.output_file :deep(button) {
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  border-radius: 0px;
  border: none;
}

.output_file :deep(input) {
  border-radius: 0px;
}

.left-corner {
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--secondary-glass);
  backdrop-filter: blur(10px);
}

.output_file.part .left-corner {
  width: 33px;
}

.output-file-dir {
  width: min-content !important;
  aspect-ratio: 1 / 1;
  width: 35px !important;
  border-radius: 0 !important;
}

.checkboxs {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.Toggle {
  background-color: var(--secondary-glass);
  height: 35px;
  width: 35px;
  border-radius: 4px;
  display: flex;
  font-size: 15px;
  line-height: 1;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}

.Toggle > svg {
  padding: 8px;
}

.Toggle:hover {
  backdrop-filter: blur(10px);
}

.Toggle[aria-pressed='true'] {
  background-color: var(--primary) !important;
}

.completed, .failed {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--foreground);
}

.completed {
  color: rgb(80, 180, 80);
}

.failed {
  color: rgb(180, 80, 80);
}

.show-enter-active,
.show-leave-active {
  transition: max-height 0.4s ease, opacity 0.3s ease;
  overflow: hidden;
}

.show-enter-from,
.show-leave-to {
  max-height: 0;
  opacity: 0;
}

.show-enter-to,
.show-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>

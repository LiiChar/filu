<script setup lang="ts">
import { useSettingStore } from '../store/setting';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import Select from '../components/ui/select/select.vue';
import SelectItem from '../components/ui/select/select-item.vue';
import Input from '../components/ui/input.vue';
import Button from '../components/ui/button.vue';
import Toggle from '../components/ui/toggle.vue';
import { onMounted } from 'vue';
import { useI18n } from '../composables/useI18n';
import DownloadDropdown from '../widget/download/download-dropdown.vue';
import IconLocal from '../components/ui/icon-local.vue';

const { t } = useI18n();

const store = useSettingStore();
const {
  background, 'background-speed': backgroundSpeed, 'background-animation-enabled': backgroundAnimationEnabled,
  theme, lang, width, "video-resize": videoResize, height, 'video-fit': videoFit,
  'font-size': fontSize, 'interface-scale': interfaceScale, 'accent-color': accentColor,
  'window-transparency': windowTransparency, 'default-fullscreen': defaultFullscreen, 'minimize-to-tray': minimizeToTray,
  'default-volume': defaultVolume, 'default-speed': defaultSpeed, 'auto-play-default': autoPlayDefault, 'loop-default': loopDefault, 'skip-time': skipTime, 'animate-background': animateBackground,
  'buffer-size': bufferSize, 'default-quality': defaultQuality, 'show-subtitles': showSubtitles, 'hotkeys-enabled': hotkeysEnabled, 'audio-visualizer': audioVisualizer,
  ffmpeg, "yt-dlp": ytDlp, cookies, ffprobe,'download-path': downloadPath
} = storeToRefs(store);


const activeTab = ref('appearance'); 

const tabs = [
  { id: 'appearance', icon: 'material-symbols:palette' },
  { id: 'window', icon: 'material-symbols:web' },
  { id: 'player', icon: 'material-symbols:play-circle' },
  { id: 'download', icon: 'material-symbols:download' }
];

const handleSave = () => {
  localStorage.setItem('app-settings', JSON.stringify(store.$state));
};

const handleReset = () => {
  store.resetSettings();
  localStorage.removeItem('app-settings');
};

// Применение настроек в реальном времени
watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  updateThemeColors(newTheme);
});

watch(interfaceScale, (scale) => {
  document.documentElement.style.setProperty('--interface-scale', scale.toString());
  applyScale(scale);
});

watch(accentColor, (color) => {
  document.documentElement.style.setProperty(
				'--primary',
				color
			);
});

watch(fontSize, (size) => {
  const sizeMap = {
    small: '12px',
    medium: '14px',
    large: '16px'
  };
  document.documentElement.style.setProperty('--base-font-size', sizeMap[size]);
});

const updateThemeColors = (theme: string) => {
  if (theme === 'dark') {
    document.documentElement.style.setProperty('--background', '#0f0f0f');
    document.documentElement.style.setProperty('--foreground', '#ffffff');
    document.documentElement.style.setProperty('--secondary', '#1a1a1a');
    document.documentElement.style.setProperty('--border', '#333333');
  } else {
    document.documentElement.style.setProperty('--background', '#ffffff');
    document.documentElement.style.setProperty('--foreground', '#000000');
    document.documentElement.style.setProperty('--secondary', '#f5f5f5');
    document.documentElement.style.setProperty('--border', '#cccccc');
  }
};

const applyScale = (scale: number) => {
  const root = document.documentElement;
  root.style.transform = `scale(${scale})`;
  root.style.transformOrigin = 'top center';
  root.style.width = `${100 / scale}%`;
};

onMounted(() => {
  document.documentElement.setAttribute('data-theme', store.theme);
  updateThemeColors(store.theme);
  applyScale(interfaceScale.value);
});
</script>

<template>
  <DownloadDropdown class="settings-download"/>
  <div class="settings-layout">
    <div class="sidebar">
      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ 'tab-button': true, 'active': activeTab === tab.id }"
        >
          <IconLocal :icon="tab.icon as any" />
        </button>
      </nav>
    </div>
    <div class="main-content">
      <div class="content-wrapper">
        <div v-if="activeTab === 'appearance'" class="tab-content">
          <h1 class="content-title">
            <IconLocal icon="material-symbols:palette" />
            {{ t('appearance.title') }}
          </h1>
          <div class="settings-grid">
            <div class="setting-item">
            <label class="setting-label">{{ t('appearance.theme') }}</label>
              <Select class="select-root" :model-value="theme" @update:model-value="(v) => store.updateSetting('theme', v as any)">
                <SelectItem value="light">{{ t('appearance.light') }}</SelectItem>
                <SelectItem value="dark">{{ t('appearance.dark') }}</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.backgroundsTitle') }}</label>
              <Select class="select-root" :model-value="background" @update:model-value="(v) => store.updateSetting('background', v as any)">
                <SelectItem value="dither">{{ t('appearance.backgrounds.dither') }}</SelectItem>
                <SelectItem value="dotGrid">{{ t('appearance.backgrounds.dotGrid') }}</SelectItem>
                <SelectItem value="faultyTerminal">{{ t('appearance.backgrounds.faultyTerminal') }}</SelectItem>
                <SelectItem value="particles">{{ t('appearance.backgrounds.particles') }}</SelectItem>
                <SelectItem value="pixelBlast">{{ t('appearance.backgrounds.pixelBlast') }}</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.backgroundSpeed') }} ({{ backgroundSpeed }})</label>
              <input v-model="backgroundSpeed" type="range" min="0.01" max="1" step="0.01" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.animateBackground') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="backgroundAnimationEnabled"
                  @update:model-value="(v) => store.updateSetting('background-animation-enabled', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.language') }}</label>
              <Select class="select-root" :model-value="lang" @update:model-value="(v) => store.updateSetting('lang', v as any)">
                <SelectItem value="ru">{{ t('appearance.russian') }}</SelectItem>
                <SelectItem value="en">{{ t('appearance.english') }}</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.fontSize') }}</label>
              <Select class="select-root" :model-value="fontSize" @update:model-value="(v) => store.updateSetting('font-size', v as any)">
                <SelectItem value="small">{{ t('appearance.small') }}</SelectItem>
                <SelectItem value="medium">{{ t('appearance.medium') }}</SelectItem>
                <SelectItem value="large">{{ t('appearance.large') }}</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.interfaceScale') }} ({{ interfaceScale }}x)</label>
              <input v-model="interfaceScale" type="range" min="0.8" max="1.5" step="0.1" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.accentColor') }}</label>
              <div class="color-picker">
                <input v-model="accentColor" type="color" class="color-input" />
                <span class="color-value">{{ accentColor }}</span>
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('appearance.videoScaling') }}</label>
              <Select class="select-root" :model-value="videoFit" @update:model-value="(v) => store.updateSetting('video-fit', v as any)">
                <SelectItem value="cover">{{ t('appearance.cover') }}</SelectItem>
                <SelectItem value="contain">{{ t('appearance.contain') }}</SelectItem>
              </Select>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'window'" class="tab-content">
          <h1 class="content-title">
            <IconLocal icon="material-symbols:web" />
            {{ t('window.title') }}
          </h1>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">{{ t('window.windowWidth') }}</label>
              <Input v-model="width" type="number" class="input" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('window.windowHeight') }}</label>
              <Input v-model="height" type="number" class="input" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('window.windowTransparency') }} ({{ Math.round(windowTransparency * 100) }}%)</label>
              <input v-model="windowTransparency" type="range" min="0.3" max="1" step="0.1" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('window.autoResize') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="videoResize"
                  @update:model-value="(v) => store.updateSetting('video-resize', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('window.fullscreenDefault') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="defaultFullscreen"
                  @update:model-value="(v) => store.updateSetting('default-fullscreen', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('window.minimizeToTray') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="minimizeToTray"
                  @update:model-value="(v) => store.updateSetting('minimize-to-tray', v as any)"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'player'" class="tab-content">
          <h1 class="content-title">
            <IconLocal icon="material-symbols:play-circle" />
            {{ t('mediaPlayer.title') }}
          </h1>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.defaultVolume') }} ({{ defaultVolume }}%)</label>
              <input v-model="defaultVolume" type="range" min="0" max="100" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.defaultSpeed') }} ({{ defaultSpeed }}x)</label>
              <input v-model="defaultSpeed" type="range" min="0.25" max="3" step="0.25" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.bufferSize') }} ({{ bufferSize }} сек)</label>
              <input v-model="bufferSize" type="range" min="5" max="30" step="1" class="slider" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.defaultQuality') }}</label>
              <Select class="select-root" :model-value="defaultQuality" @update:model-value="(v) => store.updateSetting('default-quality', v as any)">
                <SelectItem value="144p">144p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.audioVisualizer') }}</label>
              <Select class="select-root" :model-value="audioVisualizer" @update:model-value="(v) => store.updateSetting('audio-visualizer', v as any)">
                <SelectItem value="bars">{{ t('mediaPlayer.bars') }}</SelectItem>
                <SelectItem value="wave">{{ t('mediaPlayer.wave') }}</SelectItem>
                <SelectItem value="none">{{ t('mediaPlayer.none') }}</SelectItem>
              </Select>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.skipTime') }}</label>
              <Input v-model="skipTime" type="number" class="input" />
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.autoplay') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="autoPlayDefault"
                  @update:model-value="(v) => store.updateSetting('auto-play-default', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.loop') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="loopDefault"
                  @update:model-value="(v) => store.updateSetting('loop-default', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.animatedBackground') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="animateBackground"
                  @update:model-value="(v) => store.updateSetting('animate-background', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.showSubtitles') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="showSubtitles"
                  @update:model-value="(v) => store.updateSetting('show-subtitles', v as any)"
                />
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">{{ t('mediaPlayer.hotkeys') }}</label>
              <div class="checkbox-item">
                <Toggle
                  :model-value="hotkeysEnabled"
                  @update:model-value="(v) => store.updateSetting('hotkeys-enabled', v as any)"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'download'" class="tab-content">
          <h1 class="content-title">
            <IconLocal icon="material-symbols:download" />
            {{ t('download.title') }}
          </h1>
          <div class="settings-list">
            <div class="setting-item full-width">
              <label class="setting-label">{{ t('download.downloadPath') }}</label>
              <Input v-model="downloadPath" class="input" :placeholder="t('download.downloadPathPlaceholder')" />
            </div>
            <div class="setting-item full-width">
              <label class="setting-label">{{ t('download.ffmpegPath') }}</label>
              <Input v-model="ffmpeg" class="input" :placeholder="t('download.ffmpegPathPlaceholder')" />
            </div>
            <div class="setting-item full-width">
              <label class="setting-label">{{ t('download.ffprobePath') }}</label>
              <Input v-model="ffprobe" class="input" :placeholder="t('download.ffprobePathPlaceholder')" />
            </div>
            <div class="setting-item full-width">
              <label class="setting-label">{{ t('download.ytdlpPath') }}</label>
              <Input v-model="ytDlp" class="input" :placeholder="t('download.ytdlpPathPlaceholder')" />
            </div>
            <div class="setting-item full-width">
              <label class="setting-label">{{ t('download.cookiesPath') }}</label>
              <Input v-model="cookies" class="input" :placeholder="t('download.cookiesPathPlaceholder')" />
            </div>
          </div>
        </div>
        <div class="actions">
          <Button @click="handleSave" class="action-button">
            <IconLocal icon="material-symbols:save" />
            {{ t('settings.save') }}
          </Button>
          <Button @click="handleReset" class="action-button">
            <IconLocal icon="material-symbols:restart-alt" />
            {{ t('settings.reset') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
body:has(.settings-layout) .download-trigger {
  bottom: 25px !important;
  left: 10px !important;
}
</style>

<style scoped>

/* Layout */
.settings-layout {
  display: flex;
  height: 100vh;
  color: var(--foreground);
}

/* Sidebar */
.sidebar {
  padding: 0 8px;
  background: var(--background-glass);
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 16px 12px 12px;
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  justify-content: center;
}

.sidebar-title {
  font-size: 10px;
  font-weight: 600;
  margin: 0;
  color: var(--foreground);
  text-align: center;
  opacity: 0.7;
}

.tabs {
  padding: 48px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 33px;
  height: 33px;
  background: var(--secondary-glass);
  border: none;
  border-radius: 12px;
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.tab-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  opacity: 0;
  border-radius: 12px;
  transition: opacity 0.3s ease;
}

.tab-button:hover:before {
  opacity: 0.3;
}

.tab-button.active:before {
  opacity: 1;
}

.tab-button svg {
  width: 23px;
  height: 23px;
  flex-shrink: 0;
  z-index: 1;
  position: relative;
}

.tab-button.active svg {
  color: white;
}

/* Main Content */
.main-content {
  width: 100%;
  height: 100%;
  flex: 1;
  overflow-y: auto;
  background: var(--background-glass);
  backdrop-filter: blur(10px);
}

.content-wrapper {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--foreground);
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-glass);
}

.setting-item:has(> .checkbox-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
}

.setting-item:has(> .input) {
  width: 100%;
  overflow: hidden;
}

.setting-item .input {
  width: 100%;
  display: block;
  max-width: 100%;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 48px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item.full-width {
  grid-column: 1 / -1;
}

.setting-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 8px;
}

/* Input Elements */
.input {
  padding: 14px 16px;
  background: var(--background-glass);
  border: 2px solid var(--border-glass);
  border-radius: 8px;
  color: var(--foreground);
  font-size: 15px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.input {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary, #007bff33);
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: var(--secondary-glass);
  outline: none;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}



/* Color Picker */
.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.color-value {
  font-size: 14px;
  color: var(--foreground);
  opacity: 0.8;
  font-family: monospace;
}

/* Select Styles */
:deep(.select-root) {
  border-radius: 8px;
  border: 2px solid var(--border-glass);
  background: var(--background-glass);
  color: var(--foreground);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  padding: 14px 16px;
}

:deep(.select-root:focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary, #007bff33);
}

/* Actions */
.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 32px;
  border-top: 1px solid var(--border-glass);
  margin-top: 32px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-button svg {
  width: 20px;
  height: 20px;
}



</style>

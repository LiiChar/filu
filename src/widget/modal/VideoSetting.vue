<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { Setting, useVideoStore } from '../../store/video'
import { storeToRefs } from 'pinia'
import Button from '../../components/ui/button.vue'
import Toggle from '../../components/ui/toggle.vue'


type SettingElement = {
  label: string
  default: number
  name: keyof Omit<Setting, 'mirror'>
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

const video = useVideoStore()

const {settings} = storeToRefs(video)

const settingElements: SettingElement[] = [
  { label: 'Размытие', default: 0, name: 'blur', min: 0, max: 100, onChange: v => settings.value.blur = v },
  { label: 'Яркость', default: 100, name: 'brightness', min: 0, max: 200, onChange: v => settings.value.brightness = v },
  { label: 'Контраст', default: 100, name: 'contrast', min: 0, max: 200, onChange: v => settings.value.contrast = v },
  { label: 'Черно-белое', default: 0, name: 'grayscale', min: 0, max: 100, onChange: v => settings.value.grayscale = v },
  { label: 'Оттенок', default: 0, name: 'hue-rotate', min: -360, max: 360, onChange: v => settings.value['hue-rotate'] = v },
  { label: 'Инвертировать', default: 0, name: 'invert', min: 0, max: 100, onChange: v => settings.value.invert = v },
  { label: 'Прозрачность', default: 100, name: 'opacity', min: 0, max: 100, onChange: v => settings.value.opacity = v },
  { label: 'Насыщенность', default: 100, name: 'saturate', min: 0, max: 200, onChange: v => settings.value.saturate = v },
  { label: 'Сепия', default: 0, name: 'sepia', min: 0, max: 100, onChange: v => settings.value.sepia = v },
]
</script>

<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="DialogOverlay" />
      <DialogContent class="DialogContent">
        <DialogTitle class="DialogTitle">
          Улучшение видео
        </DialogTitle>

        <div v-for="el in settingElements" :key="el.name" class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span>{{ el.label }}</span>
          </div>

          <SliderRoot
            :model-value="[settings[el.name]]"
            @update:model-value="val => { settings[el.name] = val![0]; el.onChange(val![0]) }"
            class="SliderRoot"
            :max="el.max ?? 100"
            :min="el.min ?? 0"
            :step="el.step ?? 1"
          >
            <SliderTrack class="SliderTrack">
              <SliderRange class="SliderRange" />
            </SliderTrack>
            <SliderThumb class="SliderThumb" aria-label="Value" >
              <div class="SliderValue">
                {{ settings[el.name] }}
              </div>
            </SliderThumb>
          </SliderRoot>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span>Отзеркаливание</span>
            <Toggle v-model="settings.mirror" />
          </div>
        </div>

        <Button @click="video.resetSettings()">
          Сбросить
        </Button>
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
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.DialogContent {
  position: fixed;
  bottom: 20px;
  z-index: 100;
  right: 20px;
  padding: 12px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
    background-color: var(--background-glass);
    border: 1px solid var(--secondary);
    border-radius: 6px;
    opacity: 1;
    transition: all 0.2s ease-in-out;
    display: flex;
    gap: 4px;
    flex-direction: column;
    backdrop-filter: blur(10px);
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

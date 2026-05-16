<script setup lang="ts">
import { ref } from 'vue'
import {
  TimeFieldInput,
  TimeFieldRoot,
  SliderRoot,
  SliderTrack,
  SliderRange,
  SliderThumb
} from 'reka-ui'
import { parseTime, Time } from '@internationalized/date'

const props = defineProps<{
  time: string
  maxTime: string
}>()

const emit = defineEmits<{
  (e: 'onChange', value: string): void
}>()

const timeToSeconds = (time: string) => {
  const t = parseTime(time)
  return t.hour * 3600 + t.minute * 60 + t.second
}

const secondsToTime = (sec: number): Time => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return parseTime(
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  )
}

const formatTime = (t: Time) => {
  return `${t.hour.toString().padStart(2, '0')}:${t.minute
    .toString()
    .padStart(2, '0')}:${t.second.toString().padStart(2, '0')}`
}

const [startRaw, endRaw] = props.time.split('-')
const startTime = ref(startRaw.trim())
const endTime = ref(endRaw.trim())
const maxTime = ref(props.maxTime.trim())

const maxSeconds = timeToSeconds(maxTime.value)
const range = ref<number[]>([
  timeToSeconds(startRaw),
  Math.min(timeToSeconds(endRaw), maxSeconds)
])

const handleStartTime = (v: Time) => {
  if (timeToSeconds(formatTime(v)) >= maxSeconds) {
    startTime.value = startTime.value;
  } else {
    startTime.value = formatTime(v);
  }

  range.value = [timeToSeconds(startTime.value), range.value[1]]
  emit('onChange', `${startTime.value}-${endTime.value}`)
}

const handleEndTime = (v: Time) => {
  if (timeToSeconds(formatTime(v)) >= maxSeconds) {
    endTime.value = maxTime.value;
  } else {
    endTime.value = formatTime(v);
  }
  range.value = [range.value[0], timeToSeconds(endTime.value)]
  emit('onChange', `${startTime.value}-${endTime.value}`)
}

const handleRange = (r: number[] | undefined) => {
  if (!r) return;
  const [start, end] = r
  const clamped = [Math.min(start, maxSeconds), Math.min(end, maxSeconds)]
  range.value = clamped

  const newStart = formatTime(secondsToTime(clamped[0]))
  const newEnd = formatTime(secondsToTime(clamped[1]))

  if (newStart !== startTime.value) startTime.value = newStart
  if (newEnd !== endTime.value) endTime.value = newEnd

  emit('onChange', `${newStart}-${newEnd}`)
}

</script>

<template>
  <div class="time-select-container">
    <!-- Поля времени -->
    <div class="time-fields">
      <TimeFieldRoot
        v-slot="{ segments }"
        :model-value="(parseTime(startTime) as any)"
        class="TimeField"
        granularity="second"
        :hour-cycle="24"
        @update:model-value="v => handleStartTime(v as any)"
      >
        <template v-for="item in segments" :key="item.part">
          <TimeFieldInput
            :part="item.part"
            :class="item.part === 'literal' ? 'TimeFieldLiteral' : 'TimeFieldSegment'"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>

      <div>-</div>

      <TimeFieldRoot
        v-slot="{ segments }"
        :model-value="(parseTime(endTime) as any)"
        class="TimeField"
        :hour-cycle="24"
        granularity="second"
        :max-value="(parseTime(maxTime) as any)"
        @update:model-value="v => handleEndTime(v as any)"
      >
        <template v-for="item in segments" :key="item.part">
          <TimeFieldInput
            :part="item.part"
            :class="item.part === 'literal' ? 'TimeFieldLiteral' : 'TimeFieldSegment'"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </div>

    <!-- Слайдер -->
    <div class="slider-wrapper">
      <SliderRoot
        :model-value="range"
        :min="0"
        :max="maxSeconds"
        :step="1"
        class="time-slider"
        @update:model-value="handleRange"
      >
        <SliderTrack class="slider-track">
          <SliderRange class="slider-range" />
        </SliderTrack>
        <SliderThumb class="slider-thumb" />
        <SliderThumb class="slider-thumb" />
      </SliderRoot>
    </div>
  </div>
</template>

<style scoped>
.time-select-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  background: var(--secondary-glass);
  backdrop-filter: blur(10px);
  padding: 6px;
  position: relative;
  max-height: 35px;
}

.time-fields {
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.TimeField {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.TimeFieldSegment {
  font-weight: 600;
  padding: 2px 4px;
}

.TimeFieldLiteral {
  opacity: 0.7;
}

.slider-wrapper {
  width: 100%;
  height: 35px;
  position: absolute;
  top: 0;
  left: 0;
}

.time-slider {
  position: relative;
  width: 100%;
  height: 35px;
  display: block;
}

.slider-track {
  position: absolute;
  height: 4px;
   height: 35px;
  width: 100%;
  border-radius: 2px;
}

.slider-range {
  position: absolute;
  height: 4px;
  border-radius: 2px;
  background: var(--accent-color, #00ff88);
}

.slider-thumb {
  width: 8px;
  height: 8px;
  background: var(--accent-color, #00ff88);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
}
.slider-thumb:hover {
  transform: scale(1.2);
}
</style>

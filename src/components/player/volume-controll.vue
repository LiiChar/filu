<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';
import { PopoverContent, PopoverRoot, PopoverTrigger } from 'reka-ui'
import Button from '../ui/button.vue';
import { ref } from 'vue';


const { volume, onChange, muted, onToggleMute } = defineProps<{
	volume: number;
	onChange: (payload: number[] | undefined) => void;
  muted: boolean,
  onToggleMute: () => void
}>();


const iconName = () => {
  if (muted) return 'lucide:volume-off';
  if (volume == 0) return 'lucide:volume-x';
  if (volume < 30) return 'lucide:volume';
  if (volume < 60) return 'lucide:volume-1';
  return 'lucide:volume-2';
}

const hover = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const handleEnter = () => {
  if (hideTimer) clearTimeout(hideTimer);
  hover.value = true;
};

const handleLeave = () => {
  hideTimer = setTimeout(() => {
    hover.value = false;
  }, 100);
};

</script>

<template>
  <PopoverRoot :open="hover">
    <div @mouseenter="handleEnter" @mouseleave="handleLeave">
    <PopoverTrigger
      as-child
      aria-label="Update dimensions"
    >
    <Button  class="btn-trigger" @click="onToggleMute" variant="rounded">
			<Icon  :icon="iconName()" />
    </Button>
    </PopoverTrigger>
      <PopoverContent
      
        side="bottom"
        :side-offset="0"
        class="PopoverContent"
        
      >
        <SliderRoot
					@update:model-value="onChange"
					:model-value="[volume]"
					class="SliderRoot"
					:max="100"
					:step="1"
          orientation="vertical"
				>
					<SliderTrack class="SliderTrack" >
						<SliderRange class="SliderRange" />
					</SliderTrack>
					<SliderThumb class="SliderThumb" aria-label="Volume" />
				</SliderRoot>
      </PopoverContent>
    </div>
  </PopoverRoot>
</template>

<style scoped>
.SliderRoot {
	position: relative;
	display: flex;
	align-items: center;
	user-select: none;
	touch-action: none;
	width: 20px;
	height: 80px;
  margin-bottom: 6px;
	border-radius: 9999px;
	overflow: hidden;
}

.SliderTrack {
	background-color: #ffffff3f;
	position: relative;
	flex-grow: 1;
	border-radius: 9999px;
	height: 100%;
  width: 100%;
}

.SliderRange {
	position: absolute;
	background-color: var(--foreground);
	border-radius: 9999px;
	height: 100%;
}

.SliderThumb {
	display: block;
	width: 20px;
	height: 20px;
	background-color: white;
	border-radius: 10px;

	background-color: var(--foreground);
}

.controller_container:not(.min_thumb) .SliderThumb {
	border-top-left-radius: 0px;
	border-bottom-left-radius: 0px;
}

.controller_container:not(.min_thumb) .SliderRange {
	border-top-right-radius: 0px;
	border-bottom-right-radius: 0px;
}

.controller_container.max_thumb .SliderRange {
	border-top-right-radius: 9999px;
	border-bottom-right-radius: 9999px;
}

.SliderThumb:hover {
}
.SliderThumb:focus {
	outline: none;
}

.controller_icons {
	aspect-ratio: 1 / 1;
	border-radius: 100%;
	transition: all 0.2s ease;
}

.controller_container {
	display: flex;
	gap: 12px;
	align-items: center;
	position: relative;
}

button,
fieldset,
input {
  all: unset;
}

.PopoverContent {
  border-radius: 4px;
  padding: 4px;
  height: 80px;
  width: 20px;
  
  background-color: var(--secondary-glass);
}
.PopoverContent[data-state='open'][data-side='top'] {
  animation-name: slideDownAndFade;
}
.PopoverContent[data-state='open'][data-side='right'] {
  animation-name: slideLeftAndFade;
}
.PopoverContent[data-state='open'][data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.PopoverContent[data-state='open'][data-side='left'] {
  animation-name: slideRightAndFade;
}

.PopoverArrow {
  fill: var(--secondary-glass);
}

.PopoverClose {
  font-family: inherit;
  border-radius: 100%;
  height: 25px;
  width: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--grass-11);
  position: absolute;
  top: 5px;
  right: 5px;
}
.PopoverClose:hover {
  background-color: var(--grass-4);
}
.PopoverClose:focus {
  box-shadow: 0 0 0 2px var(--grass-7);
}

.Fieldset {
  display: flex;
  gap: 20px;
  align-items: center;
}

.Label {
  font-size: 13px;
  color: var(--grass-11);
  width: 75px;
}

.Input {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 13px;
  line-height: 1;
  color: var(--grass-11);
  box-shadow: 0 0 0 1px var(--grass-7);
  height: 25px;
}
.Input:focus {
  box-shadow: 0 0 0 2px var(--grass-8);
}

.Text {
  margin: 0;
  color: var(--mauve-12);
  font-size: 15px;
  line-height: 19px;
  font-weight: 500;
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

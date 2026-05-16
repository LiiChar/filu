<script setup lang="ts">
import { computed } from 'vue';
import { Background, useSettingStore } from '../../store/setting';
import { storeToRefs } from 'pinia';
import Dither from './Dither.vue';
import DotGrid from './DotGrid.vue';
import FaultyTerminal from './FaultyTerminal.vue';
import Particles from './Particles.vue';
import PixelBlast from './PixelBlast.vue';

const hexToRgb = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const setting = useSettingStore();
const { background, 'background-speed': speed, "accent-color": accentColor, 'background-animation-enabled': animationEnabled } = storeToRefs(setting);

const backgrounds: Record<Background, any> = {
  dither: Dither,
  dotGrid: DotGrid,
  faultyTerminal: FaultyTerminal,
  particles: Particles,
  pixelBlast: PixelBlast,
};

const selectedBackground = computed(() => backgrounds[background.value]);

const backgroundProps = computed(() => {
  switch (background.value) {
    case 'particles':
      return {
        speed: speed.value,
        particleColors: [accentColor.value],
        disableRotation: !animationEnabled.value
      } as InstanceType<typeof Particles>["$props"];
    case 'dither':
      return {
        waveSpeed: speed.value * 10,
        waveColor: hexToRgb(accentColor.value),
        disableAnimation: !animationEnabled.value
      } as InstanceType<typeof Dither>["$props"];
    case 'pixelBlast':
      return {
        color: accentColor.value,
        speed: speed.value,
      } as InstanceType<typeof PixelBlast>["$props"];
    default:
      return {};
  }
});
</script>

<template>
  <component class="bg-background absolute" :class="{ 'zi--1': true }" :is="selectedBackground" v-bind="backgroundProps" />
</template>

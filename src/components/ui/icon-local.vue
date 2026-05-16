<script setup lang="ts">
import { computed } from 'vue';
import { getIcon, type Icon as IconType } from '../../utils/icons';

interface Props {
  icon: IconType;
  height?: string | number;
  width?: string;
  viewBox?: string;
}

const props = defineProps<Props>();

const ic = computed(() => getIcon(props.icon));
const prefix = computed(() => props.icon.split(':')[0]);
const iconClass = computed(() => `iconify iconify--${prefix.value}`);
</script>

<template>
  <svg :height="props.height" :width="props.width" v-if="ic" v-bind="$attrs" :class="iconClass" :viewBox="props.viewBox || ic.viewBox || '0 0 24 24'" aria-hidden="true" role="img" >
    <g v-html="ic.body"></g>
  </svg>
</template>

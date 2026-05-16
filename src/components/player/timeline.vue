<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';
import { ref, watch } from 'vue';
const { value, onChange } = defineProps<{
	value: number;
	onChange: (payload: number[] | undefined) => void;
}>();

const thumbRef = ref<HTMLElement | null>(null);

watch(
  () => value,
  (v) => {
    if (thumbRef.value) {
      thumbRef.value.style.setProperty('--percent', v.toString());
    }
  },
  { immediate: true }
);
</script>

<template>
	<div
		:class="{
			controller_container: true,
		}"
	>
		<SliderRoot
			@update:model-value="onChange"
			:model-value="[value]"
			class="SliderRoot"
			:max="100"
			:step="0.001"
			:min="0"
		>
			<SliderTrack class="SliderTrack">
				<SliderRange class="SliderRange" />
			</SliderTrack>
			<SliderThumb :data-percent="value" v-if="value !== 0" class="SliderThumb" aria-label="Volume" >
				<slot></slot> 
			</SliderThumb>
		</SliderRoot>

	</div>
</template>

<style scoped>
.SliderRoot {
	position: relative;
	display: flex;
	align-items: center;
	user-select: none;
	touch-action: none;
	width: 100%;
	border-radius: 9999px;
	height: 100%;
	transition: all 1s ease-in;
}

.SliderTrack {
	background-color: #00000017;
	position: relative;
	flex-grow: 1;
	border-radius: 9999px;
	height: 100%;
	min-height: 100% 	;
	overflow: hidden;
	transition: left 300ms ease;
	backdrop-filter: blur(10px)
	
}

.SliderRange {
	position: absolute;
	background-color: #00000036;
	border-radius: 9999px;
	height: 100%;
	border-top: 3px solid var(--primary);
	transition: right 0.25s linear;
}

.SliderThumb {
	display: block;
	height: 100%;
	background-color: var(--primary);
	border-radius: 10px;
	width: 10px;
	height: 10px;
	aspect-ratio: 1 / 1;
	border-radius: 100%;
	position: absolute;
	translate: calc(-5px + 5px * (var(--percent) / 100) + 0px);	 
	top: -4px;
	transition: left 0.25s linear, transform 0.25s linear;
}

.SliderThumb:active {
	transform: scale(1.2); /* лёгкий эффект при перетаскивании */
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
</style>

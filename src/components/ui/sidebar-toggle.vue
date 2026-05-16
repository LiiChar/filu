<script setup lang="ts">
import IconLocal from './icon-local.vue';

const { isToggle, height } = defineProps<{
	isToggle: Boolean;
	height?: number;
}>();
</script>

<template>
	<IconLocal
		v-if="isToggle"
		:height="height ?? 24"
		icon="tabler:layout-sidebar-left-collapse-filled"
	/>
	<IconLocal
		v-else="isToggle"
		:height="height ?? 24"
		icon="tabler:layout-sidebar-left-collapse"
	/>
</template>

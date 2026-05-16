<script setup lang="ts">
import { onMounted } from 'vue';
import { useSettingStore } from '../../store/setting';

const settings = useSettingStore();

onMounted(() => {
  const color = document.documentElement.style.getPropertyValue('--primary');
  console.log('color', color);
  if (color) {
    settings.updateSetting('accent-color', color);
  }
})
</script>

<template>

</template>
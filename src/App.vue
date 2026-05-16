<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import './styles/base.css'
import './styles/ui.css'
import Background from './components/background/Background.vue';
import Header from './widget/layout/Header.vue';
import Toast from './widget/provider/Toast.vue';
import { TooltipProvider } from 'reka-ui';
import { useSettingStore } from './store/setting';
import Mount from './widget/layout/Mount.vue';
import PictureInPicture from './widget/layout/PictureInPicture.vue';
import { useI18n } from './composables/useI18n';

const { t } = useI18n();

onMounted(() => {
  const setting = useSettingStore();
  document.documentElement.dataset.theme = setting.theme || 'dark';
});

watch(() => useSettingStore().theme, (newTheme) => {
  document.documentElement.dataset.theme = newTheme;
});
</script>

<template>
  <Mount/>
  <TooltipProvider>
    <Toast>
      <PictureInPicture/>
      <Background />
      <Header/>
      <main id="main-content" role="main">
        <RouterView/>
      </main>
    </Toast>
  </TooltipProvider>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100000px;
  left: 6px;
  background: var(--background);
  color: var(--foreground);
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { showToast } from '../store/toast';
import DownloadInput from '../widget/download/download-input.vue';
import { useDownloadStore } from '../store/donwload';
import { storeToRefs } from 'pinia';
import IconLocal from '../components/ui/icon-local.vue';
import Button from '../components/ui/button.vue';
import DownloadDropdown from '../widget/download/download-dropdown.vue';

const poster = ref('');

const downloadStore = useDownloadStore();
const {activeDownloads} = storeToRefs(downloadStore);


onMounted(() => {
  downloadStore.loadFromStorage();
  if (activeDownloads.value.length === 0) {
    downloadStore.createDownload('');
  }
});

</script>
<template>

  <div class="load-wrapper">
    <div class="load">
      <DownloadInput v-for="download in activeDownloads" :download="download" :key="download.id" @poster="(p) => poster = p" class="download-input"/>
        <div :class="{'add-load': true, 'second': activeDownloads.length === 1}">
          <Button aria-label="Добавить загрузчик" variant="rounded"  size="sm" @click="downloadStore.createDownload('')">
            <IconLocal width="12px" icon="material-symbols:add-rounded"/>
          </Button>
        </div>
    </div>
    
    <div v-if="poster" class="poster-contain">
      <img :src="poster" alt="poster">
    </div>
  </div>
</template>

<style scoped>
.load-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.add-load {
  width: 380px;
  display: flex;
  justify-content: center;
  align-items: center;

  &.second {
    position: absolute;
    margin-left: 430px; 
  }
}

.poster-contain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}
.poster-contain > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.download-input {
min-width: 380px;
    max-width: 380px;
}
.load {
  gap: 7px;
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  z-index: 2;
  position: relative;
}
.load-wrapper {
    height: 100%;
    width: 100%;
}

/* Анимация плавного перелива */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>

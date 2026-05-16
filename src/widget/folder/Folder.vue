<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useVideoStore, Video } from '../../store/video';
import { getFolerPath, readFolder } from '../../utils/path';
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import 'vue3-carousel/carousel.css';
import { Carousel, Slide } from 'vue3-carousel';
import { convertFileSrc } from '@tauri-apps/api/core';
import Button from '../../components/ui/button.vue';
import IconLocal from '../../components/ui/icon-local.vue';

const videoStore = useVideoStore();
const { video, playlist } = storeToRefs(videoStore);

const posters = ref<Record<string, string>>({});
const visible = ref(false);

async function generateThumbnail(videoPath: string, time = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = convertFileSrc(videoPath);
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(time, video.duration / 2 || 1);
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context error');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(imageUrl);
    });

    video.addEventListener('error', (e) => reject(e));
  });
}

const folderContainerRef = ref<HTMLDivElement | null>(null);

const resizeTrigger = ref(0);

const handleWindowResize = () => {
  resizeTrigger.value++;
};

// показывать не больше 8 и не меньше длины списка
const itemsToShow = computed(() => {
  resizeTrigger.value; // trigger reactivity
  if (folderContainerRef.value) {
    return Math.floor(folderContainerRef.value.clientWidth / 150);
  } else {
    return Math.min(playlist.value.length, 8)
  }
});

onMounted(async () => {
  window.addEventListener('resize', handleWindowResize);

  if (!video.value?.path) return;

  const folderPath = getFolerPath(video.value.path);
  const files = await readFolder(folderPath);
  const filtered = files.filter((f) => /\.(mp4|webm|mov|avi|mkv|mp3)$/i.test(f));
  videoStore.setPlaylist(filtered);

  for (const f of filtered) {
    try {
      posters.value[f] = await generateThumbnail(f, 2);
    } catch (e) {
      console.warn('Не удалось создать превью:', f, e);
    }
  }
});

const handleVideo = async (v: Video) => {
  visible.value = false;
  await videoStore.setVideo(v);
   videoStore.pause()
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize);
});

// если мало элементов — включаем режим центрирования
const isFew = computed(() => playlist.value.length <= 3);
</script>

<template>
  <Button
    variant="rounded"
    class="folder-trigger"
    @click.stop="visible = !visible"
  >
    <IconLocal v-if="visible" icon="material-symbols:close-rounded" />
    <IconLocal v-else icon="material-symbols:folder-open-rounded" />
  </Button>

  <Transition name="slide-right">
    <div ref="folderContainerRef" v-if="visible" class="folder-container">
      <Carousel
        v-if="!isFew"
        
        class="video-carousel"
        :items-to-show="itemsToShow"
        :transition="400"
        :wrap-around="playlist.length > itemsToShow"
        :mouse-drag="true"
        :touch-drag="true"
      >
        <Slide
          v-for="slide in playlist"
          :key="slide.path"
          class="video-container"
          @click="handleVideo(slide)"
        >
          <div class="video-item">
            <video
              class="video-preview"
              :src="convertFileSrc(slide.path)"
              :poster="posters[slide.path]"
              preload="metadata"
            />
            <div class="video-name">{{ slide.title }}</div>
          </div>
        </Slide>
      </Carousel>

      <!-- Если мало видео — обычный flex без растяжения -->
      <div v-else class="video-few">
        <div
          class="video-item"
          v-for="slide in playlist"
          :key="slide.path"
          @click="handleVideo(slide)"
        >
          <video
            class="video-preview"
            :src="convertFileSrc(slide.path)"
            :poster="posters[slide.path]"
            preload="metadata"
          />
          <div class="video-name">{{ slide.title }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.folder-trigger {
  position: absolute;
  bottom: 50%;
  transform: translateY(50%);
  right: 38px;
  z-index: 100;
}

.folder-container {
  position: absolute;
  z-index: 10;
  left: 0;
  bottom: 49px;
  width: 100%;
  max-width: 100vw;
}

.video-carousel {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.video-container {
  padding: 4px;
  flex: 0 0 auto;
}

.video-few {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px;
}

.video-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--background-glass);
  backdrop-filter: blur(4px);
  padding: 6px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 150px;
}

.video-item:hover {
  transform: translateY(-4px);
}

.video-preview {
  aspect-ratio: 16 / 9;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
}

.video-name {
  margin-top: 6px;
  font-size: 13px;
  color: #eee;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* анимация выезда справа */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useVideoStore } from "../../store/video";
import Timeline from "../../components/player/timeline.vue";
import Button from "../../components/ui/button.vue";
import { Icon } from "@iconify/vue";
import { formattedTime } from "../../utils/time";
import { storeToRefs } from "pinia";
import { setColorPrimary } from "../../utils/color";
import { open } from "@tauri-apps/plugin-dialog";
import VolumeControll from "../../components/player/volume-controll.vue";
import Settings from "../../components/player/settings.vue";
import { onKeyStroke } from '@vueuse/core'
import { invoke } from "@tauri-apps/api/core";


const videoStore = useVideoStore();


const {duration, isAutoPlay, playing, isFullscreen, isLoop, muted, time, url, video, volume} = storeToRefs(videoStore);
const videoEl = ref<HTMLVideoElement | null>(null);
const isHover = ref(false);
const isVisible = ref(false);

onMounted(async () => {
  await invoke<string>("transfer_vid").then(async (vidSrc) => {
      await videoStore.setVideo({
        path: vidSrc,
        title: vidSrc.split("\\").pop()!,
      });
  });
})

onKeyStroke(' ', () => {
  videoStore.togglePlay();
})

onKeyStroke('ArrowLeft', () => {
  handleSkip(-10)
})

onKeyStroke('ArrowRight', () => {
   handleSkip(10)
})

onKeyStroke('ArrowDown', () => {
  videoStore.setVolume(videoStore.volume - 10)
})

onKeyStroke('ArrowUp', () => {
  videoStore.setVolume(videoStore.volume + 10)
})

onKeyStroke('Escape', () => {
   if (isFullscreen.value) videoStore.toggleFullscreen()
})


const setCurrentTime = () => {
  if (!videoEl.value) return;
  videoStore.setTime(videoEl.value.currentTime);
};

const generateMetadata = () => {
  if (!videoEl.value) return;
  videoStore.setDuration(videoEl.value.duration);
  generatePoster();
};

const generatePoster = () => {
  if (!videoEl.value) return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  videoEl.value.addEventListener(
    "loadeddata",
    () => {
      canvas.width = videoEl.value!.videoWidth;
      canvas.height = videoEl.value!.videoHeight;
      ctx.drawImage(videoEl.value!, 0, 0, canvas.width, canvas.height);
      if (video) {
        const url = canvas.toDataURL("image/png");
        videoStore.video!.cover = url;
        
        setColorPrimary(url);
      }
    }
  );
};


watch(playing, () => {
  if (!videoEl.value) return;
  videoEl.value[playing.value ? "play" : "pause"]();
})

async function pickVideo() {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Video", extensions: ["mp4", "webm", "ogg", "mkv", 'avi'] }],
  });

  if (!selected) return;

  await videoStore.setVideo({
    path: selected,
    title: selected.split("\\").pop()!,
  });
}

let timeoutId: ReturnType<typeof setTimeout> | null = null

const handleControl = () => {
  isVisible.value = true

  if (timeoutId) clearTimeout(timeoutId)

  timeoutId = setTimeout(() => {
    if (isHover.value ) return;
    isVisible.value = false
    timeoutId = null
  }, 750)
}

const debouncedHandleTime = (v: number[] | undefined) => {
  videoStore.setTime((v![0] / 100) * duration.value);
  videoEl.value!.currentTime = time.value;
}

const handleVolume = (v: number[] = [100]) => {
  videoStore.setVolume(v[0]);
}

const handleSkip = (sec: number) => {
  videoStore.setTime(videoStore.time + sec);
  videoEl.value!.currentTime = time.value;
}
</script>

<template>
  <div v-if="!video" class="add-player">
    <Icon @click="pickVideo" class="video-info-conver-plus" icon="material-symbols:add-rounded"/>
  </div>
  <div v-if="video" class="video-wrapper" @click="videoStore.togglePlay()" @mousemove="handleControl">
    <div class="video-player">
      <video
        v-on:timeupdate="setCurrentTime"
        v-on:loadedmetadata="generateMetadata"
        v-if="url"
        :key="url"
        ref="videoEl"
        :autoplay="isAutoPlay"  
        :src="url"
        :loop="isLoop"
        preload="metadata"
        onload="generateMetadata"
        class="video"
        :muted="muted"
        :volume="volume / 100"
      ></video>

      <div @click="(e) => e.stopPropagation()" :class="{controls: true, 'controls-visible': isVisible}" @mouseenter="isHover = true" @mouseleave="isHover = false">
        <div class="control-wrapper">
          <div class="video-info" >
            <div class="video-info-conver">
              <img
                class="video-info-conver-img"
                :src="video?.cover"
                alt=""
              />
              <Icon @click="pickVideo" class="video-info-conver-plus" icon="material-symbols:add-rounded"/>
            </div>
            <div class="video-info-main">
              <div v-if="video?.title" class="video-info-title">{{ video?.title }}</div>
              <div v-if="video?.artist" class="video-info-artist">{{ video?.artist }}</div>
            </div>
          </div>

          <div class="controls-actions">
            <Button
              class="control-action"
              variant="rounded"
              size="sm"
              @click="videoStore.prev"
              :disabled="!videoStore.hasPrev()"
            >
              <Icon icon="fluent:previous-16-filled" />
            </Button>
            
             <Button
              class="control-action time-skip"
              variant="rounded"
              size="sm"
              @click="handleSkip(-10)"
            >
              <Icon icon="fluent:skip-back-10-20-filled" />
            </Button>
            <Button
              class="control-action control-action-play"
              variant="rounded"
              size="sm"
              @click="videoStore.togglePlay"
            >
              <Icon
                :icon="
                  playing
                    ? 'line-md:play-filled-to-pause-transition'
                    : 'line-md:pause-to-play-filled-transition'
                "
              />
            </Button>
            <Button
              class="control-action time-skip"
              variant="rounded"
              size="sm"
              @click="handleSkip(10)"
            >
              <Icon icon="fluent:skip-forward-10-20-filled" />
            </Button>
            <Button
              class="control-action"
              variant="rounded"
              size="sm"
              @click="videoStore.next"
              :disabled="!videoStore.hasNext()"
            >
              <Icon icon="fluent:next-16-filled" />
            </Button>
          </div>
          <div class="controls-right">
              <VolumeControll  :volume="volume" :muted="muted" @toggle-mute="videoStore.toggleMute" @change="handleVolume"/>
              <Button @click="videoStore.toggleFullscreen()" variant="rounded">
                <Icon v-if="!isFullscreen" icon="material-symbols:fullscreen-rounded"/>
                <Icon v-if="isFullscreen" icon="material-symbols:fullscreen-exit-rounded"/>
              </Button>
              <Settings/>
          </div>
        </div>

        <div :class="{progress: true, 'progress-visible': isHover}">
          <div class="progress-time-wrapper">
            <div></div>
            <div
              :class="{
                'progress-time progress-time-duration': true,
                hidden: (time / duration) * 100 > 88,
              }"
            >
              {{ formattedTime(duration, "s", "hh:mm:ss") }}
            </div>
          </div>

          <Timeline
            :value="(time / duration) * 100"
            @change="debouncedHandleTime"
            class="timeline"
          >
            <div class="progress-time progress-time-current">
              {{ formattedTime(time, "s", "hh:mm:ss") }}
            </div>
          </Timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-skip svg {
margin-bottom: -3px;
}

.controls-visible.controls {
  opacity: 1;
}



.controls {
  opacity: 0;
  transition: all 0.2s ease-in-out;
}

.progress-time-wrapper {
  width: calc(100% - 30px);
  position: absolute;
  top: -35px;
  left: 15px;
  display: flex;
  justify-content: space-between;
}

.controls-right {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: end;
  & > button {
     display: flex !important;
    width: 26px !important;
    height: 26px !important;
    padding: 3px !important;
  }
}

.add-player {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px);

  & > .video-info-conver-plus {
    opacity: 1;
    width: 20vw;
    height: 20vw;
  }
}

.video-info-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.control-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 69%;
  height: 40px;

  & > div {
    width: 35%;
  }

  & > div.controls-actions {
    width: 30%;
  }
}

.control-action {
  opacity: 1;
}

.control-action:disabled {
 opacity: 0;
}

.video-info-conver {
  height: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
}

.video-info {
  height: 100%;
  display: flex;
  gap: 6px;
}

.video-info:hover .video-info-conver-plus {
  opacity: 1;
}

.video-info-conver-plus {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%; 
  opacity: 0;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease-in-out;
}

.video-info-conver-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.progress-time-current {
  background-color: var(--secondary-glass);
    border: 1px solid var(--secondary);
    padding: 4px;
    border-radius: 6px;
    position: absolute;
    top: -31px;
    left: 50%;
    transform: translateX(-50%);
}

.progress-time-duration {
   background-color: var(--secondary-glass);
    border: 1px solid var(--secondary);
    padding: 4px;
    border-radius: 6px;
    opacity: 1;
    transition: all 0.2s ease-in-out;
}

.progress-time-duration.hidden {
  opacity: 0;
}

.video-wrapper {
  width: 100%;
  height: 100%;
}
.video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: black;
  z-index: -1;
}
.video-player {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  position: relative;
  user-select: none;
}
.controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: end;
  height: min-content;
  width: 100%;
  padding: 6px;
  z-index: 30;
  height: 40px;
}

.controls-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 100%;
}
.control-action {
  padding: 5px;
  height: 32px;
  width: 32px;
  aspect-ratio: 1 / 1;
}
.control-action.control-action-play {
  height: 40px;
  width: 40px;
}
.control-action.control-action-play svg {
  height: 40px;
  width: 40px;
}
.progress {
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70%;
  height: 100%;
  gap: 6px;
  z-index: -1;
}
.progress .timeline {
  width: 100%;
  height: 100%;
}
</style>
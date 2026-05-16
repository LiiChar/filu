<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import Input from '../../components/ui/input.vue';
import { ref } from 'vue';
import IconLocal from '../../components/ui/icon-local.vue';
import Button from '../../components/ui/button.vue';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { getVideoStream } from '../../api/video';

const { label, onSelect } = defineProps<{
  label?: string;
	onSelect: (text: string) => void;
}>();

const open = ref(false)
const isBrowser = ref(false);

const url = ref('');

const handleSelect = async (type: 'video' | 'audio' | 'image' | 'browser') => {
  if (type === 'browser') {
    isBrowser.value = true;
    return;
   }

   const url = '';
   
   let filter: { name: string; extensions: string[] } = { name: '', extensions: [] };
  
  if (type === 'video') {
    filter = { name: 'Video', extensions: ['mp4', 'webm', 'ogg', 'mkv', 'avi'] };
  } else if (type === 'audio') {
    filter = { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] };
  } else if (type === 'image') {
    filter = { name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] };
  } 

  const selected = await openDialog({
    multiple: false,
    filters: [filter],
  });


  if (!selected) {
    isBrowser.value = true;
    return;
  };
  
  onSelect(selected);
  open.value = false;
}

const handleBrowserSelect = async (browserUrl: string) => {
  const url = await getVideoStream(browserUrl);
  onSelect(url);

  open.value = false;
}

</script>

<template>
  <DialogRoot :open="open" @update:open="(b) => open = b">
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="DialogOverlay" />
      <DialogContent class="DialogContent">
        <DialogTitle v-if="label" class="DialogTitle">
          {{ label }}
        </DialogTitle>
        <div class="open-wrapper">
          <div class="open-container">
            <Button @click="handleSelect('video')" class="open-action">
              <IconLocal icon="tabler:video-filled" class="icon" />
            </Button>
            <Button @click="handleSelect('audio')" class="open-action">
            <IconLocal icon="gridicons:audio" class="icon" />
          </Button>
          <Button @click="handleSelect('image')" class="open-action">
            <IconLocal icon="material-symbols:image-rounded" class="icon" />
          </Button >
          <Button @click="handleSelect('browser')" class="open-action">
            <IconLocal icon="tabler:browser" class="icon" />
          </Button>
        </div>
        <div class="url-container" v-if="isBrowser">
          <Input v-model="url" placeholder="Введите ссылку" />
          <Button @click="handleBrowserSelect(url)">
            <IconLocal icon="material-symbols:arrow-forward-ios-rounded" class="icon" />
          </Button>
        </div>
      </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
 
<style scoped>

.url-container {
  display: flex;
  gap: 0px;
}

.url-container input {
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
} 
.url-container :deep(.btn) {
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
} 

.open-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.open-action {
  height: 30px;
  width: 30px;
  background-color: var(--background) !important;
}

.open-container {
  display: flex;
  gap: 4px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px;
  background-color: var(--secondary);
  border-radius: 6px;
}

/* reset */
button,
fieldset,
input {
  all: unset;
}



.DialogOverlay {
  position: fixed;
  z-index: 1000;

  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.DialogContent {
  position: fixed;
  z-index: 1000;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);

    border-radius: 6px;
    opacity: 1;
    transition: all 0.2s ease-in-out;
    display: flex;
    gap: 4px;
    flex-direction: column;
}
.DialogTitle {
  margin: 0;
  font-weight: 500;
  color: var(--mauve-12);
  font-size: 24px;
}
.SliderRoot {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  width: 200px;
  height: 20px;
}

.SliderTrack {
  background-color: var(--secondary-glass);
  position: relative;
  flex-grow: 1;
  border-radius: 9999px;
  height: 3px;
}

.SliderRange {
  position: absolute;
  background-color: white;
  border-radius: 9999px;
  height: 100%;
}

.SliderThumb {
  display: block;
  width: 20px;
  height: 20px;
  background-color: var(--foreground);
  border-radius: 10px;
}

.SliderValue {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
 background-color: var(--background-glass);
    border: 1px solid var(--secondary);
    border-radius: 6px;
    opacity: 0;
    transition: all 0.2s ease-in-out;
    display: flex;
    padding: 4px;
    gap: 4px;
    flex-direction: column;
    backdrop-filter: blur(10px);
}

.SliderThumb:hover {
  & > .SliderValue {
    opacity: 1;
  }
}
.SliderThumb:focus {
  & > .SliderValue {
    opacity: 1;
  }
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
<script lang="ts" setup>
import IconLocal from '../ui/icon-local.vue';
import Button from '../ui/button.vue';
import {
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useVideoStore } from '../../store/video';
import { storeToRefs } from 'pinia';
import Equalizer from '../../widget/modal/Equalizer.vue';
import VideoSetting from '../../widget/modal/VideoSetting.vue';
import Property from '../../widget/modal/Property.vue';

const video = useVideoStore()


const {speed} = storeToRefs(video)

const handleSpeed = (e: MouseEvent, s: number) => {
  e.preventDefault();
  video.setSpeed(s);
}

</script>
<template>
  <DropdownMenuRoot >
    <DropdownMenuTrigger
      as-child
    >
     <Button style="width: 26px; height: 26px; padding: 5px;" variant="rounded">
        <IconLocal icon="iconamoon:options" />
      </Button>
    </DropdownMenuTrigger>

      <DropdownMenuContent
        :side-offset="5"
      >
      <div  class="setting-wrapper ">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            value="speed choose"
            as-child
          >
            <div class="setting-item">
          <IconLocal class="setting-icon" icon="material-symbols:speed-outline-rounded"/>
          <div class="setting-name">Скорость</div>
          <div class="setting-bind"><IconLocal icon="radix-icons:chevron-right" /></div>
        </div>
          </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              :side-offset="10"
              :align-offset="-5"
            >
            <div class="setting-wrapper " style="z-index: 100;">
              <DropdownMenuItem as-child>
                <div class="setting-item" @click="(e) => handleSpeed(e, (0.5))">
                  <IconLocal class="setting-icon" :icon="speed === 0.5 ? 'ion:checkmark' : 'material-symbols:speed-outline-rounded'" :style="{opacity: speed === 0.5 ? 1 : 0}"/>
                  <div class="setting-name">0.5</div>
                  <div class="setting-bind"></div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <div class="setting-item" @click="(e) => handleSpeed(e, 0.75)">
                  <IconLocal class="setting-icon" :icon="speed === 0.75 ? 'ion:checkmark' : 'material-symbols:speed-outline-rounded'" :style="{opacity: speed === 0.75 ? 1 : 0}"/>
                  <div class="setting-name">0.75</div>
                  <div class="setting-bind"></div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <div class="setting-item" @click="(e) => handleSpeed(e, 1)">
                  <IconLocal class="setting-icon" :icon="speed === 1 ? 'ion:checkmark' : 'material-symbols:speed-outline-rounded'" :style="{opacity: speed === 1 ? 1 : 0}"/>
                  <div class="setting-name">1</div>
                  <div class="setting-bind"></div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <div class="setting-item" @click="(e) => handleSpeed(e, 1.25)">
                  <IconLocal class="setting-icon" :icon="speed === 1.25 ? 'ion:checkmark' : 'material-symbols:speed-outline-rounded'" :style="{opacity: speed === 1.25 ? 1 : 0}"/>
                  <div class="setting-name">1.25</div>
                  <div class="setting-bind"></div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <div class="setting-item" @click="(e) => handleSpeed(e, 1.5)">
                  <IconLocal class="setting-icon" :icon="speed === 1.5 ? 'ion:checkmark' : 'material-symbols:speed-outline-rounded'" :style="{opacity: speed === 1.5 ? 1 : 0}"/>
                  <div class="setting-name">1.5</div>
                  <div class="setting-bind"></div>
                </div>
              </DropdownMenuItem>

              </div>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
         <DropdownMenuItem
                as-child
              >
                <VideoSetting>
                  <div class="setting-item">
                    <IconLocal class="setting-icon" icon="tabler:video"/>
                    <div class="setting-name">Параметры видео</div>
                    <div class="setting-bind"></div>
                  </div>
                </VideoSetting>
              </DropdownMenuItem>
               <DropdownMenuItem
                as-child
              >
              <Equalizer>

                <div class="setting-item">
                  <IconLocal class="setting-icon" icon="material-symbols:equalizer-rounded"/>
                  <div class="setting-name">Эквалайзер</div>
                  <div class="setting-bind"></div>
                </div>
              </Equalizer>
              </DropdownMenuItem>
               <DropdownMenuItem
                as-child
              >
              <Property>

                     <div class="setting-item">
          <IconLocal class="setting-icon" icon="material-symbols:info-outline-rounded"/>
          <div class="setting-name">Свойство</div>
          <div class="setting-bind"></div>
        </div>
              </Property>

              </DropdownMenuItem>
        <DropdownMenuArrow class="DropdownMenuArrow" />
        </div>
      </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
<style scoped>
.setting-wrapper {
  background-color: var(--secondary-glass);
    border: 1px solid var(--secondary);
    padding: 4px;
    border-radius: 6px;
    opacity: 1;
    transition: all 0.2s ease-in-out;
    display: flex;
    gap: 4px;
    flex-direction: column;
    backdrop-filter: blur(10px);
}

.setting-icon {
  height: 18px;
  width: 18px;
  aspect-ratio: 1 / 1;
}

.setting-item {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
  padding: 4px;
  
  border-radius: 6px;
}

.setting-item:hover {
backdrop-filter: blur(4px);
}

.setting-name {
  flex-grow: 1;
}
.PopoverContent {
  border-radius: 4px;
  padding: 4px;
  height: 80px;
  width: 20px;
  
  background-color: var(--secondary-glass);
}
.PopoverContent[data-state='open'][data-side='top'] {
  animation-name: slideDownAndFade;
}
.PopoverContent[data-state='open'][data-side='right'] {
  animation-name: slideLeftAndFade;
}
.PopoverContent[data-state='open'][data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.PopoverContent[data-state='open'][data-side='left'] {
  animation-name: slideRightAndFade;
}

.PopoverArrow {
  fill: var(--secondary-glass);
}

.PopoverClose {
  font-family: inherit;
  border-radius: 100%;
  height: 25px;
  width: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--grass-11);
  position: absolute;
  top: 5px;
  right: 5px;
}
.PopoverClose:hover {
  background-color: var(--grass-4);
}
.PopoverClose:focus {
  box-shadow: 0 0 0 2px var(--grass-7);
}
</style>

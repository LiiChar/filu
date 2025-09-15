<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import Button from '../ui/button.vue';
import { PopoverContent, PopoverRoot, PopoverTrigger } from 'reka-ui';

</script>
<template>
  <PopoverRoot>
    <PopoverTrigger
      as-child
    >
     <Button variant="rounded">
        <Icon icon="iconamoon:options" />
      </Button>
    </PopoverTrigger>
      <PopoverContent
        side="bottom"
        :side-offset="5"
        class="PopoverContent"
      >
      <div class="setting-wrapper">
        <div class="setting-item">
          <Icon class="setting-icon" icon="material-symbols:speed-outline-rounded"/>
          <div class="setting-name">Скорость</div>
          <div class="setting-bind"></div>
        </div>
        <div class="setting-item">
           <Icon class="setting-icon" icon="tabler:video"/>
          <div class="setting-name">Параметры видео</div>
          <div class="setting-bind"></div>
        </div>
        <div class="setting-item">
         <Icon class="setting-icon" icon="material-symbols:equalizer-rounded"/>
          <div class="setting-name">Эквалайзер</div>
          <div class="setting-bind"></div>
        </div>
        <div class="setting-item">
          <Icon class="setting-icon" icon="material-symbols:info-outline-rounded"/>
          <div class="setting-name">Свойство</div>
          <div class="setting-bind"></div>
        </div>
      </div>
    </PopoverContent>
  </PopoverRoot>
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
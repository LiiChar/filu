<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { ref } from 'vue'
import Button from '../../components/ui/button.vue'
import { useI18n } from '../../composables/useI18n'
import IconLocal from '../../components/ui/icon-local.vue'

const toggleState = ref(false)

const { t } = useI18n();

const handleClick = () => {
  if (toggleState.value) {
    toggleState.value = false;
  }
};
</script>

<template>
  <DropdownMenuRoot class="header-container" v-model:open="toggleState">
    <DropdownMenuTrigger
      as-child
    >
    <Button class="IconButton header-trigger"
    variant="rounded"
      :class="{'open-menu': toggleState, 'menu-trigger': true}"
      aria-label="Customise options">
        <IconLocal view-box="0 0 16 16" icon="radix-icons:hamburger-menu" />
    </Button>
      
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
      as-child
        
        :side-offset="5"
      >
      <div class="DropdownMenuContent">

          <RouterLink @click.prevent="handleClick" class="DropdownMenuItem" to="/">
            {{ t("navigation.home") }}
          </RouterLink>

          <RouterLink @click.prevent="handleClick" class="DropdownMenuItem" to="/load">
            {{ t("navigation.downloads") }}
          </RouterLink>
        <RouterLink @click.prevent="handleClick" class="DropdownMenuItem" to="/setting">

          {{ t("navigation.settings") }}
        </RouterLink>
      </div>

      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style scoped>
.menu-trigger {
  z-index: 543532623453425324 !important;
}

body:has(.open-menu) .header-trigger {
  opacity: 1 !important;
}

body:has(.open-menu):hover .header-trigger {
opacity: 1 !important;
}

.header-trigger {
  z-index: 1000000000;
  cursor: pointer;
}


.header-trigger:hover {
  opacity: 1 !important;
}
.DropdownMenuArrow {
  height: 12px !important;
  width: 14px !important;
  width: 100%;
  height: 100%;
}

button {
  all: unset;
}

body:has(.open-menu) .header-trigger {
  backdrop-filter: blur(0px) !important;
  background-color: var(--background-glass) !important;
}

.DropdownMenuContent {
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background-color: var(--secondary-glass);
  backdrop-filter: blur(10px) ;
  border-radius: 6px;
  overflow: hidden;
  margin-right: -10px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  translate: 8px 0;
}

.DropdownMenuContent[data-side='top'],
.DropdownMenuSubContent[data-side='top'] {
  animation-name: slideDownAndFade;
}
.DropdownMenuContent[data-side='right'],
.DropdownMenuSubContent[data-side='right'] {
  animation-name: slideLeftAndFade;
}
.DropdownMenuContent[data-side='bottom'],
.DropdownMenuSubContent[data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.DropdownMenuContent[data-side='left'],
.DropdownMenuSubContent[data-side='left'] {
  animation-name: slideRightAndFade;
}


.DropdownMenuItem {
  color: var(--foreground);
  text-decoration: none;
  padding: 4px 8px;
  display: flex;
  justify-content: start;
  align-items: center;
}

.DropdownMenuItem:hover {
  background-color: var(--background-glass);
}


.DropdownMenuArrow path {
  fill: var(--secondary-glass) !important;
}

.IconButton {
    position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100000000;
  border-radius: 100%;
  height: 21px;
  width: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-glass);
  backdrop-filter: blur(10px);
}
.IconButton:hover {
  backdrop-filter: blur(0px) !important;
  background-color: var(--background-glass) !important;
}

.RightSlot {
  margin-left: auto;
  padding-left: 20px;
  color: var(--mauve-11);
}
[data-highlighted] > .RightSlot {
  color: white;
}
[data-disabled] .RightSlot {
  color: var(--mauve-8);
}

@keyframes slideUpAndFade {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRightAndFade {
  from {
    opacity: 0;
    transform: translateX(-2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeftAndFade {
  from {
    opacity: 0;
    transform: translateX(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

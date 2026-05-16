<script setup lang="ts">
import { computed, ref, watch, nextTick, defineAsyncComponent } from 'vue';

const props = defineProps<{
  autoplay?: boolean;
	preview?: boolean;
}>();
import { useVideoStore } from '../../store/video';
import Timeline from '../../components/player/timeline.vue';
import Button from '../../components/ui/button.vue';
import IconLocal from '../../components/ui/icon-local.vue';
import { formattedTime } from '../../utils/time';
import { storeToRefs } from 'pinia';
import { setColorPrimary } from '../../utils/color';
import { open } from '@tauri-apps/plugin-dialog';
import VolumeControll from '../../components/player/volume-controll.vue';
import Settings from '../../components/player/settings.vue';
import AudioVisualizer from '../../components/player/audio-visualizer.vue';
import { onKeyStroke, useTitle } from '@vueuse/core';
import { getFileName, getSep } from '../../utils/path';
import Folder from '../folder/Folder.vue';
import { useSettingStore } from '../../store/setting';
import { getDistanceBetweenElements } from '../../utils/position';
import { useI18n } from '../../composables/useI18n';
import { getFileSize } from '../../api/process';
import DownloadDropdown from '../download/download-dropdown.vue';
import { getPoster, getVideoStream } from '../../api/video';
import Open from '../modal/Open.vue';
import Hls from 'hls.js'
import { useToast } from '../../store/toast';
import { getMediatExt, getMediaType, getServerStreamUrl } from '../../utils/media';
import { runFileServer } from '../../api/file';

// Ленивая загрузка модальных окон
const Equalizer = defineAsyncComponent(() => import('../modal/Equalizer.vue'));
const Property = defineAsyncComponent(() => import('../modal/Property.vue'));
const VideoSetting = defineAsyncComponent(() => import('../modal/VideoSetting.vue'));

const { t } = useI18n();

const videoStore = useVideoStore();
const {
	duration,
	settings,
	speed,
	playing,
	isFullscreen,
	muted,
	time,
	url,
	video,
	volume,
} = storeToRefs(videoStore);

const settingStore = useSettingStore();
const {
	'video-fit': videoFit,
	'default-volume': defaultVolume,
	'default-speed': defaultSpeed,	
	'auto-play-default': autoPlayDefault,
	'loop-default': loopDefault,
	'hotkeys-enabled': hotkeysEnabled,
	'skip-time': skipTime
} = storeToRefs(settingStore);

const mediaEl = ref<HTMLVideoElement | HTMLAudioElement | null>(null);
const isHover = ref(false);
const isVisible = ref(false);
const showTime = ref(true);
const currentTimeRef = ref<HTMLDivElement | null>(null);
const durationTimeRef = ref<HTMLDivElement | null>(null);
const preloadMode = ref<'none' | 'metadata' | 'auto'>('auto');

// Определяем тип медиа
const mediaType = computed(() => {
	if (!video.value) return 'none';

	return getMediaType(video.value.path);
});

// Горячие клавиши - активны только если включены в настройках
onKeyStroke(' ', () => {
	if (mediaType.value !== 'image' && hotkeysEnabled.value && !props.preview) {
		videoStore.togglePlay();
	}
});

onKeyStroke('ArrowLeft', () => {
	if (mediaType.value !== 'image' && hotkeysEnabled.value && !props.preview) {
		handleSkip(-skipTime.value);
	}
});

onKeyStroke('ArrowRight', () => {
	if (mediaType.value !== 'image' && hotkeysEnabled.value && !props.preview) {
		handleSkip(skipTime.value);
	}
});

onKeyStroke('ArrowDown', () => {
	if (mediaType.value !== 'image' && hotkeysEnabled.value && !props.preview) {
		videoStore.setVolume(videoStore.volume - 10);
	}
});

onKeyStroke('ArrowUp', () => {
	if (mediaType.value !== 'image' && hotkeysEnabled.value && !props.preview) {
		videoStore.setVolume(videoStore.volume + 10);
	}
});

onKeyStroke('Escape', () => {
	if (isFullscreen.value && !props.preview) videoStore.toggleFullscreen();
});

const hls = ref<Hls | null>(null);

// Применение настроек по умолчанию при инициализации
watch([url, mediaEl], async ([newUrl, newMediaEl]) => {
  if (!newUrl || !newMediaEl || mediaType.value === 'image') return;

  // Убираем старый HLS
  if (hls.value) {
    hls.value.destroy();
    hls.value = null;
  }

  newMediaEl.src = '';

  // Проверка расширения
  const ext = getMediatExt(newUrl);

  if (Hls.isSupported() && ext === 'm3u8') {
    const instance = new Hls({ enableWorker: true, lowLatencyMode: true });

    // Логи событий для отладки
    instance.on(Hls.Events.MANIFEST_PARSED, () => console.log('[HLS] Manifest parsed'));
    instance.on(Hls.Events.FRAG_LOADING, (e, data) => console.log('[HLS] Loading fragment', data.frag.url));
    instance.on(Hls.Events.FRAG_LOADED, (e, data) => console.log('[HLS] Fragment loaded', data.frag.url));
    instance.on(Hls.Events.ERROR, (event, data) => {
      console.error('[HLS] Error', data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('[HLS] Recovering network error');
            instance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('[HLS] Recovering media error');
            instance.recoverMediaError();
            break;
          default:
            instance.destroy();
            break;
        }
      }
    });

    instance.loadSource(newUrl);
    instance.attachMedia(newMediaEl);
    hls.value = instance;

    // Синхронизация времени
    if (time.value > 0) {
      newMediaEl.currentTime = time.value;
    }
  } else {
    // Для обычных видео (mp4, webm)
    newMediaEl.src = newUrl;

    // Синхронизация времени
    if (time.value > 0) {
      newMediaEl.currentTime = time.value;
    }
  }

  await nextTick();
  videoStore.setVolume(defaultVolume.value);
  videoStore.setSpeed(defaultSpeed.value);
});

const setCurrentTime = () => {
	if (!mediaEl.value || mediaType.value === 'image') return;
	if (currentTimeRef.value && durationTimeRef.value) {
		const distance = getDistanceBetweenElements(currentTimeRef.value, durationTimeRef.value);
		if (distance < 50) {
			showTime.value = false;
		} else {
			showTime.value = true;

		}
	}
	videoStore.setTime(mediaEl.value.currentTime);
};

const generateMetadata = () => {
	if (!mediaEl.value || mediaType.value === 'image') return;
	useTitle(`${videoStore.video?.title} - filu`);
	videoStore.setDuration(mediaEl.value.duration);
	generatePoster();

	if (time.value > 0) {
		mediaEl.value.currentTime = time.value;
	}

	// Автоплей только если не отключен пропсом и включен в настройках
	if (props.autoplay !== false) {
		videoStore.play();
	} else {
		videoStore.pause();
	}
};

// Обновляем element в store для эквалайзера
watch(mediaEl, newEl => {
	if (newEl && mediaType.value !== 'image') {
		videoStore.element = newEl as any;
	}
	// Воспроизвести, если элемент готов и playing=true, но не для PictureInPicture и не для HLS
	if (newEl && mediaType.value !== 'image' && !url.value?.endsWith('.m3u8')) {
		console.log(112312);
		
		newEl.play();
	} 
});

const generatePoster = async () => {
	if (!mediaEl.value) return;

	try {
		const posterUrl = await getPoster(video.value!.path);
		video.value!.cover = posterUrl as any;
		const color = setColorPrimary(posterUrl);
		settingStore.updateSetting('accent-color', color);

		if (mediaEl.value.readyState >= 1) {
			const vid = mediaEl.value as HTMLVideoElement;
			settingStore.setWindowSize(vid.videoWidth, vid.videoHeight);
		}
		return;
	} catch (e) {
		console.warn('Не удалось создать превью с FFmpeg:', e);
	}
};

watch(playing, () => {
	if (!mediaEl.value || mediaType.value === 'image') return;
	mediaEl.value[playing.value ? 'play' : 'pause']();
});

watch(speed, () => {
	if (!mediaEl.value || mediaType.value === 'image') return;
	mediaEl.value.playbackRate = speed.value;
});

watch(time, (newTime) => {
	if (!mediaEl.value || mediaType.value === 'image') return;
	if (Math.abs(mediaEl.value.currentTime - newTime) > 0.5) {
		mediaEl.value.currentTime = newTime;
	}
});

const inlineStyleMediaSettings = computed(() => {
	const set = {
		'hue-rotate': `${settings.value['hue-rotate']}deg`,
		blur: `${settings.value.blur}px`,
		brightness: `${settings.value.brightness}%`,
		contrast: `${settings.value.contrast}%`,
		grayscale: `${settings.value.grayscale}%`,
		invert: `${settings.value.invert}%`,
		opacity: `${settings.value.opacity}%`,
		saturate: `${settings.value.saturate}%`,
		sepia: `${settings.value.sepia}%`,
	};
	const media = {
		'object-fit': videoFit.value,
		transform: settings.value.mirror ? 'scaleX(-1)' : 'none',
	};
	return {
		filter: Object.entries(set)
			.map(([key, value]) => `${key}(${value})`)
			.join(' '),
		...media,
	};
});


async function pickMedia(selected: string) {
  if (!selected) return;

  const extension = selected.split('.').pop()?.split('?').shift()?.toLowerCase();
  const isSameVideo = selected === video.value?.path;

  const browserSupported = [
    'mp4', 'webm', 'ogg', 'mp3',
    'jpg', 'jpeg', 'png', 'gif', 'webp',
  ].includes(extension!);

  if (isSameVideo) {
    videoStore.setTime(0);
    if (mediaEl.value) {
      mediaEl.value.currentTime = 0;
    }
    if (!props.preview) {
      videoStore.play();
      mediaEl.value?.play().catch(() => {});
    }
  } else {
    if (browserSupported) {
      let fileSize = 0;
      try {
        fileSize = await getFileSize(selected);
        const fileSizeGB = fileSize / (1024 * 1024 * 1024);
        if (fileSize > 20 * 1024 * 1024 * 1024) {
          preloadMode.value = 'none';
        } else if (fileSize > 5 * 1024 * 1024 * 1024) {
          preloadMode.value = 'metadata';
        } else {
          preloadMode.value = 'auto';
        }
      } catch {
        preloadMode.value = 'metadata';
      }

      await videoStore.setVideo({
        path: selected,
        title: selected.split(getSep()).pop()!,
        size: fileSize,
      });

      if (!props.preview) {
        await nextTick();
        // дожидаемся пока элемент обновится и источник установится
        mediaEl.value?.play().catch(() => videoStore.play());
      }
    } else {
      const streamSelect = await getVideoStream(selected);
      await videoStore.setVideo({
        path: streamSelect,
        title: selected.split(getSep()).pop()!,
      }, streamSelect);

      if (!props.preview) {
        await nextTick();
        mediaEl.value?.play().catch(() => videoStore.play());
      }
    }
  }
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

const handleControl = () => {
	isVisible.value = true;

	if (timeoutId) clearTimeout(timeoutId);

	timeoutId = setTimeout(() => {
		if (isHover.value) return;
		isVisible.value = false;
		timeoutId = null;
	}, 750);
};

watch(() => videoStore.ended, () => {
  if (mediaType.value === 'video') return;
	if (videoStore.ended) {
		videoStore.next();
	}
});

const debouncedHandleTime = (v: number[] | undefined) => {
	if (mediaType.value === 'image') return;
	videoStore.setTime((v![0] / 100) * duration.value);
	mediaEl.value!.currentTime = time.value;
};

const handleSkip = (sec: number) => {
	if (mediaType.value === 'image') return;
	videoStore.setTime(videoStore.time + sec);
	mediaEl.value!.currentTime = time.value;
};



</script>

<template>
	<Open @select="pickMedia">
		<div
			v-if="!video"
			class="add-player"
			role="button"
			:aria-label="t('filePicker.selectVideo')"
			:tabindex="0"
		>
				<IconLocal class="video-info-conver-plus non-video" icon="material-symbols:add-rounded" />
		</div>
	</Open>
	<div
		:class="{ 'media-wrapper': true, unfound: !video }"
		@click="!props.preview && videoStore.togglePlay()"
		@mousemove="handleControl"
		role="button"
		:aria-label="playing ? t('player.pause') : t('player.play')"
		:tabindex="0"
	>
		<div class="media-player">
			<video
				v-if="url && mediaType === 'video'"
				v-on:timeupdate="setCurrentTime"
				v-on:loadedmetadata="generateMetadata"
				v-on:play="videoStore.play"
				v-on:pause="videoStore.pause"
				v-on:ended="videoStore.markEnded"
				:autoplay="autoplay"
				ref="mediaEl"
				:loop="loopDefault"
				:preload="preloadMode"
				class="media"
				:muted="muted"
				:volume="volume / 100"
				:style="{ ...inlineStyleMediaSettings }"
				autobuffer
				crossorigin="anonymous"
				:aria-label="t('app.name') + ' - ' + t('common.mediaPlayer')"
				role="application"
				aria-describedby="media-controls"
			/>

			<!-- Аудио элемент -->
			<div
				class="audio-container"
				v-if="url && mediaType === 'audio'"
				:aria-label="t('app.name') + ' - ' + t('common.mediaPlayer')"
				role="application"
				aria-describedby="media-controls"
			>
				<audio
					v-on:timeupdate="setCurrentTime"
					v-on:loadedmetadata="generateMetadata"
					v-on:play="videoStore.play"
					v-on:pause="videoStore.pause"
					v-on:ended="videoStore.markEnded"
					ref="mediaEl"
					:src="url"
					crossorigin="anonymous"
					:loop="loopDefault"
					preload="metadata"
					class="media audio-player"
					:muted="muted"
					:volume="volume / 100"
					autobuffer
					aria-hidden="true"
				/>

				<AudioVisualizer v-if="mediaType === 'audio'" />
			</div>

			<div v-if="url && mediaType === 'image'" class="image-container">
				<img
					:src="url"
					:key="url"
					class="media image"
					:style="{ ...inlineStyleMediaSettings }"
					:alt="video?.title || t('common.image')"
					@load="() => {
						if (video?.cover === undefined && url) {
							video!.cover = url;
							setColorPrimary(url);
						}
					}"
				/>
			</div>

			<div
				@click="(e: any) => e.stopPropagation()"
				:class="{ controls: true, 'controls-visible': isVisible || !videoStore.playing }"
				@mouseenter="isHover = true"
				@mouseleave="isHover = false"
				id="media-controls"
				v-if="video"
			>
				<div class="control-wrapper">
					<div class="video-info">
					<Open @select="pickMedia">
						<div class="video-info-conver">
							<img v-if="video.cover" class="video-info-conver-img" :src="video?.cover" :alt="video?.title || t('common.cover')" />
							<IconLocal
								v-else="video.cover"
								icon="mdi:music"
								class="video-info-conver-img-default"
							/>
							<IconLocal
								@click="pickMedia"
								class="video-info-conver-plus"
								icon="material-symbols:add-rounded"
							/>
						</div>
						<div class="video-info-main">
							<div v-if="video?.title" class="video-info-title">
								{{ getFileName(video?.title)  }}
							</div>
							<div v-if="video?.artist" class="video-info-artist">
								{{ video?.artist }}
							</div>
						</div>
						</Open>
					</div>

					<div class="controls-actions">
						<Button
							class="control-action"
							variant="rounded"
							size="sm"
							@click="videoStore.prev"
							:disabled="!videoStore.hasPrev()"
						>
							<IconLocal view-box="0 0 17 17" width="12px" icon="fluent:previous-16-filled" />
						</Button>

						<Button
							v-if="mediaType !== 'image'"
							class="control-action time-skip"
							variant="rounded"
							size="sm"
							@click="handleSkip(-10)"
						>
							<IconLocal view-box="0 0 17 17" width="12px" icon="fluent:skip-back-10-20-filled" />
						</Button>
						<Button
							v-if="mediaType !== 'image'"
							class="control-action control-action-play"
							variant="rounded"
							size="sm"
							@click="videoStore.togglePlay"
						>
							<IconLocal
								:icon="
									playing
										? 'line-md:play-filled-to-pause-transition'
										: 'line-md:pause-to-play-filled-transition'
								"
							/>
						</Button>
						<Button
							v-if="mediaType !== 'image'"
							class="control-action time-skip"
							variant="rounded"
							size="sm"
							@click="handleSkip(10)"
						>
							<IconLocal view-box="0 0 17 17" width="12px" icon="fluent:skip-forward-10-20-filled" />
						</Button>
						<Button
							class="control-action"
							variant="rounded"
							size="sm"
							@click="videoStore.next"
							:disabled="!videoStore.hasNext()"
						>
							<IconLocal view-box="0 0 17 17" width="12px" icon="fluent:next-16-filled" />
						</Button>
					</div>
					<div class="controls-right">
						<VolumeControll
							v-if="mediaType !== 'image'"
							class="volume-controll"
						/>
						<Button
							@click="videoStore.toggleFullscreen()"
							variant="rounded"
							:aria-label="isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen')"
							:aria-pressed="isFullscreen"
						>
							<IconLocal
								v-if="!isFullscreen"
								view-box="0 0 25 25"
								icon="material-symbols:fullscreen-rounded"
							/>
							<IconLocal
								v-if="isFullscreen"
								view-box="0 0 25 25"
								icon="material-symbols:fullscreen-exit-rounded"
							/>
						</Button>
						<Settings />
					</div>
				</div>
				<DownloadDropdown class="download-dropdown"/>
				<div
					v-if="mediaType !== 'image'"
					:class="{ progress: true, 'progress-visible': isHover }"
				>
					<div class="progress-time-wrapper">
						<div></div>
						<div
						ref="durationTimeRef"
							:class="{
								'progress-time progress-time-duration': true,
								hidden: !showTime,
							}"
						>
							{{ formattedTime(duration, 's', 'h:mm:ss') }}
						</div>
					</div>

					<Timeline
						:value="(time / duration) * 100"
						@change="debouncedHandleTime"
						@keydown.left="handleSkip(-5)"
						@keydown.right="handleSkip(5)"
						@keydown.home="handleSkip(-duration)"
						@keydown.end="handleSkip(duration)"
						class="timeline"
						:aria-valuenow="(time / duration) * 100"
						aria-valuemin="0"
						aria-valuemax="100"
						:aria-valuetext="formattedTime(time, 's', 'h:mm:ss')"
						role="slider"
						:aria-label="t('player.seek')"
						:aria-describedby="'media-controls'"
						tabindex="0"
					>
						<div ref="currentTimeRef" class="progress-time progress-time-current" aria-live="polite">
							{{ formattedTime(time, 's', 'h:mm:ss') }}
						</div>
					</Timeline>
				</div>
				<Folder v-if="video" />
			</div>
			<div class="progress-small">
				<div class="remaining-time">
					{{ formattedTime(duration - time, 's', 'mm:ss') }}
				</div>
				<Button
					v-show="mediaType !== 'image'"
					class=""
					size="sm"
					@click="videoStore.togglePlay()"
				>
					<IconLocal
						:icon="
							playing
								? 'line-md:play-filled-to-pause-transition'
								: 'line-md:pause-to-play-filled-transition'
						"
					/>
				</Button>
			</div>

			<!-- Live region for screen readers -->
			<div aria-live="polite" aria-atomic="true" class="sr-only">
				{{ playing ? t('player.play') : t('player.pause') }} - {{ formattedTime(time, 's', 'h:mm:ss') }} / {{ formattedTime(duration, 's', 'h:mm:ss') }}
			</div>
		</div>
	</div>
</template>
<style scoped>
.download-dropdow {
	  position: absolute;
    bottom: 50%;
    transform: translateY(50%);
    left: 38px;
    z-index: 100;
}
.progress-small {
	display: none;
	position: absolute;
	z-index: 10;
	bottom: 6px;
	left: 6px;
	justify-content: space-between;
	width: calc(100% - 12px);
}

.progress-small > .btn {
	padding: 3px;
}

.progress-small > .btn:hover {
	background: var(--background-glass);
}

.remaining-time {
	background: var(--background-glass);
	backdrop-filter: blur(10px);
	border-radius: 6px;
	padding: 4px;
}
.video-info-conver-plus.non-video {
	width: 50px;
	height: 50px;
	opacity: 1;
	aspect-ratio: 1 / 1;
	transition: scale 0.2s ease-in;
	transform-origin: top left;
	cursor: pointer;
}

.video-info-conver:has(.video-info-conver-img-default) {
	width: 40px;
	min-width: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.video-info-conver-plus.non-video:hover {
	scale: 1.1;
}

:global(body:has(.controls-visible) .controls) {
	opacity: 1;
}
:global(body:has(.unfound) .media-player .controls) {
	opacity: 0;
}

:global(body:has(.media-wrapper:not(.unfound)) .header-trigger) {
	opacity: 0;
}

:global(body:has(.controls-visible) .header-trigger) {
	opacity: 1 !important;
}

:global(body:has(.controls-visible) .media-player .controls) {
	opacity: 1 !important;
}

:global(body:has(.controls-visible) .titlebar .controls) {
	opacity: 1 !important;
}

body:has(.media-wrapper:not(.unfound)) .controls {
	opacity: 0;
}

:global(body:has(.media-wrapper:not(.unfound)) .titlebar > .controls) {
	opacity: 0;
	transition: all 0.2s ease-in-out;
}

.header-trigger:hover {
	opacity: 1 !important;
}

.header-trigger.open-menu {
	opacity: 1 !important;
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
	height: 40px;
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

.image-container {
	position: relative;
	z-index: 1;
}

.add-player {
	z-index: 1;
	position: fixed;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
.video-info-main {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 4px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.control-wrapper {
	display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	justify-content: space-between;
	align-items: center;
	width: 69%;
	height: 40px;

}

.control-action {
	opacity: 1;
}

.control-action:disabled {
	opacity: 0;
}

.video-info-conver {
	height: 40px;
	width: 40px;
	min-width: 40px;
	aspect-ratio: 1 / 1;
	position: relative;
	overflow: hidden;
	border-radius: 50%;
}

.video-info {
	height: 40px;
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
    width: 40px;
    height: 40px;
    max-width: 40px;
    max-height: 40px;
		min-width: 40px;
    min-height: 40px;
    object-fit: cover;
    border-radius: 50%;
		font-size: 0;
}

.progress-time-current {
	background-color: var(--background-glass);
	border: 1px solid var(--background);
	padding: 4px;
	border-radius: 6px;
	position: absolute;
	top: -31px;
	left: 50%;
	transform: translateX(-50%);
}

.progress-time-duration {
	background-color: var(--background-glass);
	border: 1px solid var(--background);
	padding: 4px;
	border-radius: 6px;
	opacity: 1;
	transition: all 0.2s ease-in-out;
}

.progress-time-duration.hidden {
	opacity: 0;
}

.media-wrapper {
	width: 100%;
	height: 100%;
	  container-type: inline-size;
  container-name: media;
}

.media {
	width: 100%;
	height: 100%;
	display: block;
	object-fit: cover;
	background: transparent;
	z-index: -1;
}

.audio-player {
	display: none; /* Скрываем аудио элемент, показываем только обложку */
}

.audio-container {
	width: 100%;
	height: 100%;
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
	z-index: 1;
}

.image-container {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background: black;
}

.image {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
}

.media-player {
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
	z-index: 10;
	height: 40px;
}

.controls-actions {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 6px;
	height: 40px;
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

.download {
	position: absolute;
	left: 10px;
	top: 100px;
	z-index: 100000;
}

.unfound .video-info-conver .video-info-conver-img {
	opacity: 0;
}

.unfound .video-info-conver > svg {
	opacity: 1;
}

body:has(.controls) .titlebar {
	opacity: 0;
}

body:has(.controls.controls-visible) .titlebar {
	opacity: 1;
}

@container media (width < 500px) {
	:deep(.download-trigger) {
		display: none !important;
	}
	.control-action:not(.control-action-play) {
		display: none;
	}
	.video-info {
		display: none;
	}

	.controls-right > * {
		display: none !important;
	}

	.controls-right > *.btn.rounded {
		display: none !important;
	}

	.controls-actions {
		width: 100% !important;
	}

	.control-wrapper {
		width: 0%;
	}

	:deep(.folder-trigger) {
		right: 17%;
		transform: translate(0 -17%);
	}

	:deep(.folder-trigger) {
		right: 17%;
		transform: translate(0 -17%);
	}

	:deep(.controls-right > div:first-child) {
		display: block !important;
		position: absolute;
		left: 17%;
		transform: translate(0 17%);
	}
}

@container media (width < 300px) {
	.progress-small {
		display: flex;
	}
	.controls{
		display: none !important;
	}
}

.video-info-title {
	width: 100%;
	display: flex;
	position: relative;
	    mask-image: linear-gradient(to right, white 70%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, white 70%, transparent 100%);
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}



</style>

import { defineStore } from 'pinia';
import { IAudioMetadata } from 'music-metadata';
import { setFullscreen } from '../api/screen';
import { clamp } from '@vueuse/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getFileName } from '../utils/path';
import { getMediaSupportedType, getMediaType } from '../utils/media';

export type Video = {
	id?: string | number;
	path: string;
	title?: string;
	type?: 'video' | 'audio' | 'image';
	cover?: string;
	artist?: string;
	size?: number; // Размер файла в байтах
};

export type Setting = {
	blur: number;
	brightness: number;
	contrast: number;
	grayscale: number;
	'hue-rotate': number;
	invert: number;
	saturate: number;
	sepia: number;
	opacity: number;
	mirror: boolean;
};

type VideoStore = {
	playlist: Video[];
	element: HTMLVideoElement | null;
	video: Video | null;
	url: string | null;
	playing: boolean;
	time: number;
	duration: number;
	volume: number;
	muted: boolean;
	isFullscreen: boolean;
	isRepeat: boolean;
	isShuffle: boolean;
	isAutoPlay: boolean;
	isLoop: boolean;
	ended: boolean;
	speed: number;
	settings: Setting;
	audioContext: MediaElementAudioSourceNode | null;
	metadata: IAudioMetadata | null;
};

export const settingDefault: Setting = {
	blur: 0,
	brightness: 100,
	contrast: 100,
	grayscale: 0,
	'hue-rotate': 0,
	invert: 0,
	saturate: 100,
	sepia: 0,
	opacity: 100,
	mirror: false,
};

const VideoStoreDefault: VideoStore = {
	playlist: [],
	video: null,
	url: null,
	element: null,
	playing: false,
	time: 0,
	speed: 1,
	duration: 0,
	volume: 100,
	muted: false,
	isFullscreen: false,
	isRepeat: false,
	isShuffle: false,
	isAutoPlay: true,
	isLoop: true,
	ended: false,
	settings: settingDefault,
	audioContext: null,
	metadata: null,
};

export const useVideoStore = defineStore('video', {
	state: () => VideoStoreDefault as VideoStore,
	getters: {},
	actions: {
		currentIndex() {
			return this.playlist.findIndex((item) => item.path === this.video?.path);
		},
		hasNext() {
			return (
				this.playlist.length > 0 &&
				this.currentIndex() < this.playlist.length - 1
			);
		},
		hasPrev() {
			return this.playlist.length > 0 && this.currentIndex() > 0;
		},
		async setVideo(video: Video, url?: string) {
			// Определяем тип медиа по расширению
			let mediaType = getMediaSupportedType(video.path);

			this.video = {
				...video,
				type: mediaType == 'unsupported' ? 'video' : mediaType,
				cover: undefined,
			}; // сбрасываем старую обложку
			const safePath = video.path.replace(/\\/g, '/');

			const baseUrl = url
				? url
				: mediaType == 'unsupported'
				? video.path
				: convertFileSrc(safePath);
			console.log('setvideo - ', url);

			this.url = baseUrl;
			this.duration = 0;
			this.time = 0;
			this.playing = false; // Изображения не воспроизводятся
			this.ended = false;

			// Обновляем element в store для эквалайзера
			this.element = null; // Сбросим сначала
		},
		play() {
			this.playing = true;
			this.ended = false;
		},
		setUrl(url: string) {
			this.url = url;
		},
		pause() {
			this.playing = false;
		},

		togglePlay() {
			this.playing = !this.playing;
		},

		async toggleFullscreen(v?: boolean) {
			this.isFullscreen = v ?? !this.isFullscreen;

			await setFullscreen(this.isFullscreen);
		},

		setTime(time: number) {
			this.time = time;
			if (this.duration && time >= this.duration) {
				this.ended = true;
				this.playing = false;
			}
		},

		setSpeed(speed: number) {
			this.speed = speed;
		},

		setDuration(d: number) {
			this.duration = d;
		},

		setVolume(v: number) {
			this.volume = clamp(v, 0, 100);
			if (this.volume > 0 && this.muted) {
				this.muted = false;
			}
		},

		skipForward(sec: number = 10) {
			this.time += sec;
		},

		skipBackward(sec: number = 10) {
			this.time -= sec;
		},

		resetSettings() {
			this.settings = settingDefault;
		},

		toggleMute() {
			this.muted = !this.muted;
		},

		async next() {
			let index = this.playlist.findIndex(
				(item) => item.path === this.video?.path
			);
			if (index == this.playlist.length - 1) {
				index = -1;
			}
			console.log(index, this.playlist[index + 1]);

			if (index !== -1) {
				await this.setVideo(this.playlist[index + 1]);
			}
		},

		async prev() {
			let index = this.playlist.findIndex(
				(item) => item.path === this.video?.path
			);
			if (index == 0) {
				index = this.playlist.length;
			}
			if (index !== -1) {
				await this.setVideo(this.playlist[index - 1]);
			}
		},

		async markEnded() {
			this.ended = true;
			this.playing = false;
		},

		setPlaylist(playlist: string[]) {
			this.playlist = playlist.map((p) => ({
				path: p,
				title: getFileName(p),
			}));
		},
	},
});

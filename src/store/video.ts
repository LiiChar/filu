import { readFile } from '@tauri-apps/plugin-fs';
import { defineStore } from 'pinia';
import { parseBlob } from 'music-metadata';
import { setFullscreen } from '../api/screen';
import { clamp } from '@vueuse/core';

export type Video = {
	id?: string | number;
	path: string;
	title?: string;
	type?: string;
	cover?: string;
	artist?: string;
};

type VideoStore = {
	playlist: Video[];
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
};

const VideoStoreDefault: VideoStore = {
	playlist: [],
	video: null,
	url: null,
	playing: false,
	time: 0,
	duration: 0,
	volume: 100,
	muted: false,
	isFullscreen: false,
	isRepeat: false,
	isShuffle: false,
	isAutoPlay: true,
	isLoop: true,
	ended: false,
};

export const useVideoStore = defineStore('video', {
	state: () => VideoStoreDefault as VideoStore,
	getters: {},
	actions: {
		currentIndex() {
			return this.playlist.findIndex((item) => item.id === this.video?.id);
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
		async setVideo(video: Video) {
			const fileContents = await readFile(video.path);
			const blob = new Blob([fileContents]);
			const metadata = await parseBlob(blob);
			console.log('ts', metadata);

			const url = URL.createObjectURL(blob);

			// Освободить старый url
			if (this.url) {
				URL.revokeObjectURL(this.url);
			}

			if (!video.id) {
				video.id = this.playlist.length;
			}

			this.video = { ...video, cover: undefined }; // сбрасываем старую обложку
			this.url = url;
			this.duration = 0;
			this.time = 0;
			this.playing = true;
			this.ended = false;
		},
		play() {
			this.playing = true;
			this.ended = false;
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

		toggleMute() {
			this.muted = !this.muted;
		},

		async next() {
			let index = this.playlist.findIndex((item) => item.id === this.video?.id);
			if (index == this.playlist.length - 1) {
				index = -1;
			}
			if (index !== -1) {
				await this.setVideo(this.playlist[index + 1]);
			}
		},

		async prev() {
			let index = this.playlist.findIndex((item) => item.id === this.video?.id);
			if (index == 0) {
				index = this.playlist.length;
			}
			if (index !== -1) {
				await this.setVideo(this.playlist[index - 1]);
			}
		},

		markEnded() {
			this.ended = true;
			this.playing = false;
		},
	},
});

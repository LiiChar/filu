import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { defineStore } from 'pinia';

export type Background =
	| 'dither'
	| 'dotGrid'
	| 'faultyTerminal'
	| 'particles'
	| 'pixelBlast';

export type SettingStore = {
	// Внешний вид
	'video-fit': 'contain' | 'cover';
	background: Background;
	'background-speed': number;
	'background-animation-enabled': boolean;
	lang: 'ru' | 'en';
	theme: 'light' | 'dark';
	'font-size': 'small' | 'medium' | 'large';
	'interface-scale': number;
	'accent-color': string;
	'overwriting-accent-color': boolean;

	// Окно
	width: number;
	'video-resize': boolean;
	height: number;
	'window-transparency': number;
	'default-fullscreen': boolean;
	'minimize-to-tray': boolean;

	// Плеер
	'default-volume': number;
	'default-speed': number;
	'auto-play-default': boolean;
	'loop-default': boolean;
	'skip-time': number;
	'animate-background': boolean;
	'buffer-size': number;
	'default-quality': '480p' | '720p' | '1080p' | '4K' | 'original';
	'show-subtitles': boolean;
	'hotkeys-enabled': boolean;
	'audio-visualizer': 'bars' | 'wave' | 'none';

	// Скачивание
	ffmpeg: string;
	'yt-dlp': string;
	cookies: string;
	ffprobe: string;
	'download-quality': '360p' | '480p' | '720p' | '1080p' | '4K' | 'original';
	'output-format': 'mp4' | 'webm' | 'avi';
	'auto-convert': boolean;
	'download-path': string;
};

export const defaultSettingStore: SettingStore = {
	'video-fit': 'cover',
	background: 'particles',
	'background-speed': 0.1,
	'background-animation-enabled': true,
	lang: 'ru',
	width: 800,
	height: 550,
	theme: 'dark',
	'font-size': 'medium',
	'interface-scale': 1,
	'accent-color': '#5ecc5e',
	'overwriting-accent-color': false,
	'window-transparency': 1,
	'default-fullscreen': false,
	'minimize-to-tray': false,
	'default-volume': 100,
	'default-speed': 1,
	'auto-play-default': true,
	'loop-default': true,
	'skip-time': 10,
	'animate-background': true,
	'buffer-size': 10,
	'default-quality': '1080p',
	'show-subtitles': false,
	'hotkeys-enabled': true,
	'audio-visualizer': 'bars',
	'video-resize': true,
	'yt-dlp': '',
	ffmpeg: '',
	cookies: '',
	ffprobe: '',
	'download-quality': '720p',
	'output-format': 'mp4',
	'auto-convert': false,
	'download-path': '',
};

export const useSettingStore = defineStore('setting', {
	state: (): SettingStore => {
		const settings = { ...defaultSettingStore };
		const saved = localStorage.getItem('app-settings');
		if (saved) {
			Object.assign(settings, JSON.parse(saved));
		}
		return settings;
	},

	actions: {
		updateSetting<K extends keyof SettingStore>(
			key: K,
			value: SettingStore[K]
		) {
			(this as any)[key] = value;
		},

		setSize(width: number, height: number) {
			this.width = width;
			this.height = height;
		},

		async setWindowSize(width: number, height: number) {
			if (this['video-resize'] === false) return;
			const aspectRatio = width / height;
			const newWidth = Math.round(this.height * aspectRatio);

			await getCurrentWindow().setSize(
				new LogicalSize({ width: newWidth, height: this.height })
			);
		},

		resetSettings() {
			Object.assign(this, defaultSettingStore);
		},
	},
});

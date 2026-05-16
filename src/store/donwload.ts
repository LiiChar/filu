import { defineStore } from 'pinia';
import { getSep } from '../utils/path';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { downloadVideo, getMetadata, getTitle } from '../api/video';
import { getCurrentProcess } from '../api/process';
import { formattedTime } from '../utils/time';

export type DownloadStatus =
	| 'pending'
	| 'downloading'
	| 'paused'
	| 'completed'
	| 'failed';

export interface DownloadProgress {
	percent: number;
	total: string;
	speed: string;
	ETA: string;
	label: string;
}

export interface DownloadSettings {
	outputPath: string;
	postersPath: string;
	quality: string;
	type: 'video' | 'audio' | 'all' | 'none';
	ext: 'webm' | 'mp4' | 'mp3' | 'mkv';
	isPlaylist: boolean;
	hasMetadata: boolean;
	downloadPoster: boolean;
	downloadPart: boolean;
	partTime: string;
	embedSubs: boolean;
	isContinue: boolean;
}

export interface Download {
	id: string;
	url: string;
	title: string;
	settings: DownloadSettings;
	status: DownloadStatus;
	progress: DownloadProgress;
	log: string;
	startedAt: Date;
	completedAt?: Date;
	error?: string;
	poster?: string;
	metadata?: any;
}

export interface DownloadManagerState {
	downloads: Download[];
	defaultSettings: DownloadSettings;
}

const STORAGE_KEY = 'downloads';
const SETTINGS_KEY = 'download_default_settings';

const defaultProgress: DownloadProgress = {
	percent: 0,
	total: '',
	speed: '',
	ETA: '',
	label: '',
};

const defaultSettings: DownloadSettings = {
	outputPath: '',
	postersPath: '',
	quality: '720p',
	type: 'all',
	ext: 'mp4',
	isPlaylist: false,
	hasMetadata: true,
	downloadPoster: false,
	downloadPart: false,
	partTime: '00:00:00-00:00:00',
	embedSubs: false,
	isContinue: false,
};

const generateId = () =>
	`download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useDownloadStore = defineStore('download', {
	state: (): DownloadManagerState => ({
		downloads: [],
		defaultSettings: { ...defaultSettings },
	}),

	getters: {
		activeDownloads: (state) =>
			state.downloads.filter((d) =>
				['pending', 'downloading', 'paused'].includes(d.status)
			),

		completedDownloads: (state) =>
			state.downloads.filter((d) => d.status === 'completed'),

		failedDownloads: (state) =>
			state.downloads.filter((d) => d.status === 'failed'),

		downloadById: (state) => (id: string) =>
			state.downloads.find((d) => d.id === id),
	},

	actions: {
		formatOptionsForSettings(settings: DownloadSettings) {
			const options: Array<{ value: string; text: string }> = [];
			if (
				settings.type === 'all' ||
				settings.type === 'video' ||
				settings.type === 'none'
			) {
				options.push({ value: 'webm', text: 'webm' });
				options.push({ value: 'mp4', text: 'mp4' });
				options.push({ value: 'mkv', text: 'mkv' });
			}
			if (
				settings.type === 'all' ||
				settings.type === 'audio' ||
				settings.type === 'none'
			) {
				options.push({ value: 'mp3', text: 'mp3' });
			}
			return options;
		},

		resetDownload(id: string) {
			const index = this.downloads.findIndex((d) => d.id === id);
			const dn = this.downloads[index];
			this.downloads[index] = Object.assign(dn, {
				status: 'pending',
				progress: defaultProgress,
				log: '',
				startedAt: new Date(),
			});
		},
		newDownlaodById(id: string) {
			const index = this.downloads.findIndex((d) => d.id === id);
			const dn = this.downloads[index];
			this.downloads[index] = {
				id: dn.id,
				url: '',
				title: '',
				status: 'pending',
				progress: defaultProgress,
				log: '',
				startedAt: new Date(),
				settings: dn.settings,
				metadata: {},
				poster: '',
				error: '',
			};
		},
		stopDownload(downloadId: string) {
			const download = this.downloadById(downloadId);
			if (download) {
				download.status = 'paused';
				// Отправляем событие для остановки процесса в Tauri
				import('@tauri-apps/api/event').then(({ emit }) => {
					emit('download-close-' + downloadId);
				});
			}
			this.saveToStorage();
		},
		resumeDownload(downloadId: string) {
			const download = this.downloadById(downloadId);
			if (download) {
				download.status = 'downloading';
				// Устанавливаем флаг продолжения
				download.settings.isContinue = true;
			}
			this.saveToStorage();
		},
		// Создать новую загрузку с настройками
		createDownload(
			url: string,
			metadata?: any,
			customSettings?: Partial<DownloadSettings>
		): Download {
			const settings = {
				...this.defaultSettings,
				...customSettings,
			};

			const download: Download = {
				id: generateId(),
				url,
				title: metadata?.title || url,
				settings,
				status: 'pending',
				progress: { ...defaultProgress },
				log: '',
				startedAt: new Date(),
				poster: metadata?.thumbnail,
				metadata,
			};

			this.downloads.push(download);
			this.saveToStorage();

			return download;
		},

		// Запустить загрузку
		startDownload(downloadId: string) {
			const download = this.downloadById(downloadId);
			if (download && download.status === 'pending') {
				download.status = 'downloading';
				download.startedAt = new Date();
			}
			this.saveToStorage();
		},

		// Обновить прогресс загрузки по Id
		updateProgressById(
			processId: string,
			progressData: Partial<DownloadProgress>,
			logUpdate?: string
		) {
			const download = this.downloadById(processId);
			if (download) {
				Object.assign(download.progress, progressData);
				if (logUpdate) {
					download.log += logUpdate + '\n';
				}
				this.saveToStorage();
			}
		},

		// Завершить загрузку
		completeDownload(downloadId: string, outputPath?: string) {
			const download = this.downloadById(downloadId);
			if (download) {
				download.status = 'completed';
				download.completedAt = new Date();
				if (outputPath) {
					// Можно сохранить outputPath если нужно
				}
				this.saveToStorage();
			}
		},

		// Ошибка загрузки
		failDownload(downloadId: string, error: string) {
			const download = this.downloadById(downloadId);
			if (download) {
				download.status = 'failed';
				download.error = error;
				download.completedAt = new Date();
				this.saveToStorage();
			}
		},

		// Удалить загрузку
		removeDownload(downloadId: string) {
			const index = this.downloads.findIndex((d) => d.id === downloadId);
			if (index > -1) {
				this.downloads.splice(index, 1);
				this.saveToStorage();
			}
		},

		// Подготовить property объект для API
		getDownloadProperty(download: Download): Record<string, any> {
			const settings = download.settings;

			const property: Record<string, any> = {
				download_id: download.id, // ID для идентификации логов
				quality: settings.quality.replace('p', ''),
				type: settings.type,
				title: download.title,
				ext: settings.ext,
				is_playlist: settings.isPlaylist ? 'true' : 'false',
				has_metadata: settings.hasMetadata ? 'true' : 'false',
				embed_subs: settings.embedSubs ? 'true' : 'false',
				poster: settings.downloadPoster ? 'true' : 'false',
				is_continue: settings.isContinue ? 'true' : 'false',
			};

			// Add output path
			let outputPath = settings.outputPath;
			if (!outputPath.endsWith(getSep())) {
				outputPath += getSep();
			}
			property['output_url'] = outputPath;

			// Add poster path if needed
			if (settings.downloadPoster) {
				let posterPath = settings.postersPath || settings.outputPath;
				if (!posterPath.endsWith(getSep())) {
					posterPath += getSep();
				}
				property['poster_url'] = posterPath;
			}

			// Add section if needed
			if (settings.downloadPart) {
				property['section'] = settings.partTime;
			}

			return property;
		},

		// Обновить настройки конкретной загрузки
		updateDownloadSetting<K extends keyof DownloadSettings>(
			downloadId: string,
			key: K,
			value: DownloadSettings[K]
		) {
			const download = this.downloadById(downloadId);
			if (download) {
				download.settings[key] = value;
				this.validateDownloadSettings(download);
				this.saveToStorage();
			}
		},

		// Валидация настроек
		validateDownloadSettings(download: Download) {
			const settings = download.settings;
			const availableExts = this.formatOptionsForSettings(settings).map(
				(opt) => opt.value
			);

			if (!availableExts.includes(settings.ext)) {
				const defaultExt =
					(availableExts[0] as DownloadSettings['ext']) || 'mp4';
				settings.ext = defaultExt;
			}
		},

		// Обновить путь постера автоматически
		updatePosterPathForDownload(downloadId: string) {
			const download = this.downloadById(downloadId);
			if (
				download &&
				download.settings.downloadPoster &&
				download.settings.postersPath.length === 0
			) {
				download.settings.postersPath = download.settings.outputPath;
				this.saveToStorage();
			}
		},

		// Settings actions для глобальных настроек
		loadSettingsFromStorage() {
			const stored = localStorage.getItem(SETTINGS_KEY);
			if (stored) {
				try {
					const settingsData = JSON.parse(stored);
					Object.assign(this.defaultSettings, settingsData);
				} catch (e) {
					console.error('Failed to load download default settings:', e);
				}
			}
		},

		saveSettingsToStorage() {
			try {
				localStorage.setItem(
					SETTINGS_KEY,
					JSON.stringify(this.defaultSettings)
				);
			} catch (e) {
				console.error('Failed to save download default settings:', e);
			}
		},

		updateDefaultSetting<K extends keyof DownloadSettings>(
			key: K,
			value: DownloadSettings[K]
		) {
			this.defaultSettings[key] = value;
			this.saveSettingsToStorage();
		},

		// Storage actions
		loadFromStorage() {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const data = JSON.parse(stored);
					this.downloads = data
						.map((d: any) => ({
							...d,
							startedAt: new Date(d.startedAt),
							completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
						}))
						.filter((d: any) => d.url);
				} catch (e) {
					console.error('Failed to load downloads:', e);
				}
			}
		},

		saveToStorage() {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.downloads));
			} catch (e) {
				console.error('Failed to save downloads:', e);
			}
		},

		clearHistory() {
			this.downloads = [];
			localStorage.removeItem(STORAGE_KEY);
		},

		// Парсинг прогресса из логов
		parseProgress(downloadId: string, payload: string) {
			let downloading = false;

			try {
				const data = JSON.parse(payload.trim());
				if (typeof data === 'object' && data !== null) {
					const progressUpdate: Partial<DownloadProgress> = {};

					// Parse percentage, remove % and trim
					if (data['progress percentage']) {
						const pStr = data['progress percentage']
							.toString()
							.replace('%', '')
							.trim();
						const p = parseFloat(pStr);
						if (!isNaN(p)) progressUpdate.percent = p;
					}

					// Parse total, skip if N/A
					if (data.total && data.total.toString().trim() !== 'N/A') {
						progressUpdate.total = data.total.toString().trim();
					}

					// Parse speed, trim
					if (data.speed) {
						progressUpdate.speed = data.speed.toString().trim();
					}

					// Parse ETA, skip if Unknown
					if (data.ETA && data.ETA.toString().trim() !== 'Unknown') {
						progressUpdate.ETA = data.ETA.toString().trim();
					}

					downloading = true;

					if (data.message) {
						this.updateProgressById(downloadId, {}, data.message + '\n');
					}

					if (Object.keys(progressUpdate).length > 0) {
						this.updateProgressById(downloadId, progressUpdate);
					}
					return;
				}
			} catch (e) {}

			const lower = payload.toLowerCase();
			let label = '';

			if (
				lower.includes('extracting url') ||
				lower.includes('downloading webpage') ||
				lower.includes('downloading tv client config') ||
				lower.includes('downloading safari player') ||
				lower.includes('extracting')
			) {
				label = 'Подготовка';
			} else if (lower.includes('destination')) {
				label = 'Загрузка видео';
			} else if (
				lower.includes('downloading m3u8') ||
				lower.includes('total fragments')
			) {
				label = 'Подготовка видео';
			} else if (lower.includes('sleeping')) {
				label = 'Подготовка';
			} else if (
				lower.includes('retrying') ||
				lower.includes('fragment not found') ||
				lower.includes('giving up')
			) {
				label = 'Повторная попытка';
			} else if (lower.includes('converting video')) {
				label = 'Конвертация в MP4';
			} else if (lower.includes('not converting')) {
				label = 'Завершено';
			}

			if (downloading) {
				label = 'Загрузка видео';
			}

			if (label || payload.trim()) {
				const progressUpdate: Partial<DownloadProgress> = {};
				if (label) {
					progressUpdate.label = label;
				}
				this.updateProgressById(downloadId, progressUpdate, payload + '\n');
			}
		},

		// Инициализация загрузки незагруженных
		async initializeDownload(downloadId: string): Promise<UnlistenFn | null> {
			const download = this.downloadById(downloadId);
			if (!download) return null;

			if (download.status === 'downloading') {
				this.updateDownloadSetting(downloadId, 'isContinue', true);

				// Слушаем события прогресса
				const unlisten = await listen<string>(
					'progress-' + downloadId,
					(event) => {
						this.parseProgress(downloadId, event.payload);
					}
				);

				// Проверяем, запущен ли процесс
				const process = await getCurrentProcess();
				if (!process.includes(downloadId)) {
					try {
						await downloadVideo(
							download.url,
							this.getDownloadProperty(download)
						);
					} catch (error) {
						console.error('Failed to resume download:', error);
						this.failDownload(
							downloadId,
							error instanceof Error ? error.message : String(error)
						);
					}
				}

				// Возвращаем функцию для отписки
				return unlisten;
			}
			return null;
		},

		// Загрузка мета-данных для URL
		async loadMetadataForDownload(
			downloadId: string,
			url: string
		): Promise<any> {
			const download = this.downloadById(downloadId);
			if (!download) return null;

			try {
				const titleFromUrl = await getTitle(url);
				download.title = titleFromUrl;
				this.saveToStorage();

				const fetchedMetadata = await getMetadata(url);
				download.metadata = fetchedMetadata;

				// Устанавливаем полный диапазон для видео
				const duration = formattedTime(
					fetchedMetadata.duration,
					's',
					'hh:mm:ss'
				);
				this.updateDownloadSetting(
					downloadId,
					'partTime',
					`00:00:00-${duration}`
				);

				if (fetchedMetadata.thumbnail) {
					download.poster = fetchedMetadata.thumbnail;
				}

				this.saveToStorage();
				return fetchedMetadata;
			} catch (error) {
				console.error('Error loading metadata:', error);
				download.metadata = null;
				this.saveToStorage();
				throw error;
			}
		},

		// Настройка всех загрузок при запуске приложения
		async setupDownloads(): Promise<void> {
			// Инициализируем все downloading загрузки
			const downloadingDownloads = this.downloads.filter(
				(d) => d.status === 'downloading'
			);
			for (const download of downloadingDownloads) {
				try {
					await this.initializeDownload(download.id);
				} catch (error) {
					console.error(`Failed to initialize download ${download.id}:`, error);
				}
			}
		},
	},
});

import { BASE_FILE_SERVER_URL } from '../const/path';

export const getMediatExt = (path: string) => {
	return decodeURIComponent(path).split('.').pop()?.split('?').shift()?.toLowerCase();
}

export const getMediaType = (path: string): 'video' | 'audio' | 'image' => {
	const ext = getMediatExt(path);

	if (['mp4', 'webm', 'ogg'].includes(ext || '')) {
		return 'video';
	}

	// Аудио форматы
	if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext || '')) {
		return 'audio';
	}

	// Изображения
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
		return 'image';
	}

	// Видео (по умолчанию)
	return 'video';
};

export const getMediaSupportedType = (
	path: string
): 'video' | 'audio' | 'image' | 'unsupported' => {
	const ext = getMediatExt(path);

	if (['mp4', 'webm', 'ogg'].includes(ext || '')) {
		return 'video';
	}

	// Аудио форматы
	if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext || '')) {
		return 'audio';
	}

	// Изображения
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
		return 'image';
	}

	// Видео (по умолчанию)
	return 'unsupported';
};

export const getServerStreamUrl = (url: string) => {
	if (url.includes(BASE_FILE_SERVER_URL)) return url;
	return `${BASE_FILE_SERVER_URL}file?url=${encodeURIComponent(url)}`;
};

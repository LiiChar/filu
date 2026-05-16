import { invoke } from '@tauri-apps/api/core';
import { VideoMetadata } from '../types/metadata';

export const downloadVideo = async (
	url: string,
	property: Record<string, any>
): Promise<string> => {
	const propertyArray = Object.entries(property); // превращает { a: '1', b: '2' } в [['a','1'],['b','2']]
	return await invoke('download_video', { url, property: propertyArray });
};

export const getMetadata = async (url: string) => {
	const mt = await invoke<string>('get_metadata', { url });
	const metadata: VideoMetadata = JSON.parse(mt.replace('\\\\\\', ''));

	return metadata;
};

export const getTitle = async (url: string) => {
	const title = await invoke<string>('get_title', { url });
	return title;
};

export const getPoster = async (path: string) => {
	let base64 = await invoke<string>('get_video_poster', { path });
	base64 = base64.replace(/\s/g, '');
	return base64;
};

export const getVideoStream = async (url: string) => {
	let stream = await invoke<string>('get_video_stream', { url });
	stream = stream.replace(/\s/g, '');
	return stream;
};

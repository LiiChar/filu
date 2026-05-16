import { invoke } from '@tauri-apps/api/core';

export const getMediaInfo = async (path: string) => {
	return await invoke('get_info', { path });
};

export const openPath = async (path: string) => {
	return await invoke('open_path', { path });
};

export const runFileServer = async () => {
	await invoke('file_server');
};

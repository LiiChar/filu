import { invoke } from '@tauri-apps/api/core';

export const getCurrentProcess = async () => {
	const process = await invoke<string[]>('get_current_process');
	return process;
};

export const getFileSize = async (path: string) => {
	const size = await invoke<number>('get_file_size', { path });
	return size;
};

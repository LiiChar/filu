import { invoke } from '@tauri-apps/api/core';

export const getMediaInfo = async (path: string) => {
	return await invoke('get_info', { path });
};

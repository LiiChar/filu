import { invoke } from '@tauri-apps/api/core';

export const togglePin = async (): Promise<boolean> => {
	return await invoke('toggle_pin');
};

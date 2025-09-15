import { getCurrentWindow } from '@tauri-apps/api/window';

export async function setFullscreen(isFullscreen: boolean) {
	await getCurrentWindow().setFullscreen(isFullscreen);
}

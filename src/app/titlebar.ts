import { getCurrentWindow } from '@tauri-apps/api/window';

export const initTitlebar = () => {
	const appWindow = getCurrentWindow();
	document
		.getElementById('titlebar-minimize')
		?.addEventListener('click', () => appWindow.minimize());
	document
		.getElementById('titlebar-maximize')
		?.addEventListener('click', (e) => {
			appWindow.isAlwaysOnTop().then(async (isPin) => {
				console.log(isPin);
				await appWindow.setAlwaysOnTop(!isPin);
				console.log(e);

				document
					.getElementById('titlebar-maximize')!
					.classList.toggle('is-pin', !isPin);
			});
		});
	document
		.getElementById('titlebar-close')
		?.addEventListener('click', () => appWindow.close());
};

import { initTitlebar } from './titlebar';
import { initTray } from './tray';
import { initWindow } from './window';

export const initApp = async () => {
	initTitlebar();
	await initTray();
	await initWindow();
};

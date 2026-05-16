import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingStore, defaultSettingStore } from '../../store/setting';

describe('useSettingStore', () => {
	let store: ReturnType<typeof useSettingStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		store = useSettingStore();
	});

	it('initializes with default settings', () => {
		expect(store.background).toBe(defaultSettingStore.background);
		expect(store['background-speed']).toBe(
			defaultSettingStore['background-speed']
		);
		expect(store['accent-color']).toBe(defaultSettingStore['accent-color']);
		expect(store['background-animation-enabled']).toBe(
			defaultSettingStore['background-animation-enabled']
		);
	});

	it('updates setting correctly', () => {
		store.updateSetting('background', 'dither');
		expect(store.background).toBe('dither');

		store.updateSetting('background-speed', 0.8);
		expect(store['background-speed']).toBe(0.8);
	});

	it('resets settings to defaults', () => {
		store.updateSetting('background', 'dither');
		store.updateSetting('background-speed', 0.9);
		store.resetSettings();

		expect(store.background).toBe(defaultSettingStore.background);
		expect(store['background-speed']).toBe(
			defaultSettingStore['background-speed']
		);
	});

	it('sets size correctly', () => {
		store.setSize(1920, 1080);
		expect(store.width).toBe(1920);
		expect(store.height).toBe(1080);
	});
});

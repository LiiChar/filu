import { ref, computed, watch, type Ref } from 'vue';
import { useSettingStore } from '../store/setting';

// Import translations statically for now
import ru from '../locales/ru.json';
import en from '../locales/en.json';

export type Ru = typeof ru;
export type En = typeof en;

// Recursively extracts all dot-separated paths from an object type
type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${'' extends P ? '' : '.'}${P}`
		: never
	: never;

type Paths<T, D extends number = 5> = [D] extends [never]
	? never
	: T extends any[]
	? never
	: T extends Record<string, any>
	? {
			[K in keyof T]-?: K extends string | number
				? `${K}` | Join<K, Paths<T[K], D>>
				: never;
	  }[keyof T]
	: '';

type DeepPaths<T> = Paths<T>;

export type TranslationKey = DeepPaths<typeof ru>;

type Translations = {
	[key: string]: any;
};

type Language = 'ru' | 'en';

const translations: Record<Language, Translations> = {
	ru,
	en,
};

let currentLanguage: Ref<Language> = ref('en'); // Default to English

export function useI18n() {
	const settingStore = useSettingStore();

	// Sync with language setting - only watch changes
	watch(
		() => settingStore.lang,
		(newLang) => {
			currentLanguage.value = newLang;
		}
	);

	// Initialize language from settings only once
	if (settingStore.lang === 'ru' || settingStore.lang === 'en') {
		currentLanguage.value = settingStore.lang;
	}

	const t = (key: TranslationKey): string => {
		const keys = key.split('.');
		let value = translations[currentLang.value];

		for (const k of keys) {
			if (value && typeof value === 'object') {
				value = value[k];
			} else {
				return key; // Fallback to key if translation not found
			}
		}

		return typeof value === 'string' ? value : key;
	};

	const setLanguage = (lang: Language) => {
		currentLanguage.value = lang;
		settingStore.updateSetting('lang', lang);
	};

	const currentLang = computed(() => currentLanguage.value);

	const availableLanguages = [
		{ code: 'ru', name: 'Русский' },
		{ code: 'en', name: 'English' },
	];

	return {
		t,
		setLanguage,
		currentLang,
		availableLanguages,
	};
}

import { defineStore } from 'pinia';
import { VNode } from 'vue';

export const defaultToastStore = {
	open: false,
	title: '',
	content: null as string | VNode | null,
};

export type ToastStore = typeof defaultToastStore;

export const useToast = defineStore('toast', {
	state: () => defaultToastStore as ToastStore,
	actions: {
		show(title: string, content: string | VNode) {
			this.title = title;
			this.content = content;
			this.open = true;
		},
		hide() {
			this.open = false;
		},
	},
});

export function showToast(title: string, content: string | VNode = '') {
	useToast().show(title, content);
}

export function hideToast() {
	useToast().hide();
}

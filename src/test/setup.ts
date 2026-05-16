import { vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Create global pinia instance for tests
const pinia = createPinia();
setActivePinia(pinia);

// Mock requestAnimationFrame and cancelAnimationFrame
globalThis.requestAnimationFrame = vi.fn(
	(cb: FrameRequestCallback) =>
		setTimeout(() => cb(performance.now()), 16) as any
);
globalThis.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id));

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
	constructor(_cb: ResizeObserverCallback) {}
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

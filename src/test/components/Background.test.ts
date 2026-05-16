import { describe, it, expect, vi, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Background from '../../components/background/Background.vue';
import { useSettingStore } from '../../store/setting';

// Mock the background components to avoid WebGL issues
vi.mock('../../components/background/Particles.vue', () => ({
	name: 'Particles',
	props: ['speed', 'particleColors', 'disableRotation'],
	template: '<div class="particles-mock"></div>',
	default: {
		name: 'Particles',
		props: ['speed', 'particleColors', 'disableRotation'],
		template: '<div class="particles-mock"></div>',
	},
}));

vi.mock('../../components/background/Dither.vue', () => ({
	name: 'Dither',
	props: ['waveSpeed', 'waveColor', 'disableAnimation'],
	template: '<div class="dither-mock"></div>',
	default: {
		name: 'Dither',
		props: ['waveSpeed', 'waveColor', 'disableAnimation'],
		template: '<div class="dither-mock"></div>',
	},
}));

vi.mock('../../components/background/DotGrid.vue', () => ({
	name: 'DotGrid',
	template: '<div class="dot-grid-mock"></div>',
	default: {
		name: 'DotGrid',
		template: '<div class="dot-grid-mock"></div>',
	},
}));

vi.mock('../../components/background/FaultyTerminal.vue', () => ({
	name: 'FaultyTerminal',
	template: '<div class="faulty-terminal-mock"></div>',
	default: {
		name: 'FaultyTerminal',
		template: '<div class="faulty-terminal-mock"></div>',
	},
}));

vi.mock('../../components/background/PixelBlast.vue', () => ({
	name: 'PixelBlast',
	template: '<div class="pixel-blast-mock"></div>',
	default: {
		name: 'PixelBlast',
		template: '<div class="pixel-blast-mock"></div>',
	},
}));

describe('Background.vue', () => {
	beforeAll(() => {
		setActivePinia(createPinia());
	});

	it('renders without errors', () => {
		const wrapper = mount(Background);
		expect(wrapper.exists()).toBe(true);
	});

	it('renders the correct background component', async () => {
		const wrapper = mount(Background);
		const store = useSettingStore();

		// Test particles background
		store.background = 'particles';
		await wrapper.vm.$nextTick();
		const particlesElement = wrapper.find('.particles-mock');
		expect(particlesElement.exists()).toBe(true);

		// Test dither background
		store.background = 'dither';
		await wrapper.vm.$nextTick();
		const ditherElement = wrapper.find('.dither-mock');
		expect(ditherElement.exists()).toBe(true);
	});

	it('passes correct props to background components', async () => {
		const wrapper = mount(Background);
		const store = useSettingStore();

		store.background = 'particles';
		store['background-speed'] = 0.8;
		store['accent-color'] = '#00ff00';
		store['background-animation-enabled'] = false;
		await wrapper.vm.$nextTick();

		const particlesElement = wrapper.findComponent({ name: 'Particles' });
		expect(particlesElement.props()).toEqual({
			speed: 0.8,
			particleColors: ['#00ff00'],
			disableRotation: true,
		});
	});
});

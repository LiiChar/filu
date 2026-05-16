import { describe, it, expect } from 'vitest';
import {
	softenColor,
	createRadialGradient,
	createSoftRadialGradient,
} from '../../utils/color';

describe('color utils', () => {
	describe('softenColor', () => {
		it('softens RGB color correctly', () => {
			const result = softenColor('rgb(100, 150, 200)', 0.5);
			expect(result).toBe('rgba(50, 75, 100, 1)');
		});

		it('handles RGBA color', () => {
			const result = softenColor('rgba(100, 150, 200, 0.8)', 0.5);
			expect(result).toBe('rgba(50, 75, 100, 0.8)');
		});

		it('uses default factor of 0.5', () => {
			const result = softenColor('rgb(200, 200, 200)');
			expect(result).toBe('rgba(100, 100, 100, 1)');
		});
	});

	describe('createRadialGradient', () => {
		it('creates radial gradient for single color', () => {
			const result = createRadialGradient(['#ff0000']);
			expect(result).toContain('radial-gradient');
			expect(result).toContain('#ff0000');
		});

		it('creates radial gradient for multiple colors', () => {
			const result = createRadialGradient(['#ff0000', '#00ff00', '#0000ff']);
			expect(result).toContain('radial-gradient');
			expect(result).toContain('#ff0000');
			expect(result).toContain('#00ff00');
			expect(result).toContain('#0000ff');
		});
	});

	describe('createSoftRadialGradient', () => {
		it('creates softened radial gradient', () => {
			const result = createSoftRadialGradient(['rgba(255,0,0,1)']);
			expect(result).toContain('radial-gradient');
			expect(result).toContain('rgba');
		});
	});
});

import { describe, it, expect, vi } from 'vitest';
import { smoothRandom } from '../../utils/random';

describe('random utils', () => {
	describe('smoothRandom', () => {
		it('keeps values within bounds', () => {
			expect(smoothRandom(0.5)).toBeGreaterThanOrEqual(0);
			expect(smoothRandom(0.5)).toBeLessThanOrEqual(1);
		});

		it('returns a number', () => {
			const result = smoothRandom(0.5);
			expect(typeof result).toBe('number');
		});

		it('smooths values towards center range', () => {
			const values = Array.from({ length: 1000 }, () => smoothRandom(0.5));
			const average = values.reduce((sum, val) => sum + val, 0) / values.length;
			expect(average).toBeGreaterThan(0.3);
			expect(average).toBeLessThan(0.7);
		});

		it('handles edge values correctly', () => {
			// Test with value close to 0
			const nearZero = smoothRandom(0.01);
			expect(nearZero).toBeGreaterThanOrEqual(0);
			expect(nearZero).toBeLessThanOrEqual(1);

			// Test with value close to 1
			const nearOne = smoothRandom(0.99);
			expect(nearOne).toBeGreaterThanOrEqual(0);
			expect(nearOne).toBeLessThanOrEqual(1);
		});

		it('clamps to bounds', () => {
			// Mock Math.random to return extreme values
			const originalRandom = Math.random;

			// Test upper bound clamp
			Math.random = vi.fn(() => 1); // This would make delta = 0.1
			expect(smoothRandom(0.95, 0.1)).toBe(1);
			expect(smoothRandom(0.96, 0.1)).toBe(1);

			// Test lower bound clamp
			Math.random = vi.fn(() => 0); // This would make delta = -0.1
			expect(smoothRandom(0.04, 0.1)).toBe(0);
			expect(smoothRandom(0.03, 0.1)).toBe(0);

			Math.random = originalRandom;
		});

		it('respects step parameter', () => {
			const smallStepValues = Array.from({ length: 10 }, () =>
				smoothRandom(0.5, 0.01)
			);
			const largeStepValues = Array.from({ length: 10 }, () =>
				smoothRandom(0.5, 0.5)
			);

			// Large step should have more variance
			const smallVariance =
				Math.max(...smallStepValues) - Math.min(...smallStepValues);
			const largeVariance =
				Math.max(...largeStepValues) - Math.min(...largeStepValues);

			expect(largeVariance).toBeGreaterThan(smallVariance);
		});
	});
});

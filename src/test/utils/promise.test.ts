import { describe, it, expect, vi } from 'vitest';
import { wait } from '../../utils/promise';

describe('promise utils', () => {
	describe('wait', () => {
		it('waits for the specified time', async () => {
			const start = Date.now();
			await wait(50);
			const duration = Date.now() - start;
			expect(duration).toBeGreaterThanOrEqual(45);
			expect(duration).toBeLessThan(100); // Allow some tolerance
		});

		it('returns a promise that resolves to undefined', async () => {
			const result = await wait(10);
			expect(result).toBeUndefined();
		});

		it('can be used with vi.useFakeTimers', async () => {
			vi.useFakeTimers();
			const promise = wait(100);
			vi.advanceTimersByTime(100);
			await expect(promise).resolves.toBeUndefined();
			vi.useRealTimers();
		});
	});
});

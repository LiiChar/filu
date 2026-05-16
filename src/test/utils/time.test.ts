import { describe, it, expect } from 'vitest';
import { formattedTime, convertTime } from '../../utils/time';

describe('time utils', () => {
	describe('formattedTime', () => {
		it('formats milliseconds correctly', () => {
			expect(formattedTime(3661000, 'ms', 'hh:mm:ss')).toBe('01:01:01');
			expect(formattedTime(65000, 'ms')).toBe('00:01:05'); // Default format hh:mm:ss
			expect(formattedTime(1000, 'ms', 'ss')).toBe('01');
			expect(formattedTime(1000, 'ms', 'mm:ss')).toBe('00:01');
		});

		it('formats seconds correctly', () => {
			expect(formattedTime(3661, 's', 'hh:mm:ss')).toBe('01:01:01');
			expect(formattedTime(65, 's')).toBe('00:01:05'); // Default format hh:mm:ss
			expect(formattedTime(1, 's', 'ss')).toBe('01');
		});

		it('formats minutes correctly', () => {
			expect(formattedTime(61, 'm', 'hh:mm:ss')).toBe('01:01:00');
			expect(formattedTime(1, 'm')).toBe('00:01:00'); // Default format hh:mm:ss
		});

		it('handles different variants', () => {
			expect(formattedTime(3661000, 'ms', 'h:m:s')).toBe('1:1:1');
			expect(formattedTime(3661000, 'ms', 'mm:ss')).toBe('61:01'); // 3661s = 61m 1s
			expect(formattedTime(65000, 'ms', 'm:ss')).toBe('1:05'); // 65s = 1m 5s
		});

		it('handles milliseconds in format', () => {
			expect(formattedTime(1050, 'ms', 'ss.ms')).toBe('01.050');
			expect(formattedTime(1050, 'ms', 'mm:ss.ms')).toBe('00:01.050');
		});

		it('handles edge cases', () => {
			expect(formattedTime(0, 'ms')).toBe('00:00:00'); // Default format hh:mm:ss
			expect(formattedTime(999, 'ms', 'ss.ms')).toBe('00.999');
		});
	});

	describe('convertTime', () => {
		it('converts between time units correctly', () => {
			expect(convertTime(1000, 'ms', 's')).toBe(1);
			expect(convertTime(1, 's', 'ms')).toBe(1000);
			expect(convertTime(60, 's', 'm')).toBe(1);
			expect(convertTime(1, 'm', 's')).toBe(60);
			expect(convertTime(60, 'm', 'h')).toBe(1);
			expect(convertTime(1, 'h', 'm')).toBe(60);
		});

		it('handles decimal values', () => {
			expect(convertTime(1500, 'ms', 's')).toBe(1.5);
			expect(convertTime(1.5, 's', 'ms')).toBe(1500);
		});

		it('converts complex units', () => {
			expect(convertTime(3661, 's', 'm')).toBe(61.016666666666666);
			expect(convertTime(1, 'h', 'ms')).toBe(3600000);
		});
	});
});

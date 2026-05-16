import { describe, it, expect } from 'vitest';
import { timeRead, isUrl } from '../../utils/text';

describe('text utils', () => {
	describe('timeRead', () => {
		it('calculates reading time correctly', () => {
			expect(timeRead('')).toBe(1); // split gives [''], length 1
			expect(timeRead('word')).toBe(1); // Math.ceil(1/200) = 1
			expect(
				timeRead(
					'This is a test sentence with twenty words in total for testing purposes.'
				)
			).toBe(1); // ~20 words
			const manyWords = 'word '.repeat(400).trim();
			expect(timeRead(manyWords)).toBe(2); // 400 words / 200 = 2
		});

		it('handles different word counts', () => {
			// 200 words should be 1 minute
			const text200 = 'word '.repeat(200).trim();
			expect(timeRead(text200)).toBe(1);

			// 400 words should be 2 minutes
			const text400 = 'word '.repeat(400).trim();
			expect(timeRead(text400)).toBe(2);

			// 201 words should be 2 minutes (ceil)
			const text201 = 'word '.repeat(201).trim();
			expect(timeRead(text201)).toBe(2);
		});
	});

	describe('isUrl', () => {
		it('validates URLs correctly', () => {
			expect(isUrl('')).toBe(false);
			expect(isUrl('not-a-url')).toBe(false);
			expect(isUrl('http://example.com')).toBe(true);
			expect(isUrl('https://example.com')).toBe(true);
			expect(isUrl('example.com')).toBe(true);
			expect(isUrl('www.example.com')).toBe(true);
			expect(isUrl('https://sub.example.com/path')).toBe(true);
			expect(isUrl('http://example.com:8080')).toBe(false); // regex doesn't support ports
			expect(isUrl('invalid://example.com')).toBe(false);
			expect(isUrl('example')).toBe(false);
		});
	});
});

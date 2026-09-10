import { truncateText, chunkText, escapeHTML } from '../src/shared/utils';

describe('Shared Utils', () => {
  test('truncateText should truncate text if it exceeds maxLength', () => {
    const text = 'Hello world';
    expect(truncateText(text, 5)).toBe('Hello...');
    expect(truncateText(text, 20)).toBe('Hello world');
  });

  test('chunkText should divide text into chunks of specified size', () => {
    const text = 'abcdefghij';
    expect(chunkText(text, 3)).toEqual(['abc', 'def', 'ghi', 'j']);
  });

  test('escapeHTML should escape special characters', () => {
    const text = '<script>alert("XSS")</script>';
    const escaped = escapeHTML(text);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
  });
});

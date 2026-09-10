import { describe, it, expect } from 'vitest';
import { PageReader } from '../src/content/page-reader.js';

describe('PageReader', () => {
  it('should extract content from basic HTML', async () => {
    document.body.innerHTML = `
      <nav>Noise</nav>
      <main>
        <h1>Main Title</h1>
        <p>Important content 1</p>
        <p>Important content 2</p>
      </main>
      <footer>Noise</footer>
    `;

    const content = await PageReader.extractContent();
    expect(content).toContain('Main Title');
    expect(content).toContain('Important content 1');
    expect(content).toContain('Important content 2');
    expect(content).not.toContain('Noise');
  });

  it('should truncate content to max length', async () => {
    document.body.innerHTML = `<p>${'a'.repeat(40000)}</p>`;
    const content = await PageReader.extractContent(100);
    expect(content.length).toBeLessThanOrEqual(100);
  });
});

export class PageReader {
  static async extractContent(maxChars: number = 30000): Promise<string> {
    const title = document.title;
    const url = window.location.href;

    // Select main content areas and ignore noise
    const noiseSelectors = [
      'nav', 'footer', 'header', 'aside', '.ads', '.sidebar',
      '#footer', '#header', '.cookie-banner', '.popup',
      'script', 'style', 'noscript'
    ];

    const elements = Array.from(document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td'));
    let content = '';

    for (const el of elements) {
      if (this.isNoise(el, noiseSelectors)) continue;
      content += el.textContent?.trim() + '\\n';
    }

    const fullContent = `Title: ${title}\\nURL: ${url}\\n\\nContent:\\n${content}`;
    return fullContent.substring(0, maxChars);
  }

  private static isNoise(el: Element, noiseSelectors: string[]): boolean {
    for (const selector of noiseSelectors) {
      if (el.closest(selector)) return true;
    }
    return false;
  }
}

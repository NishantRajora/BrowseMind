export class PageReader {
  static extractReadableContent(): string {
    const elementsToIgnore = [
      'nav', 'footer', 'header', 'aside', '.ads', '.sidebar',
      '.cookie-banner', '.popup', '.social-widgets', '.comments',
      'script', 'style', 'form'
    ];

    const body = document.body.cloneNode(true) as HTMLElement;

    elementsToIgnore.forEach(selector => {
      const matches = body.querySelectorAll(selector);
      matches.forEach(el => el.remove());
    });

    // Remove hidden elements
    const allElements = body.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseInt(style.opacity) === 0) {
        el.remove();
      }
    });

    return body.innerText.trim();
  }
}

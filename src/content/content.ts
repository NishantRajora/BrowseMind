import { PageReader } from './page-reader.js';
import { Storage } from '../shared/storage.js';
import { UserPreferences } from '../shared/types.js';
import { escapeHTML } from '../shared/utils.js';

class BrowseMindUI {
  private floatingButton: HTMLButtonElement | null = null;
  private responsePanel: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    this.setupSelectionListener();
    this.setupMessageListener();
  }

  private setupSelectionListener() {
    document.addEventListener('mouseup', async () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      const prefs = await Storage.getPreferences();
      if (!prefs.enabled || !selectedText) {
        this.removeFloatingButton();
        return;
      }

      this.showFloatingButton(selection);
    });

    document.addEventListener('mousedown', (e) => {
      if (this.floatingButton && e.target !== this.floatingButton) {
        this.removeFloatingButton();
      }
    });
  }

  private showFloatingButton(selection: Selection) {
    this.removeFloatingButton();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    this.floatingButton = document.createElement('button');
    this.floatingButton.textContent = 'Send to AI';
    this.floatingButton.className = 'bm-floating-button';

    // Position the button near the selection
    this.floatingButton.style.position = 'fixed';
    this.floatingButton.style.top = `${rect.top - 30}px`;
    this.floatingButton.style.left = `${rect.left + (rect.width / 2)}px`;
    this.floatingButton.style.transform = 'translateX(-50%)';
    this.floatingButton.style.zIndex = '10000';

    this.floatingButton.onclick = () => {
      const text = selection.toString().trim();
      chrome.runtime.sendMessage({
        action: 'send-selected-text',
        payload: text,
      });
      this.removeFloatingButton();
    };

    document.body.appendChild(this.floatingButton);
  }

  private removeFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
  }

  private async createResponsePanel() {
    if (this.responsePanel) return;

    const container = document.createElement('div');
    container.id = 'bm-response-container';
    document.body.appendChild(container);

    this.shadowRoot = container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: 350px;
        max-height: 500px;
        z-index: 10001;
        font-family: system-ui, -apple-system, sans-serif;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
      }
      .panel {
        background: var(--bm-bg, #fff);
        color: var(--bm-text, #333);
        border: 1px solid var(--bm-border, #ddd);
        display: flex;
        flex-direction: column;
        max-height: 500px;
      }
      .header {
        padding: 12px;
        background: var(--bm-header-bg, #f5f5f5);
        border-bottom: 1px solid var(--bm-border, #ddd);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
      .close-btn {
        cursor: pointer;
        border: none;
        background: none;
        font-size: 20px;
        color: inherit;
      }
      .content {
        padding: 15px;
        overflow-y: auto;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-style: italic;
      }
      .error {
        color: #d32f2f;
        padding: 15px;
        font-weight: 500;
      }
    `;
    this.shadowRoot.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'panel';

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `<span>BrowseMind</span><button class="close-btn">&times;</button>`;

    const content = document.createElement('div');
    content.className = 'content';

    panel.appendChild(header);
    panel.appendChild(content);
    this.shadowRoot.appendChild(panel);

    header.querySelector('.close-btn')?.addEventListener('click', () => {
      container.remove();
      this.responsePanel = null;
      this.shadowRoot = null;
    });

    this.responsePanel = panel;
    this.applyTheme();
  }

  private async applyTheme() {
    const prefs = await Storage.getPreferences();
    let theme = prefs.theme;
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const root = this.shadowRoot;
    if (!root) return;

    const colors = theme === 'dark'
      ? { bg: '#222', text: '#eee', border: '#444', headerBg: '#333' }
      : { bg: '#fff', text: '#333', border: '#ddd', headerBg: '#f5f5f5' };

    root.style.setProperty('--bm-bg', colors.bg);
    root.style.setProperty('--bm-text', colors.text);
    root.style.setProperty('--bm-border', colors.border);
    root.style.setProperty('--bm-header-bg', colors.headerBg);
  }

  private showResponse(text: string) {
    this.createResponsePanel();
    const contentEl = this.shadowRoot?.querySelector('.content');
    if (contentEl) {
      contentEl.innerHTML = escapeHTML(text);
    }
  }

  private showError(error: any) {
    this.createResponsePanel();
    const contentEl = this.shadowRoot?.querySelector('.content');
    if (contentEl) {
      contentEl.innerHTML = `<div class="error">Error: ${error.message || 'An unknown error occurred'}</div>`;
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.action === 'show-response') {
        this.showResponse(message.response.content);
      } else if (message.action === 'show-error') {
        this.showError(message.error);
      }
    });

    // Handle start-scan from background context menu
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'start-scan') {
        PageReader.extractContent().then(content => {
          sendResponse({ content });
        });
        return true;
      }
    });
  }
}

new BrowseMindUI();

import { PageReader } from './page-reader';
import { escapeHTML, truncateText } from '../shared/utils';
import { getSettings } from '../shared/storage';

class ContentScript {
  private askAIButton: HTMLElement | null = null;
  private responsePanel: HTMLElement | null = null;
  private currentSelection: string = '';

  constructor() {
    this.init();
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .bm-response-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 600px;
        z-index: 10001;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: sans-serif;
        transition: all 0.3s ease;
      }
      .bm-theme-light { background: white; color: #333; border: 1px solid #ccc; }
      .bm-theme-dark { background: #222; color: #eee; border: 1px solid #444; }
      .bm-panel-header {
        padding: 10px 16px;
        background: rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        border-bottom: 1px solid rgba(0,0,0,0.1);
      }
      .bm-theme-dark .bm-panel-header { background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); }
      .bm-panel-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
      }
      .bm-panel-content {
        padding: 16px;
        overflow-y: auto;
        line-height: 1.5;
      }
      .bm-ask-ai-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .bm-error { color: #dc3545; font-weight: bold; }
    `;
    document.head.appendChild(style);
  }

  async init() {
    document.addEventListener('mouseup', () => this.handleSelection());
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_CONTENT') {
        sendResponse({ content: PageReader.extractReadableContent() });
      } else if (message.type === 'AI_RESPONSE') {
        this.showResponsePanel('Thinking...');
        this.updateResponsePanel(message.data.text, message.data.error);
      }
    });
  }

  async handleSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text) {
      this.removeAskAIButton();
      return;
    }

    const settings = await getSettings();
    if (!settings.enabled) return;

    this.currentSelection = text;
    this.showAskAIButton(selection);
  }

  handleMouseDown(e: MouseEvent) {
    if (this.askAIButton && this.askAIButton.contains(e.target as Node)) return;
    if (this.responsePanel && this.responsePanel.contains(e.target as Node)) return;

    this.removeAskAIButton();
  }

  showAskAIButton(selection: Selection) {
    this.removeAskAIButton();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    this.askAIButton = document.createElement('button');
    this.askAIButton.innerText = 'Ask AI';
    this.askAIButton.className = 'bm-ask-ai-btn';
    this.askAIButton.style.position = 'fixed';
    this.askAIButton.style.top = `${rect.top + window.scrollY - 30}px`;
    this.askAIButton.style.left = `${rect.left + window.scrollX}px`;
    this.askAIButton.style.zIndex = '10000';

    this.askAIButton.onclick = () => {
      this.sendAIRequest('ASK', this.currentSelection, 'What does this mean?');
      this.removeAskAIButton();
    };

    document.body.appendChild(this.askAIButton);
  }

  removeAskAIButton() {
    if (this.askAIButton) {
      this.askAIButton.remove();
      this.askAIButton = null;
    }
  }

  async sendAIRequest(type: 'ASK' | 'EXPLAIN' | 'ANALYZE', text: string, question?: string) {
    this.showResponsePanel('Thinking...');

    chrome.runtime.sendMessage({
      type: 'AI_REQUEST',
      data: { type, text, question }
    }, (response) => {
      if (chrome.runtime.lastError) {
        this.updateResponsePanel('Error: ' + chrome.runtime.lastError.message);
        return;
      }
      this.updateResponsePanel(response.text, response.error);
    });
  }

  showResponsePanel(text: string) {
    if (!this.responsePanel) {
      this.responsePanel = document.createElement('div');
      this.responsePanel.className = 'bm-response-panel';
      this.responsePanel.innerHTML = `
        <div class="bm-panel-header">
          <span>BrowseMind</span>
          <button class="bm-panel-close">×</button>
        </div>
        <div class="bm-panel-content"></div>
      `;

      this.responsePanel.querySelector('.bm-panel-close')?.addEventListener('click', () => {
        this.responsePanel?.remove();
        this.responsePanel = null;
      });

      document.body.appendChild(this.responsePanel);
    }
    this.updateResponsePanel(text);
  }

  updateResponsePanel(text: string, error?: string) {
    const content = this.responsePanel?.querySelector('.bm-panel-content');
    if (!content) return;

    // Apply theme
    getSettings().then(settings => {
      const theme = settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;

      if (this.responsePanel) {
        this.responsePanel.className = `bm-response-panel bm-theme-${theme}`;
      }
    });

    if (error) {
      content.innerHTML = `<div class="bm-error">${escapeHTML(error)}</div>`;
    } else {
      content.innerHTML = `<div class="bm-text">${escapeHTML(text)}</div>`;
    }
  }
}

new ContentScript();

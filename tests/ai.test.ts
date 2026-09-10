import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../src/ai/ai-service.js';
import { Storage } from '../src/shared/storage.js';

vi.mock('../src/shared/storage.js');

describe('AIService', () => {
  it('should construct a user prompt correctly for selected-text', async () => {
    const aiService = new AIService();
    const request = {
      action: 'selected-text',
      payload: 'Who is the CEO of Apple?',
      context: {
        pageTitle: 'Apple Home',
        pageUrl: 'https://apple.com',
        selectedText: 'Who is the CEO of Apple?',
      },
    };

    // We need to access the private method constructUserPrompt.
    // For testing, we can cast to any.
    const prompt = (aiService as any).constructUserPrompt(request);
    expect(prompt).toContain('Page Title: Apple Home');
    expect(prompt).toContain('Page URL: https://apple.com');
    expect(prompt).toContain('Question/Text to Analyze:\nWho is the CEO of Apple?');
  });

  it('should construct a user prompt correctly for scan-page', async () => {
    const aiService = new AIService();
    const request = {
      action: 'scan-page',
      payload: 'Summarize this page',
      context: {
        pageTitle: 'News Page',
        pageUrl: 'https://news.com',
        webpageContent: 'This is the main content of the page.',
      },
    };

    const prompt = (aiService as any).constructUserPrompt(request);
    expect(prompt).toContain('Webpage Content:\nThis is the main content of the page.');
  });
});

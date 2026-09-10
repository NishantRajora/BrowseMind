import { AIProviderType } from './types.js';

export const DEFAULT_CONFIG = {
  provider: 'ollama' as AIProviderType,
  ollama: {
    url: 'http://localhost:11434',
    model: 'llama3.2',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
  },
};

export const DEFAULT_PREFERENCES = {
  enabled: true,
  theme: 'system' as const,
  responseStyle: 'normal' as const,
  maxWebpageText: 30000,
  debugMode: false,
};

export const MAX_DEBUG_LOGS = 50;

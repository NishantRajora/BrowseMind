import { ExtensionSettings, AIProvider } from './types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  apiUrl: '',
  apiKey: '',
  apiModel: '',
  theme: 'system',
  responseStyle: 'normal',
  maxText: 30000,
};

export const STORAGE_KEY = 'browsemind_settings';

export const ERROR_TYPES = {
  CONFIGURATION: 'CONFIGURATION',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNKNOWN: 'UNKNOWN',
} as const;

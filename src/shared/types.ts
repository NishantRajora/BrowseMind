export type AIProviderType = 'ollama' | 'openai';

export interface ProviderConfig {
  provider: AIProviderType;
  ollama: {
    url: string;
    model: string;
  };
  openai: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
}

export interface UserPreferences {
  enabled: boolean;
  theme: 'system' | 'light' | 'dark';
  responseStyle: 'concise' | 'normal' | 'detailed';
  maxWebpageText: number;
  debugMode: boolean;
}

export interface AIRequest {
  action: 'selected-text' | 'scan-page';
  payload: string;
  context: {
    pageTitle: string;
    pageUrl: string;
    selectedText?: string;
    webpageContent?: string;
  };
}

export interface AIResponse {
  content: string;
  duration: number;
  status: number;
}

export type AIErrorType =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export interface AIError {
  type: AIErrorType;
  message: string;
  details?: any;
}

export interface DebugLogEntry {
  id: number;
  timestamp: number;
  request: AIRequest;
  provider: AIProviderType;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  status: string;
  duration: number;
  success: boolean;
  error?: AIError;
}

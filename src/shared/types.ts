export type AIProvider = 'ollama' | 'openai';

export interface ExtensionSettings {
  enabled: boolean;
  provider: AIProvider;
  ollamaUrl: string;
  ollamaModel: string;
  apiUrl: string;
  apiKey: string;
  apiModel: string;
  theme: 'system' | 'light' | 'dark';
  responseStyle: 'concise' | 'normal' | 'detailed';
  maxText: number;
}

export interface AIRequest {
  prompt: string;
  context?: string;
}

export interface AIResponse {
  text: string;
  error?: string;
}

export interface MessagePayload {
  type: string;
  data: any;
}

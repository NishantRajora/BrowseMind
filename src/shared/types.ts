export interface ExtensionSettings {
  enabled: boolean;
  provider: "ollama" | "api";
  ollamaUrl: string;
  ollamaModel: string;
  apiUrl: string;
  apiKey: string;
  apiModel: string;
  theme: "system" | "light" | "dark";
  responseStyle: "concise" | "normal" | "detailed";
  maxText: number;
  debugMode: boolean;
}

export interface OllamaConfig {
  url: string;
  model: string;
}

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AIProvider {
  generate(prompt: string, maxTokens?: number): Promise<string>;
  testConnection(): Promise<void>;
  testAI(): Promise<boolean>;
}

export interface DebugInfo {
  provider: string;
  endpoint: string;
  model: string;
  request: any;
  status: number;
  response: any;
  durationMs: number;
  error?: string;
}

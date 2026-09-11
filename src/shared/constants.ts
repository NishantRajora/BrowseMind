export const SETTINGS_KEYS = {
  ENABLED: "enabled",
  PROVIDER: "provider",
  OLLAMA_URL: "ollamaUrl",
  OLLAMA_MODEL: "ollamaModel",
  API_URL: "apiUrl",
  API_KEY: "apiKey",
  API_MODEL: "apiModel",
  THEME: "theme",
  RESPONSE_STYLE: "responseStyle",
  MAX_TEXT: "maxText",
  DEBUG_MODE: "debugMode"
} as const;

export const DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama", // "ollama" | "api"
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "gpt-oss:120b",
  apiUrl: "",
  apiKey: "",
  apiModel: "",
  theme: "system", // "system" | "light" | "dark"
  responseStyle: "normal", // "concise" | "normal" | "detailed"
  maxText: 30000,
  debugMode: false
} as const;

export const SETTINGS_KEYS = {
  ENABLED: "enabled",
  PROVIDER: "provider",
  OLLAMA_URL: "ollamaUrl",
  OLLAMA_MODEL: "ollamaModel",
  OLLAMA_API_KEY: "ollamaApiKey",
  API_URL: "apiUrl",
  API_KEY: "apiKey",
  API_MODEL: "apiModel",
  THEME: "theme",
  RESPONSE_STYLE: "responseStyle",
  MAX_TEXT: "maxText",
  DEBUG_MODE: "debugMode",
  FONT_SIZE: "fontSize",
  PANEL_OPACITY: "panelOpacity",
  PANEL_POSITION: "panelPosition",
  TAB_HOTKEY: "tabHotkey",
  CAMOUFLAGE_MODE: "camouflageMode"
} as const;

export const DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama", // "ollama" | "api"
  ollamaUrl: "https://ollama.com",
  ollamaModel: "gemma4:31b",
  ollamaApiKey: "",
  apiUrl: "https://ollama.com/v1",
  apiKey: "",
  apiModel: "gemma4:31b",
  theme: "system", // "system" | "light" | "dark"
  responseStyle: "keypoints", // "keypoints" | "concise" | "normal" | "detailed"
  maxText: 30000,
  debugMode: false,
  fontSize: 13,
  panelOpacity: 80,
  panelPosition: "left", // "left" | "right"
  tabHotkey: true,
  camouflageMode: false
} as const;

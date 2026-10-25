// src/shared/constants.ts
var DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama",
  // "ollama" | "api"
  ollamaUrl: "https://ollama.com",
  ollamaModel: "gemma4:31b",
  ollamaApiKey: "",
  apiUrl: "https://ollama.com/v1",
  apiKey: "",
  apiModel: "gemma4:31b",
  theme: "system",
  // "system" | "light" | "dark"
  responseStyle: "keypoints",
  // "keypoints" | "concise" | "normal" | "detailed"
  maxText: 3e4,
  debugMode: false,
  fontSize: 13,
  panelOpacity: 80,
  panelPosition: "left",
  // "left" | "right"
  tabHotkey: true,
  camouflageMode: false
};

// src/shared/storage.ts
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      resolve({ ...DEFAULT_SETTINGS, ...items });
    });
  });
}
async function setSettings(partial) {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, () => resolve());
  });
}
export {
  getSettings,
  setSettings
};
//# sourceMappingURL=storage.js.map

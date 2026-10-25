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
  tabHotkey: true
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

// src/options/options.ts
document.addEventListener("DOMContentLoaded", async () => {
  const enabledEl = document.getElementById("enabled");
  const tabHotkeyEl = document.getElementById("tabHotkey");
  const themeEl = document.getElementById("theme");
  const responseStyleEl = document.getElementById("responseStyle");
  const panelPositionEl = document.getElementById("panelPosition");
  const fontSizeEl = document.getElementById("fontSize");
  const panelOpacityEl = document.getElementById("panelOpacity");
  const opacityValEl = document.getElementById("opacityVal");
  const debugModeEl = document.getElementById("debugMode");
  const providerSelectEl = document.getElementById("providerSelect");
  const ollamaDiv = document.getElementById("ollamaSettings");
  const apiDiv = document.getElementById("apiSettings");
  const ollamaUrlEl = document.getElementById("ollamaUrl");
  const ollamaApiKeyEl = document.getElementById("ollamaApiKey");
  const ollamaModelSelect = document.getElementById("ollamaModel");
  const apiUrlEl = document.getElementById("apiUrl");
  const apiKeyEl = document.getElementById("apiKey");
  const apiModelEl = document.getElementById("apiModel");
  const refreshBtn = document.getElementById("refreshModelsBtn");
  const testBtn = document.getElementById("testAiBtn");
  const testResultDiv = document.getElementById("testResult");
  const settings = await getSettings();
  enabledEl.checked = settings.enabled;
  tabHotkeyEl.checked = settings.tabHotkey ?? true;
  themeEl.value = settings.theme;
  responseStyleEl.value = settings.responseStyle;
  panelPositionEl.value = settings.panelPosition ?? "left";
  fontSizeEl.value = String(settings.fontSize ?? 13);
  const curOpacity = settings.panelOpacity ?? 80;
  panelOpacityEl.value = String(curOpacity);
  if (opacityValEl)
    opacityValEl.textContent = `${curOpacity}%`;
  debugModeEl.checked = settings.debugMode;
  providerSelectEl.value = settings.provider;
  ollamaUrlEl.value = settings.ollamaUrl;
  ollamaApiKeyEl.value = settings.ollamaApiKey || "";
  panelOpacityEl.addEventListener("input", () => {
    if (opacityValEl)
      opacityValEl.textContent = `${panelOpacityEl.value}%`;
  });
  if (settings.ollamaModel) {
    const opt = document.createElement("option");
    opt.value = settings.ollamaModel;
    opt.textContent = settings.ollamaModel;
    opt.selected = true;
    ollamaModelSelect.appendChild(opt);
  }
  ollamaModelSelect.value = settings.ollamaModel;
  apiUrlEl.value = settings.apiUrl;
  apiKeyEl.value = settings.apiKey;
  apiModelEl.value = settings.apiModel;
  function updateProviderUI() {
    if (providerSelectEl.value === "ollama") {
      ollamaDiv.style.display = "block";
      apiDiv.style.display = "none";
    } else {
      ollamaDiv.style.display = "none";
      apiDiv.style.display = "block";
    }
  }
  providerSelectEl.addEventListener("change", updateProviderUI);
  updateProviderUI();
  const inputs = [
    enabledEl,
    tabHotkeyEl,
    themeEl,
    responseStyleEl,
    panelPositionEl,
    fontSizeEl,
    panelOpacityEl,
    debugModeEl,
    providerSelectEl,
    ollamaUrlEl,
    ollamaApiKeyEl,
    ollamaModelSelect,
    apiUrlEl,
    apiKeyEl,
    apiModelEl
  ];
  inputs.forEach((el) => {
    el.addEventListener("change", async () => {
      const newSettings = {
        enabled: enabledEl.checked,
        tabHotkey: tabHotkeyEl.checked,
        theme: themeEl.value,
        responseStyle: responseStyleEl.value,
        panelPosition: panelPositionEl.value,
        fontSize: parseInt(fontSizeEl.value, 10) || 13,
        panelOpacity: parseInt(panelOpacityEl.value, 10) || 80,
        debugMode: debugModeEl.checked,
        provider: providerSelectEl.value,
        ollamaUrl: ollamaUrlEl.value.trim(),
        ollamaApiKey: ollamaApiKeyEl.value.trim(),
        ollamaModel: ollamaModelSelect.value,
        apiUrl: apiUrlEl.value.trim(),
        apiKey: apiKeyEl.value.trim(),
        apiModel: apiModelEl.value.trim()
      };
      await setSettings(newSettings);
    });
  });
  async function refreshModels() {
    const url = ollamaUrlEl.value.trim() || "http://localhost:11434";
    const apiKey = ollamaApiKeyEl.value.trim();
    testResultDiv.textContent = "Fetching models...";
    testResultDiv.style.color = "inherit";
    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "GET_OLLAMA_MODELS", url, apiKey },
        resolve
      );
    });
    if (resp?.error) {
      testResultDiv.textContent = `\u274C Model fetch error: ${resp.error}`;
      testResultDiv.style.color = "red";
      return;
    }
    const currentModel = ollamaModelSelect.value || settings.ollamaModel;
    const models = (resp?.models || []).map((m) => m.name);
    ollamaModelSelect.innerHTML = "";
    if (models.length === 0) {
      if (currentModel) {
        const opt = document.createElement("option");
        opt.value = currentModel;
        opt.textContent = currentModel;
        ollamaModelSelect.appendChild(opt);
      }
      testResultDiv.textContent = "\u26A0\uFE0F No models found on server.";
      testResultDiv.style.color = "orange";
      return;
    }
    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      ollamaModelSelect.appendChild(opt);
    });
    if (currentModel && models.includes(currentModel)) {
      ollamaModelSelect.value = currentModel;
    } else if (models.length > 0) {
      ollamaModelSelect.value = models[0];
    }
    await setSettings({ ollamaModel: ollamaModelSelect.value });
    testResultDiv.textContent = `\u2705 Loaded ${models.length} model(s)`;
    testResultDiv.style.color = "green";
  }
  refreshBtn.addEventListener("click", (e) => {
    e.preventDefault();
    refreshModels();
  });
  testBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    testResultDiv.textContent = "Testing...";
    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "TEST_AI" }, resolve);
    });
    if (resp?.success) {
      testResultDiv.textContent = "\u2705 AI works!";
      testResultDiv.style.color = "green";
    } else {
      testResultDiv.textContent = `\u274C Failed: ${resp?.error ?? "unknown"}`;
      testResultDiv.style.color = "red";
    }
  });
  if (settings.provider === "ollama") {
    refreshModels();
  }
});
//# sourceMappingURL=options.js.map

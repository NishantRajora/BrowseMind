// src/shared/constants.ts
var DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama",
  // "ollama" | "api"
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "gpt-oss:120b",
  apiUrl: "",
  apiKey: "",
  apiModel: "",
  theme: "system",
  // "system" | "light" | "dark"
  responseStyle: "normal",
  // "concise" | "normal" | "detailed"
  maxText: 3e4,
  debugMode: false
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
  const themeEl = document.getElementById("theme");
  const responseStyleEl = document.getElementById("responseStyle");
  const debugModeEl = document.getElementById("debugMode");
  const providerSelectEl = document.getElementById("providerSelect");
  const ollamaDiv = document.getElementById("ollamaSettings");
  const apiDiv = document.getElementById("apiSettings");
  const ollamaUrlEl = document.getElementById("ollamaUrl");
  const ollamaModelSelect = document.getElementById("ollamaModel");
  const apiUrlEl = document.getElementById("apiUrl");
  const apiKeyEl = document.getElementById("apiKey");
  const apiModelEl = document.getElementById("apiModel");
  const refreshBtn = document.getElementById("refreshModelsBtn");
  const testBtn = document.getElementById("testAiBtn");
  const testResultDiv = document.getElementById("testResult");
  const settings = await getSettings();
  enabledEl.checked = settings.enabled;
  themeEl.value = settings.theme;
  responseStyleEl.value = settings.responseStyle;
  debugModeEl.checked = settings.debugMode;
  providerSelectEl.value = settings.provider;
  ollamaUrlEl.value = settings.ollamaUrl;
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
    themeEl,
    responseStyleEl,
    debugModeEl,
    providerSelectEl,
    ollamaUrlEl,
    ollamaModelSelect,
    apiUrlEl,
    apiKeyEl,
    apiModelEl
  ];
  inputs.forEach((el) => {
    el.addEventListener("change", async () => {
      const newSettings = {
        enabled: enabledEl.checked,
        theme: themeEl.value,
        responseStyle: responseStyleEl.value,
        debugMode: debugModeEl.checked,
        provider: providerSelectEl.value,
        ollamaUrl: ollamaUrlEl.value.trim(),
        ollamaModel: ollamaModelSelect.value,
        apiUrl: apiUrlEl.value.trim(),
        apiKey: apiKeyEl.value,
        apiModel: apiModelEl.value.trim()
      };
      await setSettings(newSettings);
    });
  });
  async function refreshModels() {
    const url = ollamaUrlEl.value.trim() || "http://localhost:11434";
    try {
      const resp = await fetch(`${url.replace(/\\+$/, "")}/api/tags`);
      if (!resp.ok)
        throw new Error(`Status ${resp.status}`);
      const data = await resp.json();
      const models = (data.models || []).map((m) => m.name);
      ollamaModelSelect.innerHTML = "";
      models.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        ollamaModelSelect.appendChild(opt);
      });
    } catch (e) {
      testResultDiv.textContent = `Error: ${e.message}`;
    }
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

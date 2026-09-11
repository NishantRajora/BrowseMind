import { getSettings, setSettings } from "../shared/storage";

document.addEventListener("DOMContentLoaded", async () => {
  const enabledEl = document.getElementById("enabled") as HTMLInputElement;
  const themeEl = document.getElementById("theme") as HTMLSelectElement;
  const responseStyleEl = document.getElementById("responseStyle") as HTMLSelectElement;
  const debugModeEl = document.getElementById("debugMode") as HTMLInputElement;
  const providerSelectEl = document.getElementById("providerSelect") as HTMLSelectElement;
  const ollamaDiv = document.getElementById("ollamaSettings") as HTMLDivElement;
  const apiDiv = document.getElementById("apiSettings") as HTMLDivElement;
  const ollamaUrlEl = document.getElementById("ollamaUrl") as HTMLInputElement;
  const ollamaModelSelect = document.getElementById("ollamaModel") as HTMLSelectElement;
  const apiUrlEl = document.getElementById("apiUrl") as HTMLInputElement;
  const apiKeyEl = document.getElementById("apiKey") as HTMLInputElement;
  const apiModelEl = document.getElementById("apiModel") as HTMLInputElement;
  const refreshBtn = document.getElementById("refreshModelsBtn") as HTMLButtonElement;
  const testBtn = document.getElementById("testAiBtn") as HTMLButtonElement;
  const testResultDiv = document.getElementById("testResult") as HTMLDivElement;

  const settings = await getSettings();

  // Populate UI
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

  const inputs = [enabledEl, themeEl, responseStyleEl, debugModeEl, providerSelectEl,
    ollamaUrlEl, ollamaModelSelect, apiUrlEl, apiKeyEl, apiModelEl];
  inputs.forEach(el => {
    el.addEventListener("change", async () => {
      const newSettings: Partial<any> = {
        enabled: enabledEl.checked,
        theme: themeEl.value as any,
        responseStyle: responseStyleEl.value as any,
        debugMode: debugModeEl.checked,
        provider: providerSelectEl.value as any,
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
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const data = await resp.json();
      const models = (data.models || []).map((m: any) => m.name);
      ollamaModelSelect.innerHTML = "";
      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        ollamaModelSelect.appendChild(opt);
      });
    } catch (e: any) {
      testResultDiv.textContent = `Error: ${e.message}`;
    }
  }
  refreshBtn.addEventListener("click", e => {
    e.preventDefault();
    refreshModels();
  });

  testBtn.addEventListener("click", async e => {
    e.preventDefault();
    testResultDiv.textContent = "Testing...";
    const resp = await new Promise<any>(resolve => {
      chrome.runtime.sendMessage({ type: "TEST_AI" }, resolve);
    });
    if (resp?.success) {
      testResultDiv.textContent = "✅ AI works!";
      testResultDiv.style.color = "green";
    } else {
      testResultDiv.textContent = `❌ Failed: ${resp?.error ?? "unknown"}`;
      testResultDiv.style.color = "red";
    }
  });

  if (settings.provider === "ollama") {
    refreshModels();
  }
});

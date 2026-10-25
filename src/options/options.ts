import { getSettings, setSettings } from "../shared/storage";

document.addEventListener("DOMContentLoaded", async () => {
  const enabledEl = document.getElementById("enabled") as HTMLInputElement;
  const tabHotkeyEl = document.getElementById("tabHotkey") as HTMLInputElement;
  const camouflageModeEl = document.getElementById("camouflageMode") as HTMLInputElement;
  const themeEl = document.getElementById("theme") as HTMLSelectElement;
  const responseStyleEl = document.getElementById("responseStyle") as HTMLSelectElement;
  const panelPositionEl = document.getElementById("panelPosition") as HTMLSelectElement;
  const fontSizeEl = document.getElementById("fontSize") as HTMLInputElement;
  const panelOpacityEl = document.getElementById("panelOpacity") as HTMLInputElement;
  const opacityValEl = document.getElementById("opacityVal") as HTMLSpanElement;
  const debugModeEl = document.getElementById("debugMode") as HTMLInputElement;
  const providerSelectEl = document.getElementById("providerSelect") as HTMLSelectElement;
  const ollamaDiv = document.getElementById("ollamaSettings") as HTMLDivElement;
  const apiDiv = document.getElementById("apiSettings") as HTMLDivElement;
  const ollamaUrlEl = document.getElementById("ollamaUrl") as HTMLInputElement;
  const ollamaApiKeyEl = document.getElementById("ollamaApiKey") as HTMLInputElement;
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
  tabHotkeyEl.checked = settings.tabHotkey ?? true;
  camouflageModeEl.checked = settings.camouflageMode ?? false;
  themeEl.value = settings.theme;
  responseStyleEl.value = settings.responseStyle;
  panelPositionEl.value = settings.panelPosition ?? "left";
  fontSizeEl.value = String(settings.fontSize ?? 13);
  const curOpacity = settings.panelOpacity ?? 80;
  panelOpacityEl.value = String(curOpacity);
  if (opacityValEl) opacityValEl.textContent = `${curOpacity}%`;
  debugModeEl.checked = settings.debugMode;
  providerSelectEl.value = settings.provider;
  ollamaUrlEl.value = settings.ollamaUrl;
  ollamaApiKeyEl.value = settings.ollamaApiKey || "";

  panelOpacityEl.addEventListener("input", () => {
    if (opacityValEl) opacityValEl.textContent = `${panelOpacityEl.value}%`;
  });

  // Preserve initial model in dropdown so it is not blank
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
    camouflageModeEl,
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
  inputs.forEach(el => {
    el.addEventListener("change", async () => {
      const newSettings: Partial<any> = {
        enabled: enabledEl.checked,
        tabHotkey: tabHotkeyEl.checked,
        camouflageMode: camouflageModeEl.checked,
        theme: themeEl.value as any,
        responseStyle: responseStyleEl.value as any,
        panelPosition: panelPositionEl.value as any,
        fontSize: parseInt(fontSizeEl.value, 10) || 13,
        panelOpacity: parseInt(panelOpacityEl.value, 10) || 80,
        debugMode: debugModeEl.checked,
        provider: providerSelectEl.value as any,
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

    const resp = await new Promise<any>(resolve => {
      chrome.runtime.sendMessage(
        { type: "GET_OLLAMA_MODELS", url, apiKey },
        resolve
      );
    });

    if (resp?.error) {
      testResultDiv.textContent = `❌ Model fetch error: ${resp.error}`;
      testResultDiv.style.color = "red";
      return;
    }

    const currentModel = ollamaModelSelect.value || settings.ollamaModel;
    const models: string[] = (resp?.models || []).map((m: any) => m.name);

    ollamaModelSelect.innerHTML = "";

    if (models.length === 0) {
      if (currentModel) {
        const opt = document.createElement("option");
        opt.value = currentModel;
        opt.textContent = currentModel;
        ollamaModelSelect.appendChild(opt);
      }
      testResultDiv.textContent = "⚠️ No models found on server.";
      testResultDiv.style.color = "orange";
      return;
    }

    models.forEach(m => {
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
    testResultDiv.textContent = `✅ Loaded ${models.length} model(s)`;
    testResultDiv.style.color = "green";
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

import { Storage } from '../shared/storage.js';
import { ProviderConfig, UserPreferences, DebugLogEntry } from '../shared/types.js';
import { redactSensitiveInfo } from '../shared/utils.js';

async function init() {
  // AI Provider
  const providerRadios = document.getElementsByName('provider') as NodeListOf<HTMLInputElement>;
  const ollamaSection = document.getElementById('ollama-config') as HTMLElement;
  const openaiSection = document.getElementById('openai-config') as HTMLElement;

  // Ollama fields
  const ollamaUrl = document.getElementById('ollama-url') as HTMLInputElement;
  const ollamaModel = document.getElementById('ollama-model') as HTMLSelectElement;
  const ollamaStatus = document.getElementById('ollama-status') as HTMLElement;
  const ollamaRefreshBtn = document.getElementById('ollama-refresh') as HTMLButtonElement;
  const ollamaTestBtn = document.getElementById('ollama-test') as HTMLButtonElement;

  // OpenAI fields
  const openaiUrl = document.getElementById('openai-url') as HTMLInputElement;
  const openaiKey = document.getElementById('openai-key') as HTMLInputElement;
  const openaiModel = document.getElementById('openai-model') as HTMLInputElement;
  const openaiStatus = document.getElementById('openai-status') as HTMLElement;
  const openaiTestBtn = document.getElementById('openai-test') as HTMLButtonElement;

  // Prefs
  const debugToggle = document.getElementById('debug-mode') as HTMLInputElement;
  const themeSelect = document.getElementById('pref-theme') as HTMLSelectElement;
  const styleSelect = document.getElementById('pref-style') as HTMLSelectElement;
  const maxTextInput = document.getElementById('pref-max-text') as HTMLInputElement;

  // Debug
  const debugSection = document.getElementById('debug-section') as HTMLElement;
  const debugLogsContainer = document.getElementById('debug-logs') as HTMLElement;
  const debugCount = document.getElementById('debug-count') as HTMLElement;
  const debugClearBtn = document.getElementById('debug-clear') as HTMLButtonElement;
  const debugRefreshBtn = document.getElementById('debug-refresh') as HTMLButtonElement;

  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

  const config = await Storage.getConfig();
  const prefs = await Storage.getPreferences();

  // Set initial values
  providerRadios.forEach(r => {
    if (r.value === config.provider) r.checked = true;
  });

  ollamaUrl.value = config.ollama.url;
  openaiUrl.value = config.openai.baseUrl;
  openaiKey.value = config.openai.apiKey;
  openaiModel.value = config.openai.model;

  debugToggle.checked = prefs.debugMode;
  themeSelect.value = prefs.theme;
  styleSelect.value = prefs.responseStyle;
  maxTextInput.value = prefs.maxWebpageText.toString();

  const fetchOllamaModels = async () => {
    try {
      const rawUrl = ollamaUrl.value.trim();
      if (!rawUrl) throw new Error('Server URL is empty');

      // Robust URL handling: remove trailing slash to avoid //api/tags
      const url = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

      console.log(`[BrowseMind] Fetching Ollama models from ${url}/api/tags...`);
      const response = await fetch(`${url}/api/tags`);
      console.log(`[BrowseMind] /api/tags responded with status: ${response.status}`);
      if (!response.ok) throw new Error(`Ollama returned status ${response.status}`);

      const data = await response.json();
      console.log('[BrowseMind] Models found:', data.models);
      const models = data.models || [];

      ollamaModel.innerHTML = '';
      if (models.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No models found';
        ollamaModel.appendChild(option);
      } else {
        models.forEach((m: any) => {
          const option = document.createElement('option');
          option.value = m.name;
          option.textContent = m.name;
          ollamaModel.appendChild(option);
        });

        // Restore selected model if it's in the list
        if (Array.from(ollamaModel.options).some(opt => opt.value === config.ollama.model)) {
          ollamaModel.value = config.ollama.model;
        } else {
          ollamaModel.value = models[0].name;
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch Ollama models:', e);
      ollamaModel.innerHTML = '';
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = `Error: ${e.message || 'CORS/Connection'}`;
      ollamaModel.appendChild(errorOption);
    }
  };

  const updateSectionVisibility = async () => {
    const selectedProvider = Array.from(providerRadios).find(r => r.checked)?.value;
    ollamaSection.style.display = selectedProvider === 'ollama' ? 'block' : 'none';
    openaiSection.style.display = selectedProvider === 'openai' ? 'block' : 'none';

    if (selectedProvider === 'ollama') {
      await fetchOllamaModels();
    }
  };

  providerRadios.forEach(r => r.onchange = updateSectionVisibility);
  ollamaUrl.oninput = fetchOllamaModels;
  updateSectionVisibility();

  const updateDebugVisibility = () => {
    debugSection.style.display = debugToggle.checked ? 'block' : 'none';
  };
  debugToggle.onchange = updateDebugVisibility;
  updateDebugVisibility();

  // Test connection
  ollamaTestBtn.onclick = async () => {
    ollamaStatus.textContent = 'Testing...';
    chrome.runtime.sendMessage({ action: 'test-connection' }, (res) => {
      ollamaStatus.textContent = `Connection: ${res.success ? 'Connected' : 'Not Connected'}`;
      if (!res.success) console.error(res.message);
    });
  };

  openaiTestBtn.onclick = async () => {
    openaiStatus.textContent = 'Testing...';
    chrome.runtime.sendMessage({ action: 'test-connection' }, (res) => {
      openaiStatus.textContent = `Connection: ${res.success ? 'Connected' : 'Not Connected'}`;
      if (!res.success) console.error(res.message);
    });
  };

  ollamaRefreshBtn.onclick = fetchOllamaModels;

  // Debug logs
  const renderLogs = async () => {
    const logs = await chrome.runtime.sendMessage({ action: 'get-debug-logs' }) as DebugLogEntry[];
    debugCount.textContent = `Requests: ${logs.length}`;
    debugLogsContainer.innerHTML = '';

    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `
        <div class="log-entry-header">Request #${log.id} - ${log.success ? 'Success' : 'Failed'}</div>
        <div class="log-entry-detail">Time: ${new Date(log.timestamp).toLocaleString()}</div>
        <div class="log-entry-detail">Provider: ${log.provider} (${log.model})</div>
        <div class="log-entry-detail">Page: ${log.request.context.pageTitle} (${log.request.context.pageUrl})</div>
        <div class="log-entry-detail">User Prompt: ${redactSensitiveInfo(log.userPrompt)}</div>
        <div class="log-entry-detail">AI Response: ${redactSensitiveInfo(log.response)}</div>
        <div class="log-entry-detail">Duration: ${log.duration.toFixed(2)}ms</div>
      `;
      debugLogsContainer.appendChild(entry);
    });
  };

  debugRefreshBtn.onclick = renderLogs;
  debugClearBtn.onclick = async () => {
    await chrome.runtime.sendMessage({ action: 'clear-debug-logs' });
    renderLogs();
  };

  if (debugToggle.checked) renderLogs();

  saveBtn.onclick = async () => {
    const newConfig: ProviderConfig = {
      provider: Array.from(providerRadios).find(r => r.checked)?.value as any,
      ollama: {
        url: ollamaUrl.value,
        model: ollamaModel.value,
      },
      openai: {
        baseUrl: openaiUrl.value,
        apiKey: openaiKey.value,
        model: openaiModel.value,
      },
    };

    const newPrefs: UserPreferences = {
      ...prefs,
      debugMode: debugToggle.checked,
      theme: themeSelect.value as any,
      responseStyle: styleSelect.value as any,
      maxWebpageText: parseInt(maxTextInput.value, 10) || 30000,
    };

    await Storage.setConfig(newConfig);
    await Storage.setPreferences(newPrefs);
    alert('Settings saved!');
    if (newPrefs.debugMode) renderLogs();
  };
}

init();

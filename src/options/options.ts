import { getSettings, saveSettings } from '../shared/storage';
import { ExtensionSettings } from '../shared/types';

document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider') as HTMLSelectElement;
  const ollamaSection = document.getElementById('ollama-settings') as HTMLElement;
  const openaiSection = document.getElementById('openai-settings') as HTMLElement;

  const ollamaUrlInput = document.getElementById('ollamaUrl') as HTMLInputElement;
  const ollamaModelSelect = document.getElementById('ollamaModel') as HTMLSelectElement;
  const refreshModelsBtn = document.getElementById('refresh-models') as HTMLButtonElement;
  const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const apiModelInput = document.getElementById('apiModel') as HTMLInputElement;
  const themeSelect = document.getElementById('theme') as HTMLSelectElement;
  const styleSelect = document.getElementById('responseStyle') as HTMLSelectElement;
  const maxTextInput = document.getElementById('maxText') as HTMLInputElement;
  const saveBtn = document.getElementById('save') as HTMLButtonElement;

  // Test buttons and results
  const testOllamaBtn = document.getElementById('test-ollama') as HTMLButtonElement;
  const ollamaResult = document.getElementById('ollama-test-result') as HTMLElement;
  const testOpenaiBtn = document.getElementById('test-openai') as HTMLButtonElement;
  const openaiResult = document.getElementById('openai-test-result') as HTMLElement;

  const settings: ExtensionSettings = await getSettings();

  // Populate fields
  providerSelect.value = settings.provider;
  ollamaUrlInput.value = settings.ollamaUrl;
  apiUrlInput.value = settings.apiUrl;
  apiKeyInput.value = settings.apiKey;
  apiModelInput.value = settings.apiModel;
  themeSelect.value = settings.theme;
  styleSelect.value = settings.responseStyle;
  maxTextInput.value = settings.maxText.toString();

  const updateSections = () => {
    const isOllama = providerSelect.value === 'ollama';
    ollamaSection.style.display = isOllama ? 'block' : 'none';
    openaiSection.style.display = isOllama ? 'none' : 'block';
    if (isOllama) {
      refreshOllamaModels();
    }
  };

  async function refreshOllamaModels() {
    const url = ollamaUrlInput.value;
    if (!url) return;

    chrome.runtime.sendMessage({
      type: 'GET_OLLAMA_MODELS',
      data: { url }
    }, (response) => {
      if (chrome.runtime.lastError || !response || response.error) {
        console.error('Failed to fetch Ollama models:', response?.error || chrome.runtime.lastError);
        return;
      }

      const models = response.models;
      ollamaModelSelect.innerHTML = '';

      // Add an empty option or default option
      const defaultOption = document.createElement('option');
      defaultOption.text = 'Select a model...';
      defaultOption.value = '';
      ollamaModelSelect.appendChild(defaultOption);

      models.forEach(modelName => {
        const option = document.createElement('option');
        option.text = modelName;
        option.value = modelName;
        ollamaModelSelect.appendChild(option);
      });

      // Restore previously saved model if it exists in the list
      if (settings.ollamaModel) {
        ollamaModelSelect.value = settings.ollamaModel;
      }
    });
  }

  providerSelect.onchange = updateSections;
  updateSections();

  refreshModelsBtn.onclick = refreshOllamaModels;

  saveBtn.onclick = async () => {
    const newSettings: ExtensionSettings = {
      ...settings,
      provider: providerSelect.value as any,
      ollamaUrl: ollamaUrlInput.value,
      ollamaModel: ollamaModelSelect.value,
      apiUrl: apiUrlInput.value,
      apiKey: apiKeyInput.value,
      apiModel: apiModelInput.value,
      theme: themeSelect.value as any,
      responseStyle: styleSelect.value as any,
      maxText: parseInt(maxTextInput.value) || 30000,
    };

    await saveSettings(newSettings);
    alert('Settings saved!');
  };

  async function testConnection(provider: 'ollama' | 'openai', resultElement: HTMLElement, button: HTMLButtonElement) {
    const originalText = button.innerText;
    button.innerText = 'Testing...';
    button.disabled = true;
    resultElement.innerText = '';
    resultElement.className = 'test-result';

    // First, save current values to storage so the background script can use them
    const currentSettings: ExtensionSettings = {
      ...settings,
      provider: provider,
      ollamaUrl: ollamaUrlInput.value,
      ollamaModel: ollamaModelSelect.value,
      apiUrl: apiUrlInput.value,
      apiKey: apiKeyInput.value,
      apiModel: apiModelInput.value,
    };
    await saveSettings(currentSettings);

    chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (response) => {
      button.innerText = originalText;
      button.disabled = false;

      if (chrome.runtime.lastError) {
        resultElement.innerText = 'Error: ' + chrome.runtime.lastError.message;
        resultElement.className = 'test-result test-error';
        return;
      }

      if (response && response.text && !response.error) {
        resultElement.innerText = 'Success: ' + response.text;
        resultElement.className = 'test-result test-success';
      } else {
        resultElement.innerText = 'Failed: ' + (response?.error || 'Unknown error');
        resultElement.className = 'test-result test-error';
      }
    });
  }

  testOllamaBtn.onclick = () => testConnection('ollama', ollamaResult, testOllamaBtn);
  testOpenaiBtn.onclick = () => testConnection('openai', openaiResult, testOpenaiBtn);
});

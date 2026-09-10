import { Storage } from '../shared/storage.js';

async function init() {
  const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
  const statusText = document.getElementById('status-text') as HTMLElement;
  const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;

  const prefs = await Storage.getPreferences();
  enabledToggle.checked = prefs.enabled;
  statusText.textContent = prefs.enabled ? 'ON' : 'OFF';

  enabledToggle.onchange = async () => {
    const newPrefs = { ...prefs, enabled: enabledToggle.checked };
    await Storage.setPreferences(newPrefs);
    statusText.textContent = enabledToggle.checked ? 'ON' : 'OFF';
  };

  settingsBtn.onclick = () => {
    chrome.runtime.openOptionsPage();
  };
}

init();

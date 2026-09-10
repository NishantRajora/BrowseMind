import { getSettings, saveSettings } from '../shared/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const enabledInput = document.getElementById('enabled') as HTMLInputElement;
  const statusText = document.getElementById('status-text') as HTMLElement;
  const optionsBtn = document.getElementById('open-options') as HTMLButtonElement;

  const settings = await getSettings();
  enabledInput.checked = settings.enabled;
  statusText.innerText = settings.enabled ? 'Enabled' : 'Disabled';

  enabledInput.onchange = async () => {
    settings.enabled = enabledInput.checked;
    await saveSettings(settings);
    statusText.innerText = settings.enabled ? 'Enabled' : 'Disabled';
  };

  optionsBtn.onclick = () => {
    chrome.runtime.openOptionsPage();
  };
});

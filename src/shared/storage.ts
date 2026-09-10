import { ExtensionSettings } from './types';
import { DEFAULT_SETTINGS, STORAGE_KEY } from './constants';

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || DEFAULT_SETTINGS);
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
      resolve();
    });
  });
}

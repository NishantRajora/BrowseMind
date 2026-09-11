import { DEFAULT_SETTINGS } from "./constants";
import { ExtensionSettings } from "./types";

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      resolve({ ...DEFAULT_SETTINGS, ...items } as ExtensionSettings);
    });
  });
}

export async function setSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, () => resolve());
  });
}

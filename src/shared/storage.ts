import { ProviderConfig, UserPreferences, DebugLogEntry } from './types.js';
import { DEFAULT_CONFIG, DEFAULT_PREFERENCES, MAX_DEBUG_LOGS } from './constants.js';

export class Storage {
  static async getConfig(): Promise<ProviderConfig> {
    const config = await chrome.storage.local.get('config');
    if (!config.config) return DEFAULT_CONFIG;

    // Ensure all expected keys exist to prevent runtime errors if defaults change
    return {
      ...DEFAULT_CONFIG,
      ...config.config,
      ollama: { ...DEFAULT_CONFIG.ollama, ...config.config.ollama },
      openai: { ...DEFAULT_CONFIG.openai, ...config.config.openai },
    };
  }

  static async setConfig(config: ProviderConfig): Promise<void> {
    await chrome.storage.local.set({ config });
  }

  static async getPreferences(): Promise<UserPreferences> {
    const prefs = await chrome.storage.local.get('preferences');
    return prefs.preferences || DEFAULT_PREFERENCES;
  }

  static async setPreferences(prefs: UserPreferences): Promise<void> {
    await chrome.storage.local.set({ preferences: prefs });
  }

  static async getDebugLogs(): Promise<DebugLogEntry[]> {
    const logs = await chrome.storage.local.get('debugLogs');
    return logs.debugLogs || [];
  }

  static async addDebugLog(log: DebugLogEntry): Promise<void> {
    const logs = await this.getDebugLogs();
    const updatedLogs = [log, ...logs].slice(0, MAX_DEBUG_LOGS);
    await chrome.storage.local.set({ debugLogs: updatedLogs });
  }

  static async clearDebugLogs(): Promise<void> {
    await chrome.storage.local.remove('debugLogs');
  }
}

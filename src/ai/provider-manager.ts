import { AIProvider } from './provider';
import { OllamaProvider } from './ollama';
import { OpenAiCompatibleProvider } from './api-client';
import { ExtensionSettings } from '../shared/types';

export class ProviderManager {
  private provider: AIProvider | null = null;

  updateProvider(settings: ExtensionSettings) {
    if (settings.provider === 'ollama') {
      this.provider = new OllamaProvider(settings.ollamaUrl, settings.ollamaModel);
    } else {
      this.provider = new OpenAiCompatibleProvider(settings.apiUrl, settings.apiKey, settings.apiModel);
    }
  }

  getProvider(): AIProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized. Please update settings.');
    }
    return this.provider;
  }
}

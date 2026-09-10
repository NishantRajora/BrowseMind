import { AIProvider } from './provider.js';
import { ProviderConfig } from '../shared/types.js';
import { OllamaProvider } from './ollama.js';
import { OpenAICompatibleProvider } from './api-client.js';

export class ProviderManager {
  private provider: AIProvider | null = null;
  private currentConfig: ProviderConfig | null = null;

  async getProvider(config: ProviderConfig): Promise<AIProvider> {
    if (this.provider && this.currentConfig && this.isSameConfig(config)) {
      return this.provider;
    }

    this.currentConfig = config;
    if (config.provider === 'ollama') {
      this.provider = new OllamaProvider(config.ollama.url, config.ollama.model);
    } else {
      this.provider = new OpenAICompatibleProvider(
        config.openai.baseUrl,
        config.openai.apiKey,
        config.openai.model
      );
    }
    return this.provider;
  }

  private isSameConfig(c1: ProviderConfig, c2: ProviderConfig): boolean {
    return (
      c1.provider === c2.provider &&
      c1.ollama.url === c2.ollama.url &&
      c1.ollama.model === c2.ollama.model &&
      c1.openai.baseUrl === c2.openai.baseUrl &&
      c1.openai.apiKey === c2.openai.apiKey &&
      c1.openai.model === c2.openai.model
    );
  }
}

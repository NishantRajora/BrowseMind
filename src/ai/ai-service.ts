import { ProviderManager } from './provider-manager';
import { AIRequest, AIResponse, ExtensionSettings } from '../shared/types';
import { getSettings } from '../shared/storage';

export class AIService {
  private manager = new ProviderManager();

  constructor() {
    this.initialize();
  }

  async initialize() {
    const settings = await getSettings();
    this.manager.updateProvider(settings);
  }

  async request(request: AIRequest): Promise<AIResponse> {
    const settings = await getSettings();
    if (!settings.enabled) {
      return { text: '', error: 'BrowseMind is currently disabled in settings.' };
    }

    // Ensure provider is up to date with current settings
    this.manager.updateProvider(settings);
    const provider = this.manager.getProvider();

    return provider.generateResponse(request);
  }
}

export const aiService = new AIService();

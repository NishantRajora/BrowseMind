import { ProviderManager } from './provider-manager.js';
import { SYSTEM_PROMPTS } from './prompts.js';
import { AIRequest, AIResponse, AIError, ProviderConfig } from '../shared/types.js';
import { Storage } from '../shared/storage.js';

export class AIService {
  private providerManager = new ProviderManager();

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const config = await Storage.getConfig();
    const provider = await this.providerManager.getProvider(config);

    const systemPrompt = SYSTEM_PROMPTS.DEFAULT;
    const userPrompt = this.constructUserPrompt(request);

    return await provider.generate(userPrompt, systemPrompt);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await Storage.getConfig();
    const provider = await this.providerManager.getProvider(config);
    return await provider.testConnection();
  }

  private constructUserPrompt(request: AIRequest): string {
    const { payload, context } = request;
    const { pageTitle, pageUrl, webpageContent } = context;

    let prompt = `Page Title: ${pageTitle}\nPage URL: ${pageUrl}\n`;

    if (request.action === 'scan-page' && webpageContent) {
      prompt += `\nWebpage Content:\n${webpageContent}\n`;
    }

    prompt += `\nQuestion/Text to Analyze:\n${payload}\n`;
    prompt += `\nAnswer:`;

    return prompt;
  }
}

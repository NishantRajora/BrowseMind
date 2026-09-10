import { AIProvider, AIRequest, AIResponse } from './provider';
import { SYSTEM_PROMPT } from './prompts';

export class OpenAiCompatibleProvider implements AIProvider {
  name = 'openai';

  constructor(private url: string, private apiKey: string, private model: string) {}

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Remove trailing slash from base URL if it exists
      const baseUrl = this.url.endsWith('/') ? this.url.slice(0, -1) : this.url;

      // If the user already provided the full endpoint, don't append /chat/completions
      const finalUrl = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl}/chat/completions`;

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: request.prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { text: data.choices[0].message.content };
    } catch (error: any) {
      return { text: '', error: error.message || 'Unknown API error' };
    }
  }
}

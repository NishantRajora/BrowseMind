import { AIProvider, AIRequest, AIResponse } from './provider';
import { SYSTEM_PROMPT } from './prompts';

export class OllamaProvider implements AIProvider {
  name = 'ollama';

  constructor(private url: string, private model: string) {}

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: request.prompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { text: data.message.content };
    } catch (error: any) {
      return { text: '', error: error.message || 'Unknown Ollama error' };
    }
  }
}

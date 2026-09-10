import { AIProvider } from './provider.js';
import { AIResponse, AIError, AIErrorType } from '../shared/types.js';

export class OpenAICompatibleProvider implements AIProvider {
  constructor(private baseUrl: string, private apiKey: string, private model: string) {}

  async generate(prompt: string, systemPrompt: string): Promise<AIResponse> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw this.handleHttpError(response.status);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw this.createError('INVALID_RESPONSE', 'OpenAI provider returned an empty response');
      }

      return {
        content: content.trim(),
        duration: performance.now() - startTime,
        status: response.status,
      };
    } catch (error: any) {
      if (error.type) throw error;
      throw this.handleNetworkError(error);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (response.ok) {
        return { success: true, message: 'Connected to OpenAI Compatible API' };
      }
      return { success: false, message: `API returned status ${response.status}` };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  private handleHttpError(status: number): AIError {
    switch (status) {
      case 401: return this.createError('UNAUTHORIZED', 'API Key is invalid or unauthorized');
      case 403: return this.createError('FORBIDDEN', 'Access to the API is forbidden');
      case 404: return this.createError('NOT_FOUND', 'API endpoint or model not found');
      case 429: return this.createError('RATE_LIMITED', 'API rate limit exceeded');
      default:
        if (status >= 500) return this.createError('SERVER_ERROR', 'API server error');
        return this.createError('UNKNOWN', `API returned status ${status}`);
    }
  }

  private handleNetworkError(error: any): AIError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError('NETWORK', 'Could not connect to the AI API. Please check your network and Base URL.');
    }
    return this.createError('UNKNOWN', error.message);
  }

  private createError(type: AIErrorType, message: string): AIError {
    return { type, message };
  }
}

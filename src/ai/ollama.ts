import { AIProvider } from './provider.js';
import { AIResponse, AIError, AIErrorType } from '../shared/types.js';

export class OllamaProvider implements AIProvider {
  constructor(private url: string, private model: string) {}

  async generate(prompt: string, systemPrompt: string): Promise<AIResponse> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: systemPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw this.handleHttpError(response.status);
      }

      const data = await response.json();
      if (!data.response) {
        throw this.createError('INVALID_RESPONSE', 'Ollama returned an empty response');
      }

      return {
        content: data.response.trim(),
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
      const rawUrl = this.url.trim();
      const url = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

      const response = await fetch(`${url}/api/tags`);
      if (response.ok) {
        return { success: true, message: 'Connected to Ollama' };
      }
      return { success: false, message: `Ollama returned status ${response.status}` };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}. Check if Ollama is running and OLLAMA_ORIGINS is set.` };
    }
  }

  private handleHttpError(status: number): AIError {
    switch (status) {
      case 401: return this.createError('UNAUTHORIZED', 'Ollama unauthorized');
      case 403: return this.createError('FORBIDDEN', 'Ollama forbidden');
      case 404: return this.createError('NOT_FOUND', 'Ollama model or endpoint not found');
      case 429: return this.createError('RATE_LIMITED', 'Ollama rate limited');
      default:
        if (status >= 500) return this.createError('SERVER_ERROR', 'Ollama server error');
        return this.createError('UNKNOWN', `Ollama returned status ${status}`);
    }
  }

  private handleNetworkError(error: any): AIError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError('NETWORK', 'Could not connect to Ollama. Please check if Ollama is running and OLLAMA_ORIGINS is set.');
    }
    return this.createError('UNKNOWN', error.message);
  }

  private createError(type: AIErrorType, message: string): AIError {
    return { type, message };
  }
}

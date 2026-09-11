import { OllamaConfig, AIProvider } from "../shared/types";
import { fetchWithTimeout } from "../shared/utils";

export class OllamaProvider implements AIProvider {
  private url: string;
  private model: string;

  constructor(config: OllamaConfig) {
    this.url = config.url.replace(/\/+$/,""); // strip trailing slash
    this.model = config.model;
  }

  async generate(prompt: string, maxTokens?: number): Promise<string> {
    const endpoint = `${this.url}/api/generate`;
    const payload: any = {
      model: this.model,
      prompt,
      stream: false
    };
    if (maxTokens !== undefined) payload.num_predict = maxTokens;
    const start = Date.now();
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - start; // currently unused but useful for debugging
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Ollama request failed ${response.status}: ${txt}`);
    }
    const data = await response.json();
    const answer = data.response?.trim() ?? "";
    return answer;
  }

  async testConnection(): Promise<void> {
    const endpoint = `${this.url}/api/tags`;
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }
    // Successful if we get JSON back; no further validation needed
  }

  async testAI(): Promise<boolean> {
    try {
      await this.testConnection();
      const answer = await this.generate("Hello");
      return !!answer && answer.length > 0;
    } catch {
      return false;
    }
  }
}

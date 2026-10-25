import { OllamaConfig, AIProvider } from "../shared/types";
import { fetchWithTimeout } from "../shared/utils";

export class OllamaProvider implements AIProvider {
  private url: string;
  private model: string;
  private apiKey?: string;

  constructor(config: OllamaConfig) {
    this.url = config.url.replace(/\/+$/, ""); // strip trailing slash
    this.model = config.model;
    this.apiKey = config.apiKey?.trim();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async generate(prompt: string, maxTokens?: number): Promise<string> {
    const endpoint = `${this.url}/api/generate`;
    const payload: any = {
      model: this.model,
      prompt,
      stream: false
    };
    if (maxTokens !== undefined) payload.num_predict = maxTokens;
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
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
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const response = await fetchWithTimeout(endpoint, { headers });
    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      throw new Error(`Failed to list models (${response.status}): ${txt}`);
    }
  }

  async testAI(): Promise<boolean> {
    await this.testConnection();
    const answer = await this.generate("Hello");
    if (!answer) {
      throw new Error("Received empty response from Ollama model");
    }
    return true;
  }
}

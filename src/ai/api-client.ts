import { AIProvider, APIConfig } from "../shared/types";
import { fetchWithTimeout } from "../shared/utils";

export class APIProvider implements AIProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: APIConfig) {
    let base = config.baseUrl.replace(/\/+$/, "");
    // Automatically normalize Ollama host URLs to include /v1 for OpenAI compatibility
    if ((base.endsWith("ollama.com") || base.includes(":11434")) && !base.endsWith("/v1")) {
      base = `${base}/v1`;
    }
    this.baseUrl = base;
    this.apiKey = config.apiKey?.trim() ?? "";
    this.model = config.model;
  }

  async generate(prompt: string, maxTokens?: number): Promise<string> {
    const endpoint = `${this.baseUrl}/chat/completions`;
    const payload: any = {
      model: this.model,
      messages: [{ role: "user", content: prompt }]
    };
    if (maxTokens !== undefined) payload.max_tokens = maxTokens;
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`API request failed ${response.status}: ${txt}`);
    }
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return answer;
  }

  async testConnection(): Promise<void> {
    // Use a cheap prompt to verify connectivity.
    await this.generate("ping", 5);
  }

  async testAI(): Promise<boolean> {
    await this.testConnection();
    return true;
  }
}

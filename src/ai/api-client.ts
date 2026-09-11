import { AIProvider, APIConfig } from "../shared/types";
import { fetchWithTimeout } from "../shared/utils";

export class APIProvider implements AIProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: APIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async generate(prompt: string, maxTokens?: number): Promise<string> {
    const endpoint = `${this.baseUrl}/chat/completions`;
    const payload: any = {
      model: this.model,
      messages: [{ role: "user", content: prompt }]
    };
    if (maxTokens !== undefined) payload.max_tokens = maxTokens;
    const start = Date.now();
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - start;
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
    await this.generate("ping");
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

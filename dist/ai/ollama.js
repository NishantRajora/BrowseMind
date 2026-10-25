// src/shared/utils.ts
async function fetchWithTimeout(input, init = {}, timeoutMs = 15e3) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// src/ai/ollama.ts
var OllamaProvider = class {
  constructor(config) {
    this.url = config.url.replace(/\/+$/, "");
    this.model = config.model;
    this.apiKey = config.apiKey?.trim();
  }
  getHeaders() {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
  async generate(prompt, maxTokens) {
    const endpoint = `${this.url}/api/generate`;
    const payload = {
      model: this.model,
      prompt,
      stream: false
    };
    if (maxTokens !== void 0)
      payload.num_predict = maxTokens;
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
  async testConnection() {
    const endpoint = `${this.url}/api/tags`;
    const headers = {};
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const response = await fetchWithTimeout(endpoint, { headers });
    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      throw new Error(`Failed to list models (${response.status}): ${txt}`);
    }
  }
  async testAI() {
    await this.testConnection();
    const answer = await this.generate("Hello");
    if (!answer) {
      throw new Error("Received empty response from Ollama model");
    }
    return true;
  }
};
export {
  OllamaProvider
};
//# sourceMappingURL=ollama.js.map

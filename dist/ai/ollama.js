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
    const start = Date.now();
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - start;
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
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }
  }
  async testAI() {
    try {
      await this.testConnection();
      const answer = await this.generate("Hello");
      return !!answer && answer.length > 0;
    } catch {
      return false;
    }
  }
};
export {
  OllamaProvider
};
//# sourceMappingURL=ollama.js.map

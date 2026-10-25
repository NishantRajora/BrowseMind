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

// src/ai/api-client.ts
var APIProvider = class {
  constructor(config) {
    let base = config.baseUrl.replace(/\/+$/, "");
    if ((base.endsWith("ollama.com") || base.includes(":11434")) && !base.endsWith("/v1")) {
      base = `${base}/v1`;
    }
    this.baseUrl = base;
    this.apiKey = config.apiKey?.trim() ?? "";
    this.model = config.model;
  }
  async generate(prompt, maxTokens) {
    const endpoint = `${this.baseUrl}/chat/completions`;
    const payload = {
      model: this.model,
      messages: [{ role: "user", content: prompt }]
    };
    if (maxTokens !== void 0)
      payload.max_tokens = maxTokens;
    const headers = {
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
  async testConnection() {
    await this.generate("ping", 5);
  }
  async testAI() {
    await this.testConnection();
    return true;
  }
};
export {
  APIProvider
};
//# sourceMappingURL=api-client.js.map

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
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
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
  async testConnection() {
    await this.generate("ping");
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
  APIProvider
};
//# sourceMappingURL=api-client.js.map

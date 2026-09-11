// src/shared/constants.ts
var DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama",
  // "ollama" | "api"
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "gpt-oss:120b",
  apiUrl: "",
  apiKey: "",
  apiModel: "",
  theme: "system",
  // "system" | "light" | "dark"
  responseStyle: "normal",
  // "concise" | "normal" | "detailed"
  maxText: 3e4,
  debugMode: false
};

// src/shared/storage.ts
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      resolve({ ...DEFAULT_SETTINGS, ...items });
    });
  });
}

// src/ai/prompts.ts
function buildPrompt(selection, pageContent, settings) {
  const styleInstr = settings.responseStyle === "concise" ? "Give a concise answer." : settings.responseStyle === "detailed" ? "Provide a detailed answer." : "";
  const pageSnippet = pageContent ? `
Relevant page excerpt (max ${settings.maxText} chars):
${pageContent}` : "";
  return `${styleInstr}
User selected text:
"""${selection}"""
${pageSnippet}`;
}

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

// src/ai/provider-manager.ts
async function getProvider() {
  const settings = await getSettings();
  if (settings.provider === "ollama") {
    return new OllamaProvider({ url: settings.ollamaUrl, model: settings.ollamaModel });
  } else {
    return new APIProvider({ baseUrl: settings.apiUrl, apiKey: settings.apiKey, model: settings.apiModel });
  }
}

// src/ai/ai-service.ts
async function askAI(selection, pageContent) {
  const settings = await getSettings();
  const provider = await getProvider();
  const prompt = buildPrompt(selection, pageContent, settings);
  const start = Date.now();
  try {
    const answer = await provider.generate(prompt);
    const duration = Date.now() - start;
    let debug;
    if (settings.debugMode) {
      const endpoint = settings.provider === "ollama" ? `${settings.ollamaUrl.replace(/\/+$/, "")}/api/generate` : `${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`;
      const model = settings.provider === "ollama" ? settings.ollamaModel : settings.apiModel;
      debug = {
        provider: settings.provider,
        endpoint,
        model,
        request: { prompt },
        status: 200,
        response: { answer },
        durationMs: duration
      };
    }
    return { answer, debug };
  } catch (err) {
    const duration = Date.now() - start;
    let debug;
    if (settings.debugMode) {
      const endpoint = settings.provider === "ollama" ? `${settings.ollamaUrl.replace(/\/+$/, "")}/api/generate` : `${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`;
      const model = settings.provider === "ollama" ? settings.ollamaModel : settings.apiModel;
      debug = {
        provider: settings.provider,
        endpoint,
        model,
        request: { prompt },
        status: 0,
        response: null,
        durationMs: duration,
        error: err?.message ?? String(err)
      };
    }
    return { error: err?.message ?? String(err), debug };
  }
}
export {
  askAI
};
//# sourceMappingURL=ai-service.js.map

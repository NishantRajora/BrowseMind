// src/shared/constants.ts
var DEFAULT_SETTINGS = {
  enabled: true,
  provider: "ollama",
  // "ollama" | "api"
  ollamaUrl: "https://ollama.com",
  ollamaModel: "gemma4:31b",
  ollamaApiKey: "",
  apiUrl: "https://ollama.com/v1",
  apiKey: "",
  apiModel: "gemma4:31b",
  theme: "system",
  // "system" | "light" | "dark"
  responseStyle: "keypoints",
  // "keypoints" | "concise" | "normal" | "detailed"
  maxText: 3e4,
  debugMode: false,
  fontSize: 13,
  panelOpacity: 80,
  panelPosition: "left",
  // "left" | "right"
  tabHotkey: true,
  camouflageMode: false
};

// src/shared/storage.ts
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      resolve({ ...DEFAULT_SETTINGS, ...items });
    });
  });
}
async function setSettings(partial) {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, () => resolve());
  });
}

// src/ai/prompts.ts
function buildPrompt(selection, pageContent, settings) {
  let styleInstr = "";
  if (settings.responseStyle === "concise") {
    styleInstr = "Give a concise answer. Provide the answer in direct key points with no extra filler or pleasantries.";
  } else if (settings.responseStyle === "detailed") {
    styleInstr = "Provide a detailed answer with structured key points.";
  } else {
    styleInstr = "CRITICAL INSTRUCTION: Provide the answer STRICTLY as concise, direct key bullet points only.\n- Absolutely NO introductory phrases (e.g. do not say 'Here are the key points', 'Based on the text', etc.).\n- Absolutely NO conversational filler, pleasantries, greetings, or conclusions.\n- Provide ONLY the direct, informative key points.";
  }
  const pageSnippet = pageContent ? `
Relevant page context (max ${settings.maxText} chars):
${pageContent}` : "";
  if (selection && selection.trim().length > 0) {
    return `${styleInstr}

IMPORTANT MULTIPLE QUESTIONS RESOLUTION:
- The user selected ONE specific question or problem below.
- FOCUS 100% EXCLUSIVELY on answering THIS EXACT SELECTED QUESTION.
- Do NOT answer or get confused by any other questions that appear elsewhere on the page.
- If it is a multiple-choice question, immediately state the correct option letter and answer, followed by brief key points.

Selected text / Question:
"""${selection.trim()}"""
${pageSnippet}`;
  } else {
    return `${styleInstr}

IMPORTANT MULTIPLE QUESTIONS RESOLUTION:
- If the page contains multiple questions or problems:
  1. DO NOT get confused by multiple questions.
  2. Answer each question individually in order (e.g., "1. [Direct Answer / Option]", "2. [Direct Answer / Option]").
  3. For multiple-choice questions, clearly specify the correct option letter and text.
  4. Keep every answer strictly concise in key points with zero conversational filler.

Analyze the page context and extract the key points and summary:
${pageSnippet}`;
  }
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

// src/ai/provider-manager.ts
async function getProvider() {
  const settings = await getSettings();
  if (settings.provider === "ollama") {
    return new OllamaProvider({
      url: settings.ollamaUrl,
      model: settings.ollamaModel,
      apiKey: settings.ollamaApiKey
    });
  } else {
    return new APIProvider({
      baseUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      model: settings.apiModel
    });
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

// src/background/service-worker.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "browsemind-ask",
    title: "Ask AI",
    contexts: ["selection"]
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "browsemind-ask" && info.selectionText && tab?.id) {
    const selection = info.selectionText;
    const pageContent = "";
    const result = await askAI(selection, pageContent);
    chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_ANSWER",
      answer: result.answer,
      error: result.error,
      debug: result.debug
    });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message.type;
  if (type === "GET_SETTINGS") {
    getSettings().then((settings) => sendResponse({ settings }));
    return true;
  }
  if (type === "SET_SETTINGS") {
    setSettings(message.settings).then(() => sendResponse({ success: true }));
    return true;
  }
  if (type === "ASK_AI") {
    const { selection, pageContent } = message;
    askAI(selection, pageContent).then((result) => sendResponse({ ...result })).catch((err) => sendResponse({ error: err.message }));
    return true;
  }
  if (type === "TEST_AI") {
    getProvider().then((provider) => provider.testAI()).then((ok) => sendResponse({ success: ok })).catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (type === "GET_OLLAMA_MODELS") {
    const url = (message.url || "http://localhost:11434").replace(/\/+$/, "");
    const apiKey = message.apiKey;
    const headers = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    fetch(`${url}/api/tags`, { headers }).then(async (resp) => {
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Failed to list models (${resp.status}): ${txt}`);
      }
      return resp.json();
    }).then((data) => sendResponse({ models: data.models || [] })).catch((e) => sendResponse({ error: e.message }));
    return true;
  }
  return false;
});
//# sourceMappingURL=service-worker.js.map

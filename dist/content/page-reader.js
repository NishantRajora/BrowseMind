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

// src/content/page-reader.ts
async function extractPageContent() {
  const settings = await getSettings();
  const maxChars = settings.maxText ?? 3e4;
  const clone = document.body.cloneNode(true);
  const selectors = [
    "script",
    "style",
    "noscript",
    "header",
    "nav",
    "footer",
    "aside",
    "svg",
    "canvas",
    ".ad",
    ".ads",
    ".advertisement",
    ".cookie",
    ".popup",
    ".modal"
  ];
  selectors.forEach((sel) => {
    const elems = clone.querySelectorAll(sel);
    elems.forEach((el) => el.remove());
  });
  const allElems = clone.querySelectorAll("*");
  allElems.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      el.remove();
    }
  });
  let text = (clone.textContent || "").trim().replace(/\s+/g, " ");
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }
  return text;
}
export {
  extractPageContent
};
//# sourceMappingURL=page-reader.js.map

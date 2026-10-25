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
  const blockTags = ["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "br", "section", "article"];
  blockTags.forEach((tag) => {
    clone.querySelectorAll(tag).forEach((el) => {
      el.prepend(document.createTextNode("\n"));
    });
  });
  let text = (clone.textContent || "").replace(/[ \t\r]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }
  return text;
}

// src/content/content.ts
var askButton = null;
var panel = null;
function removeAskButton() {
  if (askButton) {
    askButton.remove();
    askButton = null;
  }
}
function createAskButton(rect) {
  removeAskButton();
  askButton = document.createElement("div");
  askButton.id = "browsemind-ask-btn";
  askButton.textContent = "Ask AI (Tab)";
  Object.assign(askButton.style, {
    position: "absolute",
    top: `${rect.bottom + window.scrollY + 4}px`,
    left: `${rect.left + window.scrollX}px`,
    background: "rgba(0, 122, 255, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#fff",
    padding: "3px 7px",
    borderRadius: "4px",
    cursor: "pointer",
    zIndex: "2147483647",
    fontSize: "11px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    userSelect: "none"
  });
  document.body.appendChild(askButton);
  askButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? "";
    removeAskButton();
    const settings = await getSettings();
    await triggerAI(selectedText, settings);
  });
}
async function triggerAI(selectedText, settings) {
  showPanel("\u2022 \u2022 \u2022", void 0, settings);
  const pageContent = await extractPageContent();
  chrome.runtime.sendMessage(
    { type: "ASK_AI", selection: selectedText, pageContent },
    (response) => {
      if (response?.error) {
        showPanel(`\u274C ${response.error}`, void 0, settings);
      } else {
        showPanel(response?.answer ?? "", response?.debug, settings);
      }
    }
  );
}
function parseRgb(colorStr) {
  if (!colorStr || colorStr === "transparent")
    return null;
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== void 0 ? parseFloat(match[4]) : 1
    };
  }
  return null;
}
function detectBackgroundColor(x, y) {
  let el = null;
  try {
    el = document.elementFromPoint(x, y);
  } catch {
  }
  if (!el)
    el = document.body || document.documentElement;
  while (el && el !== document.documentElement) {
    const bg = window.getComputedStyle(el).backgroundColor;
    const parsed = parseRgb(bg);
    if (parsed && parsed.a > 0.05) {
      return { r: parsed.r, g: parsed.g, b: parsed.b };
    }
    el = el.parentElement;
  }
  if (document.documentElement) {
    const bg = window.getComputedStyle(document.documentElement).backgroundColor;
    const parsed = parseRgb(bg);
    if (parsed && parsed.a > 0.05) {
      return { r: parsed.r, g: parsed.g, b: parsed.b };
    }
  }
  return { r: 255, g: 255, b: 255 };
}
function getCamouflageStyle(bg) {
  const lum = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;
  let textR;
  let textG;
  let textB;
  if (lum > 210) {
    textR = Math.max(0, Math.round(bg.r - 35));
    textG = Math.max(0, Math.round(bg.g - 35));
    textB = Math.max(0, Math.round(bg.b - 35));
  } else {
    textR = Math.min(255, Math.round(bg.r + (255 - bg.r) * 0.14 + 30));
    textG = Math.min(255, Math.round(bg.g + (255 - bg.g) * 0.14 + 30));
    textB = Math.min(255, Math.round(bg.b + (255 - bg.b) * 0.14 + 30));
  }
  return {
    color: `rgb(${textR}, ${textG}, ${textB})`,
    textShadow: "none"
  };
}
function showPanel(content, debug, settings) {
  const fontSize = settings?.fontSize ?? 13;
  const rawOpacity = settings?.panelOpacity ?? 80;
  const opacity = Math.min(Math.max(rawOpacity, 10), 100) / 100;
  const position = settings?.panelPosition ?? "left";
  const camouflage = settings?.camouflageMode ?? false;
  let textColor = "#ffffff";
  let textShadow = `
    -1px -1px 1px rgba(0,0,0,0.9),
     1px -1px 1px rgba(0,0,0,0.9),
    -1px  1px 1px rgba(0,0,0,0.9),
     1px  1px 1px rgba(0,0,0,0.9),
     0px  2px 4px rgba(0,0,0,0.95)
  `;
  if (camouflage) {
    const testX = position === "right" ? Math.max(window.innerWidth - 100, 20) : 40;
    const testY = Math.round(window.innerHeight * 0.2);
    const bg = detectBackgroundColor(testX, testY);
    const camStyle = getCamouflageStyle(bg);
    textColor = camStyle.color;
    textShadow = camStyle.textShadow;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "browsemind-panel";
    Object.assign(panel.style, {
      position: "fixed",
      top: "14%",
      width: "380px",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "82vh",
      background: "transparent",
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      zIndex: "2147483647",
      display: "block",
      overflowY: "auto",
      cursor: "grab",
      userSelect: "text",
      scrollbarWidth: "none"
    });
    if (position === "right") {
      panel.style.right = "24px";
      panel.style.left = "auto";
    } else {
      panel.style.left = "24px";
      panel.style.right = "auto";
    }
    panel.addEventListener("dblclick", () => {
      panel?.remove();
      panel = null;
    });
    const contentDiv2 = document.createElement("div");
    contentDiv2.id = "browsemind-panel-content";
    contentDiv2.style.cssText = `
      padding: 0;
      margin: 0;
      font-size: ${fontSize}px;
      line-height: 1.5;
      font-weight: 500;
      color: ${textColor};
      opacity: ${opacity};
      text-shadow: ${textShadow};
      white-space: pre-wrap;
      word-break: break-word;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    panel.appendChild(contentDiv2);
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    panel.onmousedown = (e) => {
      if (e.target !== contentDiv2 && e.target !== panel)
        return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      panel.style.right = "auto";
      panel.style.left = `${initialLeft}px`;
      panel.style.top = `${initialTop}px`;
      panel.style.cursor = "grabbing";
    };
    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !panel)
        return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        document.body.style.userSelect = "none";
        const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, initialLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - 40, initialTop + dy));
        panel.style.left = `${newLeft}px`;
        panel.style.top = `${newTop}px`;
      }
    });
    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = "";
        if (panel)
          panel.style.cursor = "grab";
      }
    });
    document.body.appendChild(panel);
  }
  const contentDiv = panel.querySelector("#browsemind-panel-content");
  contentDiv.style.fontSize = `${fontSize}px`;
  contentDiv.style.opacity = `${opacity}`;
  contentDiv.style.color = textColor;
  contentDiv.style.textShadow = textShadow;
  contentDiv.textContent = content;
}
document.addEventListener("keydown", async (e) => {
  if (e.key === "Escape") {
    if (panel) {
      panel.remove();
      panel = null;
    }
    removeAskButton();
    return;
  }
  if (e.key === "Tab") {
    const target = e.target;
    const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? "";
    if (isEditable && !selectedText) {
      return;
    }
    const settings = await getSettings();
    if (!settings.enabled || settings.tabHotkey === false) {
      return;
    }
    e.preventDefault();
    removeAskButton();
    await triggerAI(selectedText, settings);
  }
});
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "SHOW_ANSWER") {
    const settings = await getSettings();
    if (msg.error) {
      showPanel(`\u274C ${msg.error}`, void 0, settings);
    } else {
      showPanel(msg.answer ?? "", msg.debug, settings);
    }
  }
});
document.addEventListener("mouseup", async () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) {
    removeAskButton();
    return;
  }
  const text = sel.toString().trim();
  if (!text) {
    removeAskButton();
    return;
  }
  const settings = await getSettings();
  if (!settings.enabled) {
    removeAskButton();
    return;
  }
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  createAskButton(rect);
});
//# sourceMappingURL=content.js.map

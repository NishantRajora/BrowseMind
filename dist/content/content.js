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
  askButton.textContent = "Ask AI";
  Object.assign(askButton.style, {
    position: "absolute",
    top: `${rect.bottom + window.scrollY + 4}px`,
    left: `${rect.left + window.scrollX}px`,
    background: "#007aff",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    zIndex: "2147483647",
    fontSize: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    userSelect: "none"
  });
  document.body.appendChild(askButton);
  askButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? "";
    if (!selectedText) {
      removeAskButton();
      return;
    }
    removeAskButton();
    const pageContent = await extractPageContent();
    chrome.runtime.sendMessage(
      { type: "ASK_AI", selection: selectedText, pageContent },
      (response) => {
        if (response?.error) {
          showPanel(`\u274C Error: ${response.error}`);
        } else {
          showPanel(response?.answer ?? "No answer", response?.debug);
        }
      }
    );
  });
}
function showPanel(content, debug) {
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "browsemind-panel";
    Object.assign(panel.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "360px",
      maxHeight: "50vh",
      background: "#fff",
      color: "#000",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: "2147483647",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "sans-serif"
    });
    const header = document.createElement("div");
    header.id = "browsemind-panel-header";
    header.style.cssText = "padding:4px 8px;background:#007aff;color:#fff;cursor:move;display:flex;justify-content:space-between;align-items:center;";
    const title = document.createElement("span");
    title.textContent = "BrowseMind";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "\u2715";
    closeBtn.style.cssText = "background:none;border:none;color:#fff;cursor:pointer;font-size:14px;";
    closeBtn.onclick = () => {
      panel?.remove();
      panel = null;
    };
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    const contentDiv2 = document.createElement("div");
    contentDiv2.id = "browsemind-panel-content";
    contentDiv2.style.cssText = "padding:8px;overflow:auto;flex:1;";
    panel.appendChild(contentDiv2);
    const debugContainer2 = document.createElement("div");
    debugContainer2.id = "browsemind-debug";
    debugContainer2.style.cssText = "padding:4px;background:#f5f5f5;color:#333;font-size:12px;max-height:150px;overflow:auto;display:none;";
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear Logs";
    clearBtn.style.cssText = "margin:4px;font-size:12px;";
    clearBtn.onclick = () => {
      debugContainer2.innerHTML = "";
    };
    debugContainer2.appendChild(clearBtn);
    panel.appendChild(debugContainer2);
    let isDragging = false;
    let startX = 0, startY = 0, startRight = 0, startBottom = 0;
    header.onmousedown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startRight = rect.right - rect.width;
      startBottom = window.innerHeight - rect.bottom;
      document.body.style.userSelect = "none";
    };
    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !panel)
        return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newRight = Math.max(startRight + dx, 0);
      const newBottom = Math.max(startBottom - dy, 0);
      panel.style.right = `${newRight}px`;
      panel.style.bottom = `${newBottom}px`;
    });
    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = "";
      }
    });
    document.body.appendChild(panel);
  }
  const contentDiv = panel.querySelector("#browsemind-panel-content");
  contentDiv.textContent = content;
  const debugContainer = panel.querySelector("#browsemind-debug");
  if (debug && debugContainer) {
    debugContainer.style.display = "block";
    const clearBtn = debugContainer.querySelector("button");
    if (clearBtn) {
      const content2 = debugContainer.cloneNode(true);
      const btn = content2.querySelector("button");
      debugContainer.innerHTML = "";
      debugContainer.appendChild(btn);
    }
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(debug, null, 2);
    debugContainer.appendChild(pre);
  } else if (debugContainer) {
    debugContainer.style.display = "none";
  }
}
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_ANSWER") {
    if (msg.error) {
      showPanel(`\u274C Error: ${msg.error}`);
    } else {
      showPanel(msg.answer ?? "No answer", msg.debug);
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

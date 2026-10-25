import { getSettings } from "../shared/storage";
import { extractPageContent } from "./page-reader";
import { ExtensionSettings } from "../shared/types";

/**
 * Content script that:
 *  - Handles Tab key hotkey to instantly query AI (with or without selected text).
 *  - Shows an "Ask AI" button near text selection.
 *  - Displays answers in a sleek, transparent stealth panel on the left side.
 *  - Supports adjusting font size and transparency via settings.
 *  - Escape key dismisses the panel.
 */

let askButton: HTMLDivElement | null = null;
let panel: HTMLDivElement | null = null;

function removeAskButton() {
  if (askButton) {
    askButton.remove();
    askButton = null;
  }
}

function createAskButton(rect: DOMRect) {
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
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    zIndex: "2147483647",
    fontSize: "12px",
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

async function triggerAI(selectedText: string, settings: ExtensionSettings) {
  showPanel("⏳ Fetching key points...", undefined, settings);
  const pageContent = await extractPageContent();
  chrome.runtime.sendMessage(
    { type: "ASK_AI", selection: selectedText, pageContent },
    (response: any) => {
      if (response?.error) {
        showPanel(`❌ Error: ${response.error}`, undefined, settings);
      } else {
        showPanel(response?.answer ?? "No answer received.", response?.debug, settings);
      }
    }
  );
}

function showPanel(content: string, debug?: any, settings?: ExtensionSettings) {
  const fontSize = settings?.fontSize ?? 13;
  const rawOpacity = settings?.panelOpacity ?? 80;
  const opacity = Math.min(Math.max(rawOpacity, 10), 100) / 100;
  const position = settings?.panelPosition ?? "left";

  // Create panel if not already present
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "browsemind-panel";
    Object.assign(panel.style, {
      position: "fixed",
      top: "15%",
      width: "360px",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "75vh",
      background: `rgba(18, 22, 28, ${opacity})`,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      color: "rgba(255, 255, 255, 0.95)",
      textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      borderRadius: "10px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      zIndex: "2147483647",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    if (position === "right") {
      panel.style.right = "20px";
      panel.style.left = "auto";
    } else {
      panel.style.left = "20px";
      panel.style.right = "auto";
    }

    const header = document.createElement("div");
    header.id = "browsemind-panel-header";
    header.style.cssText = `
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.08);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.7);
    `;

    const title = document.createElement("span");
    title.textContent = "BrowseMind • Key Points";
    title.style.fontWeight = "600";

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.gap = "8px";

    const escHint = document.createElement("span");
    escHint.textContent = "Esc to close";
    escHint.style.cssText = "font-size: 10px; opacity: 0.6; text-transform: none;";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 13px;
      padding: 0 4px;
      line-height: 1;
    `;
    closeBtn.onclick = () => {
      panel?.remove();
      panel = null;
    };

    controls.appendChild(escHint);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);
    panel.appendChild(header);

    const contentDiv = document.createElement("div");
    contentDiv.id = "browsemind-panel-content";
    contentDiv.style.cssText = `
      padding: 12px 14px;
      overflow-y: auto;
      flex: 1;
      font-size: ${fontSize}px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    panel.appendChild(contentDiv);

    const debugContainer = document.createElement("div");
    debugContainer.id = "browsemind-debug";
    debugContainer.style.cssText = "padding: 6px; background: rgba(0,0,0,0.5); color: #ccc; font-size: 11px; max-height: 140px; overflow: auto; display: none; border-top: 1px solid rgba(255,255,255,0.1);";
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear Logs";
    clearBtn.style.cssText = "margin: 2px; font-size: 11px; padding: 2px 6px;";
    clearBtn.onclick = () => {
      debugContainer.innerHTML = "";
    };
    debugContainer.appendChild(clearBtn);
    panel.appendChild(debugContainer);

    // Drag handling
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    header.onmousedown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel!.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      panel!.style.right = "auto"; // clear right offset for left-based drag
      panel!.style.left = `${initialLeft}px`;
      panel!.style.top = `${initialTop}px`;
      document.body.style.userSelect = "none";
    };

    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !panel) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, initialLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 40, initialTop + dy));
      panel.style.left = `${newLeft}px`;
      panel.style.top = `${newTop}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = "";
      }
    });

    document.body.appendChild(panel);
  } else {
    // Update dynamic styling if settings changed
    panel.style.background = `rgba(18, 22, 28, ${opacity})`;
  }

  const contentDiv = panel.querySelector<HTMLDivElement>("#browsemind-panel-content")!;
  contentDiv.style.fontSize = `${fontSize}px`;
  contentDiv.textContent = content;

  const debugContainer = panel.querySelector<HTMLDivElement>("#browsemind-debug")!;
  if (debug && debugContainer) {
    debugContainer.style.display = "block";
    const clearBtn = debugContainer.querySelector("button");
    if (clearBtn) {
      debugContainer.innerHTML = "";
      debugContainer.appendChild(clearBtn);
    }
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(debug, null, 2);
    debugContainer.appendChild(pre);
  } else if (debugContainer) {
    debugContainer.style.display = "none";
  }
}

// Hotkey listener: Tab key triggers AI; Escape closes panel
document.addEventListener("keydown", async (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (panel) {
      panel.remove();
      panel = null;
    }
    removeAskButton();
    return;
  }

  if (e.key === "Tab") {
    const target = e.target as HTMLElement | null;
    const isEditable = target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );

    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? "";

    // If focused inside an editable text element without selection, allow normal Tab
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

// Listen for messages from background (e.g., context‑menu flow)
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "SHOW_ANSWER") {
    const settings = await getSettings();
    if (msg.error) {
      showPanel(`❌ Error: ${msg.error}`, undefined, settings);
    } else {
      showPanel(msg.answer ?? "No answer", msg.debug, settings);
    }
  }
});

// Listen for mouseup to detect selection changes and show optional Ask AI button
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

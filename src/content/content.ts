import { getSettings } from "../shared/storage";
import { extractPageContent } from "./page-reader";
import { ExtensionSettings } from "../shared/types";

/**
 * Content script that:
 *  - Handles Tab key hotkey to instantly query AI (with or without selected text).
 *  - Completely transparent, seamless stealth overlay on the left side (looks like part of the page).
 *  - No headers, no "BrowseMind", no "Esc to close", no background box or borders.
 *  - Drag anywhere on the text to reposition.
 *  - Press Escape or double-click to close.
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

async function triggerAI(selectedText: string, settings: ExtensionSettings) {
  showPanel("• • •", undefined, settings);
  const pageContent = await extractPageContent();
  chrome.runtime.sendMessage(
    { type: "ASK_AI", selection: selectedText, pageContent },
    (response: any) => {
      if (response?.error) {
        showPanel(`❌ ${response.error}`, undefined, settings);
      } else {
        showPanel(response?.answer ?? "", response?.debug, settings);
      }
    }
  );
}

function parseRgb(colorStr: string): { r: number; g: number; b: number; a: number } | null {
  if (!colorStr || colorStr === "transparent") return null;
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1
    };
  }
  return null;
}

function detectBackgroundColor(x: number, y: number): { r: number; g: number; b: number } {
  let el: Element | null = null;
  try {
    el = document.elementFromPoint(x, y);
  } catch {}

  if (!el) el = document.body || document.documentElement;

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

  // Fallback to white if everywhere transparent
  return { r: 255, g: 255, b: 255 };
}

function getCamouflageStyle(bg: { r: number; g: number; b: number }): { color: string; textShadow: string } {
  const lum = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;

  let textR: number;
  let textG: number;
  let textB: number;

  if (lum > 210) {
    // Very light or white background: slightly darker/off-white tone so it is barely visible
    textR = Math.max(0, Math.round(bg.r - 35));
    textG = Math.max(0, Math.round(bg.g - 35));
    textB = Math.max(0, Math.round(bg.b - 35));
  } else {
    // Dark or mid-tone background: a slightly lighter tone of the same background color
    textR = Math.min(255, Math.round(bg.r + (255 - bg.r) * 0.14 + 30));
    textG = Math.min(255, Math.round(bg.g + (255 - bg.g) * 0.14 + 30));
    textB = Math.min(255, Math.round(bg.b + (255 - bg.b) * 0.14 + 30));
  }

  return {
    color: `rgb(${textR}, ${textG}, ${textB})`,
    textShadow: "none"
  };
}

function showPanel(content: string, debug?: any, settings?: ExtensionSettings) {
  const fontSize = settings?.fontSize ?? 13;
  const rawOpacity = settings?.panelOpacity ?? 80;
  const opacity = Math.min(Math.max(rawOpacity, 10), 100) / 100;
  const position = settings?.panelPosition ?? "left";
  const camouflage = settings?.camouflageMode ?? false;

  // Determine styling based on camouflage mode
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

  // Create panel if not already present
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

    // Double-click to quickly dismiss
    panel.addEventListener("dblclick", () => {
      panel?.remove();
      panel = null;
    });

    const contentDiv = document.createElement("div");
    contentDiv.id = "browsemind-panel-content";
    contentDiv.style.cssText = `
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
    panel.appendChild(contentDiv);

    // Draggable anywhere on the transparent text
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    panel.onmousedown = (e) => {
      if (e.target !== contentDiv && e.target !== panel) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel!.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      panel!.style.right = "auto";
      panel!.style.left = `${initialLeft}px`;
      panel!.style.top = `${initialTop}px`;
      panel!.style.cursor = "grabbing";
    };

    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !panel) return;
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
        if (panel) panel.style.cursor = "grab";
      }
    });

    document.body.appendChild(panel);
  }

  const contentDiv = panel.querySelector<HTMLDivElement>("#browsemind-panel-content")!;
  contentDiv.style.fontSize = `${fontSize}px`;
  contentDiv.style.opacity = `${opacity}`;
  contentDiv.style.color = textColor;
  contentDiv.style.textShadow = textShadow;
  contentDiv.textContent = content;
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

    // If focused inside an editable text field without selected text, allow normal Tab navigation
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

// Listen for messages from background (e.g., context-menu flow)
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "SHOW_ANSWER") {
    const settings = await getSettings();
    if (msg.error) {
      showPanel(`❌ ${msg.error}`, undefined, settings);
    } else {
      showPanel(msg.answer ?? "", msg.debug, settings);
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

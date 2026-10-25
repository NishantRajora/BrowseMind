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
      color: #ffffff;
      opacity: ${opacity};
      text-shadow:
        -1px -1px 1px rgba(0,0,0,0.9),
         1px -1px 1px rgba(0,0,0,0.9),
        -1px  1px 1px rgba(0,0,0,0.9),
         1px  1px 1px rgba(0,0,0,0.9),
         0px  2px 4px rgba(0,0,0,0.95);
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
      // Allow selecting text with left click drag if not quick mouse down
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
      // Only drag if moved more than 4 pixels (distinguishes text selection from drag)
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

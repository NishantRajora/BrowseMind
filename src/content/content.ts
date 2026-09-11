import { getSettings } from "../shared/storage";
import { extractPageContent } from "./page-reader";

/**
 * Content script that:
 *  - Shows an "Ask AI" button near a text selection.
 *  - Sends the selection and page excerpt to the background.
 *  - Receives the AI answer (or error) and displays it in a draggable floating panel.
 *  - Shows a debug console when Debug Mode is enabled.
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
      (response: any) => {
        if (response?.error) {
          showPanel(`❌ Error: ${response.error}`);
        } else {
          showPanel(response?.answer ?? "No answer", response?.debug);
        }
      }
    );
  });
}

function showPanel(content: string, debug?: any) {
  // Create panel if not already present
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
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "background:none;border:none;color:#fff;cursor:pointer;font-size:14px;";
    closeBtn.onclick = () => {
      panel?.remove();
      panel = null;
    };
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const contentDiv = document.createElement("div");
    contentDiv.id = "browsemind-panel-content";
    contentDiv.style.cssText = "padding:8px;overflow:auto;flex:1;";
    panel.appendChild(contentDiv);

    const debugContainer = document.createElement("div");
    debugContainer.id = "browsemind-debug";
    debugContainer.style.cssText = "padding:4px;background:#f5f5f5;color:#333;font-size:12px;max-height:150px;overflow:auto;display:none;";
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear Logs";
    clearBtn.style.cssText = "margin:4px;font-size:12px;";
    clearBtn.onclick = () => {
      debugContainer.innerHTML = "";
    };
    debugContainer.appendChild(clearBtn);
    panel.appendChild(debugContainer);

    // Drag handling
    let isDragging = false;
    let startX = 0,
      startY = 0,
      startRight = 0,
      startBottom = 0;
    header.onmousedown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel!.getBoundingClientRect();
      startRight = rect.right - rect.width; // left offset
      startBottom = window.innerHeight - rect.bottom;
      document.body.style.userSelect = "none";
    };
    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !panel) return;
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

  const contentDiv = panel.querySelector<HTMLDivElement>("#browsemind-panel-content")!;
  contentDiv.textContent = content;

  const debugContainer = panel.querySelector<HTMLDivElement>("#browsemind-debug")!;
  if (debug && debugContainer) {
    debugContainer.style.display = "block";
    // Clear previous logs before adding new one
    const clearBtn = debugContainer.querySelector("button");
    if (clearBtn) {
      const content = debugContainer.cloneNode(true) as HTMLDivElement;
      const btn = content.querySelector("button");
      debugContainer.innerHTML = "";
      debugContainer.appendChild(btn!);
    }
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(debug, null, 2);
    debugContainer.appendChild(pre);
  } else if (debugContainer) {
    debugContainer.style.display = "none";
  }
}

// Listen for messages from background (e.g., context‑menu flow)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_ANSWER") {
    if (msg.error) {
      showPanel(`❌ Error: ${msg.error}`);
    } else {
      showPanel(msg.answer ?? "No answer", msg.debug);
    }
  }
});

// Listen for mouseup to detect selection changes
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

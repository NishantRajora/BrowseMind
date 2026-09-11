import { getSettings, setSettings } from "../shared/storage";
import { askAI } from "../ai/ai-service";
import { getProvider } from "../ai/provider-manager";

chrome.runtime.onInstalled.addListener(() => {
  // Create context‑menu entry for selection.
  chrome.contextMenus.create({
    id: "browsemind-ask",
    title: "Ask AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "browsemind-ask" && info.selectionText && tab?.id) {
    // For the context‑menu flow we invoke the AI directly.
    const selection = info.selectionText;
    const pageContent = ""; // page content omitted for simplicity.
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
    return true; // async response
  }

  if (type === "SET_SETTINGS") {
    setSettings(message.settings).then(() => sendResponse({ success: true }));
    return true;
  }

  if (type === "ASK_AI") {
    const { selection, pageContent } = message;
    askAI(selection, pageContent)
      .then((result) => sendResponse({ ...result }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (type === "TEST_AI") {
    // Test the active provider.
    getProvider()
      .then((provider) => provider.testAI())
      .then((ok) => sendResponse({ success: ok }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (type === "GET_OLLAMA_MODELS") {
    const url = message.url;
    fetch(`${url.replace(/\\+$/, "")}/api/tags`)
      .then((resp) => resp.json())
      .then((data) => sendResponse({ models: data.models || [] }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  // Unknown message type.
  return false;
});

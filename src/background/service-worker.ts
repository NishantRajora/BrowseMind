import { AIService } from '../ai/ai-service.js';
import { Storage } from '../shared/storage.js';
import { AIRequest, DebugLogEntry, UserPreferences } from '../shared/types.js';
import { redactSensitiveInfo } from '../shared/utils.js';
import { SYSTEM_PROMPTS } from '../ai/prompts.js';

const aiService = new AIService();

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[BrowseMind] Background service worker installed');
  await createContextMenu();
});

async function createContextMenu() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: 'browsemind-root',
    title: 'BrowseMind',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'send-to-ai',
    parentId: 'browsemind-root',
    title: 'Send to AI',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'scan-page',
    parentId: 'browsemind-root',
    title: 'Scan Page & Send to AI',
    contexts: ['page'],
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[BrowseMind] Context menu clicked:', info.menuItemId);
  const prefs = await Storage.getPreferences();
  if (!prefs.enabled) {
    console.log('[BrowseMind] Extension disabled, ignoring request');
    return;
  }

  if (!tab.id) return;

  let request: AIRequest;
  if (info.menuItemId === 'send-to-ai') {
    request = {
      action: 'selected-text',
      payload: info.selectionText || '',
      context: {
        pageTitle: tab.title || '',
        pageUrl: tab.url || '',
        selectedText: info.selectionText,
      },
    };
  } else if (info.menuItemId === 'scan-page') {
    console.log('[BrowseMind] Scanning page for tab:', tab.id);
    chrome.tabs.sendMessage(tab.id, { action: 'start-scan' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[BrowseMind] Error sending scan message:', chrome.runtime.lastError);
        return;
      }
      if (response && response.content) {
        processAIRequest({
          action: 'scan-page',
          payload: 'Analyze this page',
          context: {
            pageTitle: tab.title || '',
            pageUrl: tab.url || '',
            webpageContent: response.content,
          },
        }, tab.id);
      }
    });
    return;
  } else {
    return;
  }

  processAIRequest(request, tab.id);
});

async function processAIRequest(request: AIRequest, tabId: number) {
  console.log('[BrowseMind] Processing AI Request:', request.action);
  try {
    const config = await Storage.getConfig();
    console.log(`[BrowseMind] Using Provider: ${config.provider}, Model: ${config.provider === 'ollama' ? config.ollama.model : config.openai.model}`);

    const response = await aiService.generateResponse(request);
    console.log('[BrowseMind] AI response received successfully');

    // Log for debug mode
    const prefs = await Storage.getPreferences();
    if (prefs.debugMode) {
      await logDebugInfo(request, response);
    }

    chrome.tabs.sendMessage(tabId, { action: 'show-response', response }, (err) => {
      if (chrome.runtime.lastError) {
        console.error('[BrowseMind] Error sending response to tab:', chrome.runtime.lastError);
      } else {
        console.log('[BrowseMind] Response sent to tab successfully');
      }
    });
  } catch (error: any) {
    console.error('[BrowseMind] AI Request failed:', error);

    const prefs = await Storage.getPreferences();
    if (prefs.debugMode) {
      await logDebugFailure(request, error);
    }

    chrome.tabs.sendMessage(tabId, { action: 'show-error', error }, (err) => {
      if (chrome.runtime.lastError) {
        console.error('[BrowseMind] Error sending error to tab:', chrome.runtime.lastError);
      }
    });
  }
}

async function logDebugInfo(request: AIRequest, response: any) {
  const config = await Storage.getConfig();
  const log: DebugLogEntry = {
    id: Date.now(),
    timestamp: Date.now(),
    request,
    provider: config.provider,
    model: config.provider === 'ollama' ? config.ollama.model : config.openai.model,
    systemPrompt: SYSTEM_PROMPTS.DEFAULT,
    userPrompt: `Page Title: ${request.context.pageTitle}\nPage URL: ${request.context.pageUrl}\n` +
                (request.action === 'scan-page' ? `Webpage Content: ${request.context.webpageContent}\n` : '') +
                `Question/Text: ${request.payload}`,
    response: response.content,
    status: `${response.status} OK`,
    duration: response.duration,
    success: true,
  };

  await Storage.addDebugLog(log);
}

async function logDebugFailure(request: AIRequest, error: any) {
  const config = await Storage.getConfig();
  const log: DebugLogEntry = {
    id: Date.now(),
    timestamp: Date.now(),
    request,
    provider: config.provider,
    model: config.provider === 'ollama' ? config.ollama.model : config.openai.model,
    systemPrompt: SYSTEM_PROMPTS.DEFAULT,
    userPrompt: `Page Title: ${request.context.pageTitle}\nPage URL: ${request.context.pageUrl}\n` +
                (request.action === 'scan-page' ? `Webpage Content: ${request.context.webpageContent}\n` : '') +
                `Question/Text: ${request.payload}`,
    response: error.message || 'An unknown error occurred',
    status: error.type || 'ERROR',
    duration: 0,
    success: false,
    error: error,
  };

  await Storage.addDebugLog(log);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BrowseMind] Message received in background:', message.action);
  if (message.action === 'send-selected-text') {
    const tab = sender.tab;
    if (tab?.id) {
      processAIRequest({
        action: 'selected-text',
        payload: message.payload,
        context: {
          pageTitle: tab.title || '',
          pageUrl: tab.url || '',
          selectedText: message.payload,
        },
      }, tab.id);
    } else {
      console.error('[BrowseMind] Sender tab not found for send-selected-text');
    }
    return false;
  }
  if (message.action === 'test-connection') {
    aiService.testConnection().then(res => sendResponse(res)).catch(err => sendResponse({ success: false, message: err.message }));
    return true;
  }
  if (message.action === 'get-debug-logs') {
    Storage.getDebugLogs().then(logs => sendResponse(logs));
    return true;
  }
  if (message.action === 'clear-debug-logs') {
    Storage.clearDebugLogs().then(() => sendResponse({ success: true }));
    return true;
  }
});

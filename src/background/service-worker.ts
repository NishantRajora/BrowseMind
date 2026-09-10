import { aiService } from '../ai/ai-service';
import { PROMPT_TEMPLATES } from '../ai/prompts';
import { AIRequest } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'bm-ask',
    title: 'Ask BrowseMind',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'bm-explain',
    title: 'Explain Selection',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'bm-analyze',
    title: 'Analyze Page with BrowseMind',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab.id) return;

  let request: AIRequest;
  if (info.menuItemId === 'bm-ask') {
    request = {
      prompt: PROMPT_TEMPLATES.ASK(info.selectionText || '', 'What does this mean?'),
    };
  } else if (info.menuItemId === 'bm-explain') {
    request = {
      prompt: PROMPT_TEMPLATES.EXPLAIN(info.selectionText || ''),
    };
  } else if (info.menuItemId === 'bm-analyze') {
    const content = await extractPageContent(tab.id);
    request = {
      prompt: PROMPT_TEMPLATES.ANALYZE(content),
    };
  } else {
    return;
  }

  const response = await aiService.request(request);
  chrome.tabs.sendMessage(tab.id, {
    type: 'AI_RESPONSE',
    data: response,
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AI_REQUEST') {
    const { type, text, question } = message.data;
    let prompt: string;

    if (type === 'ASK') {
      prompt = PROMPT_TEMPLATES.ASK(text, question || 'What does this mean?');
    } else if (type === 'EXPLAIN') {
      prompt = PROMPT_TEMPLATES.EXPLAIN(text);
    } else if (type === 'ANALYZE') {
      prompt = PROMPT_TEMPLATES.ANALYZE(text);
    } else {
      prompt = text;
    }

    aiService.request({ prompt }).then(sendResponse);
    return true; // Keep channel open for async response
  } else if (message.type === 'TEST_CONNECTION') {
    aiService.request({ prompt: 'Hello! Please respond with a short "Connection Successful!"' })
      .then(sendResponse);
    return true;
  } else if (message.type === 'GET_OLLAMA_MODELS') {
    const { url } = message.data;
    fetch(`${url}/api/tags`)
      .then(response => response.json())
      .then(data => {
        // Ollama returns { models: [ { name: "...", ... }, ... ] }
        const models = data.models ? data.models.map((m: any) => m.name) : [];
        sendResponse({ models });
      })
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function extractPageContent(tabId: number): Promise<string> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_CONTENT' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve('');
      } else {
        resolve(response.content);
      }
    });
  });
}

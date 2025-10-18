import { MessageType } from "../common/messaging.js";
import { summarizeText, chatAboutSelection, getProviderInfo, listGeminiModels } from "../common/ai.js";

function isInjectableUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const blocked = new Set(["chrome.google.com", "chromewebstore.google.com"]);
    if (u.protocol === "chrome:" || u.protocol === "chrome-extension:" || u.protocol === "about:" || u.protocol === "devtools:" || u.protocol === "view-source:") return false;
    if (blocked.has(u.hostname)) return false;
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:";
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-page",
    title: "Summarize this page",
    contexts: ["page"]
  });
  chrome.contextMenus.create({
    id: "chat-selection",
    title: "Ask AI about selection",
    contexts: ["selection"]
  });
  // Re-inject content script into existing tabs after update so users don't need to refresh
  chrome.tabs.query({}, async (tabs) => {
    for (const tab of tabs) {
      if (!tab.id || !isInjectableUrl(tab.url || "")) continue;
      try {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["src/content/styles.css"] });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/content.js"] });
      } catch (e) {
        // ignore tabs where injection isn't allowed
      }
    }
  });
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isInjectableUrl(tab.url || "")) return;

  if (command === "summarize-page") {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.slice(0, 120000)
      });
      const text = result || "";
      const summary = await summarizeText(text);
      chrome.tabs.sendMessage(tab.id, { type: MessageType.SUMMARIZE_PAGE, summary });
    } catch (e) {
      // ignore
    }
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (!tab.url || tab.url.startsWith("chrome://")) {
    // Skip restricted pages
    return;
  }
  if (info.menuItemId === "summarize-page") {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.slice(0, 120000)
      });
      const text = result || "";
      const summary = await summarizeText(text);
      chrome.tabs.sendMessage(tab.id, { type: MessageType.SUMMARIZE_PAGE, summary });
    } catch (e) {
      // ignore injection errors on restricted pages
    }
  }
  if (info.menuItemId === "chat-selection") {
    const selection = info.selectionText || "";
    try {
      const reply = await chatAboutSelection("Explain and answer questions", selection);
      chrome.tabs.sendMessage(tab.id, { type: MessageType.CHAT_SELECTION, reply, selection });
    } catch (e) {
      // ignore
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message?.type) {
        case MessageType.SUMMARIZE_PAGE: {
          const { text, length } = message;
          const summary = await summarizeText(text, { length });
          // Save to history
          chrome.storage.local.get({ summaryHistory: [] }, (data) => {
            const history = data.summaryHistory || [];
            history.unshift({
              summary: summary.slice(0, 500),
              timestamp: Date.now(),
              length: summary.length
            });
            chrome.storage.local.set({ summaryHistory: history.slice(0, 10) });
          });
          sendResponse({ ok: true, summary });
          break;
        }
        case MessageType.SUMMARIZE_SELECTION: {
          const { selection, length } = message;
          const summary = await summarizeText(selection, { length });
          sendResponse({ ok: true, summary });
          break;
        }
        case MessageType.CHAT_SELECTION: {
          const { prompt, selection } = message;
          const reply = await chatAboutSelection(prompt, selection);
          sendResponse({ ok: true, reply });
          break;
        }
        case MessageType.GET_SETTINGS: {
          const info = await getProviderInfo();
          chrome.storage.sync.get({
            provider: "auto",
            useOnDevice: true,
            openaiApiKey: "",
            preferredModel: "gpt-4o-mini",
            geminiApiKey: "",
            geminiModel: "gemini-1.5-flash-001"
          }, (settings) => {
            sendResponse({ ok: true, settings: { ...settings, ...info } });
          });
          break;
        }
        case MessageType.SAVE_SETTINGS: {
          chrome.storage.sync.set(message.settings || {}, () => {
            sendResponse({ ok: true });
          });
          break;
        }
        case MessageType.PROVIDER_INFO: {
          const info = await getProviderInfo();
          sendResponse({ ok: true, info });
          break;
        }
        case MessageType.LIST_GEMINI_MODELS: {
          const models = await listGeminiModels();
          sendResponse({ ok: true, models });
          break;
        }
        case MessageType.LIST_OPENAI_MODELS: {
          try {
            const { apiKey } = message;
            if (!apiKey) {
              sendResponse({ ok: false, error: "API key required" });
              break;
            }
            const response = await fetch("https://api.openai.com/v1/models", {
              headers: {
                "Authorization": `Bearer ${apiKey}`
              }
            });
            if (!response.ok) {
              sendResponse({ ok: false, error: `HTTP ${response.status}` });
              break;
            }
            const data = await response.json();
            sendResponse({ ok: true, models: data.data || [] });
          } catch (err) {
            sendResponse({ ok: false, error: err.message });
          }
          break;
        }
        case MessageType.GET_HISTORY: {
          chrome.storage.local.get({ summaryHistory: [] }, (data) => {
            sendResponse({ ok: true, history: data.summaryHistory || [] });
          });
          break;
        }
        case MessageType.CLEAR_HISTORY: {
          chrome.storage.local.set({ summaryHistory: [] }, () => {
            sendResponse({ ok: true });
          });
          break;
        }
        default:
          sendResponse({ ok: false, error: "Unknown message type" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true; // async
});



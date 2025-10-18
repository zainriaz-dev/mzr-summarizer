export const MessageType = {
  SUMMARIZE_PAGE: "SUMMARIZE_PAGE",
  SUMMARIZE_SELECTION: "SUMMARIZE_SELECTION",
  CHAT_SELECTION: "CHAT_SELECTION",
  GET_SETTINGS: "GET_SETTINGS",
  SAVE_SETTINGS: "SAVE_SETTINGS",
  PROVIDER_INFO: "PROVIDER_INFO",
  LIST_GEMINI_MODELS: "LIST_GEMINI_MODELS",
  LIST_OPENAI_MODELS: "LIST_OPENAI_MODELS",
  GET_HISTORY: "GET_HISTORY",
  CLEAR_HISTORY: "CLEAR_HISTORY"
};

export function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}



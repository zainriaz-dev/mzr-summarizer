import { MessageType } from "../common/messaging.js";

const provider = document.getElementById("provider");
const openaiApiKey = document.getElementById("openaiApiKey");
const openaiModel = document.getElementById("openaiModel");
const geminiApiKey = document.getElementById("geminiApiKey");
const geminiModel = document.getElementById("geminiModel");
const fetchGeminiModelsBtn = document.getElementById("fetchGeminiModels");
const fetchOpenAIModelsBtn = document.getElementById("fetchOpenAIModels");
const useOnDevice = document.getElementById("useOnDevice");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
const providerInfo = document.getElementById("providerInfo");
const geminiModelsStatus = document.getElementById("geminiModelsStatus");
const openaiModelsStatus = document.getElementById("openaiModelsStatus");

// Modal elements
const showInstructionsBtn = document.getElementById("showInstructions");
const instructionsModal = document.getElementById("instructionsModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const closeModal = document.getElementById("closeModal");

function setStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => (statusEl.textContent = ""), 3000);
}

async function load() {
  const res = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
  const s = res?.settings || {};
  provider.value = s.provider || "auto";
  openaiApiKey.value = s.openaiApiKey || "";
  openaiModel.value = s.preferredModel || "gpt-4o-mini";
  geminiApiKey.value = s.geminiApiKey || "";
  geminiModel.value = s.geminiModel || "gemini-1.5-flash-001";
  useOnDevice.checked = !!s.useOnDevice;
  providerInfo.textContent = `On-device available: ${s.onDeviceAvailable ? "yes" : "no"}`;

  // Enable/disable fetch buttons based on API keys
  fetchGeminiModelsBtn.disabled = geminiApiKey.value.trim().length === 0;
  fetchOpenAIModelsBtn.disabled = openaiApiKey.value.trim().length === 0;

  // Auto-fetch models if keys are present
  if (geminiApiKey.value.trim()) {
    await fetchGeminiModels();
  }
  if (openaiApiKey.value.trim()) {
    await fetchOpenAIModels();
  }
}

saveBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: MessageType.SAVE_SETTINGS,
    settings: {
      provider: provider.value,
      openaiApiKey: openaiApiKey.value.trim(),
      preferredModel: openaiModel.value.trim(),
      geminiApiKey: geminiApiKey.value.trim(),
      geminiModel: geminiModel.value.trim(),
      useOnDevice: useOnDevice.checked
    }
  });
  setStatus("✅ Settings saved!");
});

// Fetch Gemini models
async function fetchGeminiModels() {
  if (!geminiApiKey.value.trim()) {
    geminiModelsStatus.textContent = "⚠️ Enter API key first";
    return;
  }
  
  fetchGeminiModelsBtn.disabled = true;
  geminiModelsStatus.textContent = "⏳ Loading...";
  
  const res = await chrome.runtime.sendMessage({
    type: MessageType.LIST_GEMINI_MODELS,
    apiKey: geminiApiKey.value.trim()
  });
  
  if (res?.ok && res.models?.length > 0) {
    const currentModel = geminiModel.value;
    geminiModel.innerHTML = "";
    
    res.models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = m.displayName || m.name;
      geminiModel.appendChild(opt);
    });
    
    // Restore selection if possible
    const found = Array.from(geminiModel.options).some((o) => o.value === currentModel);
    geminiModel.value = found ? currentModel : res.models[0].name;
    
    geminiModelsStatus.textContent = `✅ Loaded ${res.models.length} models`;
  } else {
    geminiModelsStatus.textContent = `❌ ${res?.error || "Failed to load models"}`;
  }
  
  fetchGeminiModelsBtn.disabled = false;
}

// Fetch OpenAI models
async function fetchOpenAIModels() {
  if (!openaiApiKey.value.trim()) {
    openaiModelsStatus.textContent = "⚠️ Enter API key first";
    return;
  }
  
  fetchOpenAIModelsBtn.disabled = true;
  openaiModelsStatus.textContent = "⏳ Loading...";
  
  const res = await chrome.runtime.sendMessage({
    type: MessageType.LIST_OPENAI_MODELS,
    apiKey: openaiApiKey.value.trim()
  });
  
  if (res?.ok && res.models?.length > 0) {
    const currentModel = openaiModel.value;
    openaiModel.innerHTML = "";
    
    // Filter for GPT models and sort by relevance
    const gptModels = res.models
      .filter(m => m.id.includes('gpt'))
      .sort((a, b) => {
        // Prioritize newer models
        const priority = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5'];
        const aIndex = priority.findIndex(p => a.id.includes(p));
        const bIndex = priority.findIndex(p => b.id.includes(p));
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.id.localeCompare(b.id);
      });
    
    if (gptModels.length > 0) {
      gptModels.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.id;
        openaiModel.appendChild(opt);
      });
      
      // Restore selection if possible
      const found = Array.from(openaiModel.options).some((o) => o.value === currentModel);
      openaiModel.value = found ? currentModel : gptModels[0].id;
      
      openaiModelsStatus.textContent = `✅ Loaded ${gptModels.length} models`;
    } else {
      openaiModelsStatus.textContent = "⚠️ No GPT models found";
    }
  } else {
    openaiModelsStatus.textContent = `❌ ${res?.error || "Failed to load models"}`;
  }
  
  fetchOpenAIModelsBtn.disabled = false;
}

// Event listeners for fetch buttons
fetchGeminiModelsBtn.addEventListener("click", fetchGeminiModels);
fetchOpenAIModelsBtn.addEventListener("click", fetchOpenAIModels);

// Enable/disable fetch buttons based on API key input
geminiApiKey.addEventListener("input", () => {
  fetchGeminiModelsBtn.disabled = geminiApiKey.value.trim().length === 0;
  if (geminiApiKey.value.trim().length === 0) {
    geminiModelsStatus.textContent = "";
  }
});

openaiApiKey.addEventListener("input", () => {
  fetchOpenAIModelsBtn.disabled = openaiApiKey.value.trim().length === 0;
  if (openaiApiKey.value.trim().length === 0) {
    openaiModelsStatus.textContent = "";
  }
});

// Modal text size controls
const modalBody = document.getElementById("modalBody");
const modalTextSmallerBtn = document.getElementById("modal-text-smaller");
const modalTextLargerBtn = document.getElementById("modal-text-larger");
let modalTextSize = 1; // 0=sm, 1=md, 2=lg, 3=xl
const modalTextSizeClasses = ['text-sm', 'text-md', 'text-lg', 'text-xl'];

function setModalTextSize(size) {
  modalTextSize = Math.max(0, Math.min(3, size));
  modalBody.className = modalBody.className.replace(/text-\w+/, '');
  modalBody.classList.add(modalTextSizeClasses[modalTextSize]);
  chrome.storage.local.set({ modalTextSize: modalTextSize });
}

modalTextLargerBtn.addEventListener("click", () => {
  setModalTextSize(modalTextSize + 1);
});

modalTextSmallerBtn.addEventListener("click", () => {
  setModalTextSize(modalTextSize - 1);
});

// Load saved modal text size
chrome.storage.local.get({ modalTextSize: 1 }, (data) => {
  setModalTextSize(data.modalTextSize);
});

// Modal functionality
showInstructionsBtn.addEventListener("click", () => {
  instructionsModal.classList.add("show");
});

closeModalBtn.addEventListener("click", () => {
  instructionsModal.classList.remove("show");
});

closeModal.addEventListener("click", () => {
  instructionsModal.classList.remove("show");
});

// Close modal when clicking outside
instructionsModal.addEventListener("click", (e) => {
  if (e.target === instructionsModal) {
    instructionsModal.classList.remove("show");
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && instructionsModal.classList.contains("show")) {
    instructionsModal.classList.remove("show");
  }
});

// Load settings on page load
load();

// Check if should show instructions (from popup)
chrome.storage.local.get({ showInstructions: false }, (data) => {
  if (data.showInstructions) {
    instructionsModal.classList.add("show");
    chrome.storage.local.remove("showInstructions");
  }
});

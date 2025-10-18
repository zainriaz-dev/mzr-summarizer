import { MessageType } from "../common/messaging.js";

const summarizeBtn = document.getElementById("summarize");
const openPanelBtn = document.getElementById("open-panel");
const output = document.getElementById("output");
const statsCount = document.getElementById("stats-count");
const statsProvider = document.getElementById("stats-provider");
const clearHistoryBtn = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");
const lengthSelector = document.getElementById("length-selector");

// Zoom controls (using scale transform like panel)
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
let currentScale = 1.0; // Default scale (0.8 to 1.4)

// Format controls
const boldBtn = document.getElementById("format-bold");
const italicBtn = document.getElementById("format-italic");
const copyBtn = document.getElementById("copy-output");

// Export controls (Copy Markdown and Text)
const copyMarkdownBtn = document.getElementById("copy-markdown");
const copyTextBtn = document.getElementById("copy-text");

// Text size and expand controls
const textSmallerBtn = document.getElementById("text-smaller");
const textLargerBtn = document.getElementById("text-larger");
const expandBtn = document.getElementById("expand-output");
let currentTextSize = 2; // 0=xs, 1=sm, 2=md, 3=lg, 4=xl, 5=xxl
const textSizeClasses = ['text-xs', 'text-sm', 'text-md', 'text-lg', 'text-xl', 'text-xxl'];

// URL and Notes elements
const summaryUrlInput = document.getElementById("summary-url");
const summaryNotesInput = document.getElementById("summary-notes");
const saveSummaryBtn = document.getElementById("save-summary");
const editUrlBtn = document.getElementById("edit-url-btn");

// Current summary data
let currentSummaryData = {
  summary: '',
  url: '',
  notes: '',
  timestamp: Date.now()
};

// URL editing toggle
let urlEditable = false;

// Toast elements
const apiWarning = document.getElementById("api-warning");
const quickActions = document.getElementById("quick-actions");
const goToOptionsBtn = document.getElementById("go-to-options");
const closeWarningBtn = document.getElementById("close-warning");
const showInstructionsBtn = document.getElementById("show-instructions");
const closeQuickBtn = document.getElementById("close-quick");
const quickTipText = document.getElementById("quick-tip-text");

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isInjectableUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const restrictedHosts = new Set(["chrome.google.com", "chromewebstore.google.com"]);
    if (
      u.protocol === "chrome:" ||
      u.protocol === "chrome-extension:" ||
      u.protocol === "edge:" ||
      u.protocol === "about:" ||
      u.protocol === "devtools:" ||
      u.protocol === "view-source:" ||
      u.protocol === "opera:"
    ) {
      return false;
    }
    if (restrictedHosts.has(u.hostname)) return false;
    if (u.protocol === "file:") return false;
    return true;
  } catch {
    return false;
  }
}

// Check API keys and show warning if needed
async function checkApiKeys() {
  const settingsRes = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
  const settings = settingsRes?.settings || {};
  
  const hasGemini = settings.geminiApiKey && settings.geminiApiKey.trim().length > 0;
  const hasOpenAI = settings.openaiApiKey && settings.openaiApiKey.trim().length > 0;
  const useOnDevice = settings.useOnDevice;
  
  // Show warning if no API keys and on-device is disabled
  if (!hasGemini && !hasOpenAI && !useOnDevice) {
    showToast(apiWarning);
  }
}

// Show toast notification
function showToast(toastElement, duration = 0) {
  toastElement.classList.remove("hidden");
  if (duration > 0) {
    setTimeout(() => {
      toastElement.classList.add("hidden");
    }, duration);
  }
}

// Hide toast
function hideToast(toastElement) {
  toastElement.classList.add("hidden");
}

// Zoom functionality - ONLY affects the output text area
function getCurrentScale() {
  return Math.min(1.6, Math.max(0.8, currentScale));
}

function applyScale(scale) {
  currentScale = Math.min(1.6, Math.max(0.8, scale));
  // Apply zoom ONLY to the output area, not the entire popup
  output.style.transform = `scale(${currentScale})`;
  output.style.transformOrigin = 'top left';
  // Adjust height to accommodate scaled content
  const baseHeight = parseInt(getComputedStyle(output).height) || 300;
  output.style.minHeight = `${baseHeight / currentScale}px`;
  chrome.storage.local.set({ popupScale: currentScale });
}

zoomInBtn.addEventListener("click", () => {
  applyScale(getCurrentScale() + 0.1);
});

zoomOutBtn.addEventListener("click", () => {
  applyScale(getCurrentScale() - 0.1);
});

// Load saved scale level
chrome.storage.local.get({ popupScale: 1.0 }, (data) => {
  applyScale(data.popupScale);
});

// Format controls
boldBtn.addEventListener("click", () => {
  document.execCommand('bold');
  boldBtn.classList.toggle('active');
});

italicBtn.addEventListener("click", () => {
  document.execCommand('italic');
  italicBtn.classList.toggle('active');
});

// Copy function
copyBtn.addEventListener("click", async () => {
  try {
    const text = output.innerText || output.textContent || "";
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "✅";
    setTimeout(() => (copyBtn.textContent = "📋"), 1500);
    quickTipText.textContent = "Summary copied to clipboard!";
    showToast(quickActions, 2000);
  } catch (err) {
    console.error("Failed to copy: ", err);
    quickTipText.textContent = "Failed to copy summary.";
    showToast(quickActions, 2000);
  }
});

// Copy as Markdown (with metadata)
copyMarkdownBtn.addEventListener("click", async () => {
  const text = output.innerText || output.textContent || "";
  const url = summaryUrlInput.value.trim();
  const notes = summaryNotesInput.value.trim();
  
  if (!text) {
    quickTipText.textContent = "No summary to copy!";
    showToast(quickActions, 2000);
    return;
  }
  
  try {
    // Build markdown format with metadata
    let mdContent = "# MZR Summarizer Export\n\n";
    mdContent += `**Date:** ${new Date().toLocaleString()}\n\n`;
    if (url) mdContent += `**URL:** ${url}\n\n`;
    if (notes) mdContent += `**Notes:** ${notes}\n\n`;
    mdContent += `**Summary:**\n\n${text}\n`;
    
    await navigator.clipboard.writeText(mdContent);
    copyMarkdownBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyMarkdownBtn.textContent = "📋 Markdown"), 1500);
    quickTipText.textContent = "Markdown copied to clipboard!";
    showToast(quickActions, 2000);
  } catch (err) {
    console.error("Failed to copy markdown:", err);
    quickTipText.textContent = "Copy failed! Try again.";
    showToast(quickActions, 2000);
  }
});

// Copy as Plain Text
copyTextBtn.addEventListener("click", async () => {
  const text = output.innerText || output.textContent || "";
  
  if (!text) {
    quickTipText.textContent = "No summary to copy!";
    showToast(quickActions, 2000);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    copyTextBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyTextBtn.textContent = "📋 Text"), 1500);
    quickTipText.textContent = "Text copied to clipboard!";
    showToast(quickActions, 2000);
  } catch (err) {
    console.error("Failed to copy text:", err);
    quickTipText.textContent = "Copy failed! Try again.";
    showToast(quickActions, 2000);
  }
});

// Toast button handlers
goToOptionsBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
  hideToast(apiWarning);
});

closeWarningBtn.addEventListener("click", () => {
  hideToast(apiWarning);
});

showInstructionsBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
  hideToast(quickActions);
  // Trigger instructions modal on options page
  chrome.storage.local.set({ showInstructions: true });
});

closeQuickBtn.addEventListener("click", () => {
  hideToast(quickActions);
});

// Text size controls
function setTextSize(size) {
  currentTextSize = Math.max(0, Math.min(5, size));
  output.className = output.className.replace(/text-\w+/, '');
  output.classList.add(textSizeClasses[currentTextSize]);
  chrome.storage.local.set({ textSize: currentTextSize });
}

textLargerBtn.addEventListener("click", () => {
  setTextSize(currentTextSize + 1);
});

textSmallerBtn.addEventListener("click", () => {
  setTextSize(currentTextSize - 1);
});

// Load saved text size
chrome.storage.local.get({ textSize: 2 }, (data) => {
  setTextSize(data.textSize);
});

// Expand/collapse output
expandBtn.addEventListener("click", () => {
  const isExpanded = output.classList.contains('expanded');
  if (isExpanded) {
    output.classList.remove('expanded');
    expandBtn.textContent = '⛶';
    expandBtn.title = 'Expand';
  } else {
    output.classList.add('expanded');
    expandBtn.textContent = '⛶';
    expandBtn.title = 'Collapse';
  }
});

// Auto-fill URL from current tab
async function updateCurrentUrl() {
  const tab = await getActiveTab();
  if (tab && tab.url && !urlEditable) {
    currentSummaryData.url = tab.url;
    summaryUrlInput.value = tab.url;
    summaryUrlInput.setAttribute('readonly', 'true');
  }
}

// Toggle URL editing
editUrlBtn.addEventListener("click", () => {
  urlEditable = !urlEditable;
  if (urlEditable) {
    summaryUrlInput.removeAttribute('readonly');
    summaryUrlInput.classList.add('editable');
    summaryUrlInput.focus();
    editUrlBtn.textContent = '💾';
    editUrlBtn.title = 'Save URL';
  } else {
    summaryUrlInput.setAttribute('readonly', 'true');
    summaryUrlInput.classList.remove('editable');
    currentSummaryData.url = summaryUrlInput.value;
    editUrlBtn.textContent = '✏️';
    editUrlBtn.title = 'Edit URL';
  }
});


// Save summary with URL and notes
saveSummaryBtn.addEventListener("click", async () => {
  const summary = output.innerText || output.textContent;
  const notes = summaryNotesInput.value.trim();
  const url = summaryUrlInput.value.trim();
  
  if (!summary) {
    quickTipText.textContent = "No summary to save! Summarize a page first.";
    showToast(quickActions, 3000);
    return;
  }
  
  // Save to history with enhanced data
  const historyItem = {
    summary: summary.slice(0, 500), // Preview
    fullSummary: summary, // Full text
    url: url,
    notes: notes,
    timestamp: Date.now(),
    length: summary.length
  };
  
  chrome.storage.local.get({ summaryHistory: [] }, (data) => {
    const history = data.summaryHistory || [];
    // Check if already exists (avoid duplicates)
    const existingIndex = history.findIndex(item => 
      item.fullSummary === summary && item.timestamp > Date.now() - 60000
    );
    if (existingIndex === -1) {
      history.unshift(historyItem);
      chrome.storage.local.set({ summaryHistory: history.slice(0, 20) }, () => {
        quickTipText.textContent = "Summary saved with notes! Check history below.";
        showToast(quickActions, 3000);
        loadStats();
        // Clear notes after save
        summaryNotesInput.value = '';
      });
    } else {
      quickTipText.textContent = "This summary was already saved recently.";
      showToast(quickActions, 2000);
    }
  });
});

// MOST RELIABLE DOWNLOAD METHOD (Chrome recommended)
function downloadFile(content, filename, type) {
  try {
    // Create blob (handles any size)
    const blob = new Blob([content], { type: type });
    
    // Create object URL (most stable method)
    const url = URL.createObjectURL(blob);
    
    // Create temporary link
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    
    // Add to DOM, click, then remove
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    
    return true;
  } catch (e) {
    console.error('Download error:', e);
    quickTipText.textContent = "Export failed! Try again.";
    showToast(quickActions, 3000);
    return false;
  }
}


// Custom Delete Confirmation Modal
const deleteModal = document.getElementById('delete-modal');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
let pendingDeleteCallback = null;

function showDeleteConfirmation(onConfirm) {
  pendingDeleteCallback = onConfirm;
  deleteModal.classList.remove('hidden');
}

modalCancel.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  pendingDeleteCallback = null;
});

modalConfirm.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  if (typeof pendingDeleteCallback === 'function') {
    pendingDeleteCallback();
  }
  pendingDeleteCallback = null;
});

// Close modal on overlay click
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.add('hidden');
    pendingDeleteCallback = null;
  }
});

// Show quick tip on first use
chrome.storage.local.get({ firstTime: true }, (data) => {
  if (data.firstTime) {
    quickTipText.textContent = "Welcome! Click 'Summarize This Page' to get started or setup your API keys.";
    setTimeout(() => {
      showToast(quickActions);
    }, 500);
    chrome.storage.local.set({ firstTime: false });
  }
});

// Update URL on page load
updateCurrentUrl();

summarizeBtn.addEventListener("click", async () => {
  output.innerHTML = '<span style="color:#94a3b8;">⏳ Summarizing page...</span>';
  const tab = await getActiveTab();
  if (!tab?.id) return;
  if (!isInjectableUrl(tab.url)) {
    output.innerHTML = '<span style="color:#f87171;">⚠️ This page is restricted. Try another site.</span>';
    quickTipText.textContent = "Chrome extensions can't access chrome:// pages. Try a regular website!";
    showToast(quickActions, 5000);
    return;
  }
  
  // Check API keys before summarizing
  const settingsRes = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
  const settings = settingsRes?.settings || {};
  const hasKeys = (settings.geminiApiKey && settings.geminiApiKey.trim()) || 
                  (settings.openaiApiKey && settings.openaiApiKey.trim()) ||
                  settings.useOnDevice;
  
  if (!hasKeys) {
    output.innerHTML = '<span style="color:#fbbf24;">⚠️ No API key configured</span>';
    showToast(apiWarning);
    return;
  }
  
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.slice(0, 120000)
    });
    const text = result || "";
    if (!text.trim()) {
      output.innerHTML = '<span style="color:#f87171;">⚠️ No text found on this page</span>';
      return;
    }
    // Use selected length
    const length = lengthSelector.value || "medium";
    const res = await chrome.runtime.sendMessage({ 
      type: MessageType.SUMMARIZE_PAGE, 
      text,
      length 
    });
    if (res?.ok && res?.summary) {
      output.textContent = res.summary;
      // Auto-fill URL
      await updateCurrentUrl();
      currentSummaryData.summary = res.summary;
      currentSummaryData.timestamp = Date.now();
      quickTipText.textContent = "Great! Add notes and save, or just continue. Check history below!";
      showToast(quickActions, 4000);
    } else {
      output.innerHTML = `<span style="color:#f87171;">❌ ${res?.error || 'Failed to summarize'}</span>`;
      if (res?.error?.includes('API key') || res?.error?.includes('401') || res?.error?.includes('403')) {
        showToast(apiWarning);
      }
    }
  } catch (e) {
    output.innerHTML = `<span style="color:#f87171;">❌ Error: ${e?.message || e}</span>`;
  }
});

openPanelBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  if (!isInjectableUrl(tab.url)) {
    output.innerHTML = '<span style="color:#f87171;">⚠️ This page is restricted. Try another site.</span>';
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (!document.getElementById("ai-summarizer-panel")) {
          const event = new CustomEvent("ais-open-panel");
          document.dispatchEvent(event);
        }
      }
    });
    quickTipText.textContent = "Panel opened! You can drag it around and use all features there.";
    showToast(quickActions, 3000);
  } catch (e) {
    output.innerHTML = `<span style="color:#f87171;">❌ Failed: ${e?.message || e}</span>`;
  }
});

async function loadStats() {
  const histRes = await chrome.runtime.sendMessage({ type: MessageType.GET_HISTORY });
  const history = histRes?.history || [];
  statsCount.textContent = `📊 ${history.length} summaries`;
  
  const settingsRes = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
  const provider = settingsRes?.settings?.provider || "auto";
  statsProvider.textContent = `🤖 ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
  
  // Render history
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = '<div style="text-align:center;color:#64748b;font-size:12px;padding:12px">No summaries yet</div>';
  } else {
    history.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "history-item";
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      let historyHTML = `
        <div class="history-time">
          <span>${timeStr} • ${item.length} chars</span>
        </div>
      `;
      
      if (item.url) {
        historyHTML += `<div class="history-url">🔗 ${item.url}</div>`;
      }
      
      if (item.notes) {
        historyHTML += `<div class="history-notes">📝 ${item.notes}</div>`;
      }
      
      historyHTML += `<div class="history-text">${item.summary}</div>`;
      
      historyHTML += `
        <div class="history-actions-mini">
          <button class="history-action-btn" data-action="view" data-index="${index}" title="View Full">👁</button>
          <button class="history-action-btn" data-action="copy" data-index="${index}" title="Copy">📋</button>
          <button class="history-action-btn" data-action="delete" data-index="${index}" title="Delete">🗑</button>
        </div>
      `;
      
      div.innerHTML = historyHTML;
      
      // Click to view full summary
      div.addEventListener("click", (e) => {
        if (!e.target.closest('.history-action-btn')) {
          output.textContent = item.fullSummary || item.summary;
          summaryUrlInput.value = item.url || '';
          summaryNotesInput.value = item.notes || '';
        }
      });
      
      historyList.appendChild(div);
    });
    
    // Add event listeners for mini actions
    document.querySelectorAll('.history-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        const item = history[index];
        
        if (action === 'view') {
          output.textContent = item.fullSummary || item.summary;
          summaryUrlInput.value = item.url || '';
          summaryNotesInput.value = item.notes || '';
        } else if (action === 'copy') {
          try {
            await navigator.clipboard.writeText(item.fullSummary || item.summary);
            btn.textContent = '✅';
            setTimeout(() => btn.textContent = '📋', 1500);
          } catch (e) {
            console.error('Copy failed:', e);
          }
        } else if (action === 'delete') {
          // Show custom styled confirmation
          showDeleteConfirmation(() => {
            history.splice(index, 1);
            chrome.storage.local.set({ summaryHistory: history }, () => {
              loadStats();
              quickTipText.textContent = "✅ Summary deleted successfully!";
              showToast(quickActions, 2000);
            });
          });
        }
      });
    });
  }
}

// Clear history with confirmation
clearHistoryBtn.addEventListener("click", () => {
  showDeleteConfirmation(() => {
    chrome.storage.local.set({ summaryHistory: [] }, () => {
      loadStats();
      quickTipText.textContent = "✅ All history cleared!";
      showToast(quickActions, 2000);
    });
  });
});

// Initialize
loadStats();
checkApiKeys();

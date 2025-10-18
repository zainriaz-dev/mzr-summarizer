const MessageType = {
  SUMMARIZE_PAGE: "SUMMARIZE_PAGE",
  SUMMARIZE_SELECTION: "SUMMARIZE_SELECTION",
  CHAT_SELECTION: "CHAT_SELECTION",
  GET_SETTINGS: "GET_SETTINGS",
  SAVE_SETTINGS: "SAVE_SETTINGS",
  PROVIDER_INFO: "PROVIDER_INFO"
};

async function sendMessage(message, retries = 1) {
  // Guard against invalidated contexts (e.g., extension reload or SPA nav)
  if (!chrome?.runtime?.id || document.documentElement.getAttribute("data-ais-unloading") === "1") {
    return { ok: false, error: "Extension context invalidated. Reload the page." };
  }
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(resp);
      });
    });
    if (!response?.ok && retries > 0 && String(response?.error || "").includes("context")) {
      await new Promise((r) => setTimeout(r, 120));
      return sendMessage(message, retries - 1);
    }
    return response;
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 120));
      return sendMessage(message, retries - 1);
    }
    return { ok: false, error: e?.message || String(e) };
  }
}

function createPanel() {
  const container = document.createElement("div");
  container.id = "ai-summarizer-panel";
  container.innerHTML = `
    <div class="ais-header">
      <span class="ais-title">✨ MZR Summarizer</span>
      <div class="ais-header-actions">
        <button class="ais-minimize" title="Minimize" aria-label="Minimize">−</button>
        <button class="ais-close" title="Close Panel (Stays Open Until You Close It)" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="ais-body">
      <div class="ais-toolbar">
        <div class="ais-toolbar-row">
          <button class="ais-summarize">📄 Summarize Page</button>
          <select class="ais-length" title="Summary length" aria-label="Summary length">
            <option value="short">Short</option>
            <option value="medium" selected>Medium</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <div class="ais-toolbar-row">
          <div class="ais-format-group" style="display:flex;gap:4px;margin-right:8px;">
            <button class="ais-format-bold" title="Bold" aria-label="Bold" style="background:rgba(148,163,184,0.2);color:#cbd5e1;border:1px solid rgba(148,163,184,0.3);border-radius:6px;width:28px;height:28px;font-size:12px;font-weight:bold;cursor:pointer;">B</button>
            <button class="ais-format-italic" title="Italic" aria-label="Italic" style="background:rgba(148,163,184,0.2);color:#cbd5e1;border:1px solid rgba(148,163,184,0.3);border-radius:6px;width:28px;height:28px;font-size:12px;font-style:italic;cursor:pointer;">I</button>
          </div>
          <div class="ais-export-group" style="display:flex;gap:4px;margin-right:8px;">
            <button class="ais-copy" title="Copy to clipboard" aria-label="Copy">📋 Copy</button>
            <button class="ais-copy-markdown" title="Copy as Markdown" aria-label="Copy Markdown" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:500;cursor:pointer;">📋 MD</button>
            <button class="ais-copy-text" title="Copy as Plain Text" aria-label="Copy Text" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:500;cursor:pointer;">📋 TXT</button>
          </div>
          <div class="ais-view-group">
            <span class="ais-label">View:</span>
            <button class="ais-zoom-out" title="Zoom out" aria-label="Zoom out">−</button>
            <button class="ais-zoom-in" title="Zoom in" aria-label="Zoom in">+</button>
            <button class="ais-popout" title="Open in new window" aria-label="Popout">↗</button>
          </div>
        </div>
      </div>
      <div class="ais-result-container">
        <div class="ais-result-header">
          <span class="ais-result-title">Summary</span>
          <div class="ais-result-actions">
            <button class="ais-save-history" title="Save to History" aria-label="Save to History" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;margin-right:6px;transition:all 0.2s;display:none;">💾 Save</button>
            <button class="ais-clear" title="Clear result" aria-label="Clear">Clear</button>
          </div>
        </div>
        <div class="ais-result" aria-live="polite" contenteditable="true"></div>
        <div class="ais-meta">
          <div class="ais-url-group">
            <input type="text" class="ais-url-input" placeholder="📎 Page URL" readonly style="opacity:0.7;width:100%;background:#0b1220;border:1px solid rgba(148,163,184,0.2);border-radius:6px;padding:6px 8px;color:#e2e8f0;font-size:11px;margin-bottom:6px;" />
            <button class="ais-edit-url" title="Edit URL" style="background:rgba(148,163,184,0.2);color:#cbd5e1;border:1px solid rgba(148,163,184,0.3);border-radius:6px;width:28px;height:28px;font-size:12px;cursor:pointer;position:absolute;right:6px;margin-top:-34px;">✏️</button>
          </div>
          <textarea class="ais-notes" rows="2" placeholder="📝 Add your notes..." style="width:100%;background:#0b1220;border:1px solid rgba(148,163,184,0.2);border-radius:6px;padding:6px 8px;color:#e2e8f0;font-size:11px;resize:vertical;"></textarea>
        </div>
      </div>
      <div class="ais-chat">
        <textarea class="ais-prompt" rows="3" placeholder="💬 Ask about selected text..." aria-label="Chat prompt"></textarea>
        <button class="ais-send" aria-label="Send message">Ask AI</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(container);

  const closeBtn = container.querySelector(".ais-close");
  const minimizeBtn = container.querySelector(".ais-minimize");
  const clearBtn = container.querySelector(".ais-clear");
  const summarizeBtn = container.querySelector(".ais-summarize");
  const result = container.querySelector(".ais-result");
  const body = container.querySelector(".ais-body");
  const promptEl = container.querySelector(".ais-prompt");
  const sendBtn = container.querySelector(".ais-send");
  const lengthEl = container.querySelector(".ais-length");
  const copyBtn = container.querySelector(".ais-copy");
  const copyMarkdownBtn = container.querySelector(".ais-copy-markdown");
  const copyTextBtn = container.querySelector(".ais-copy-text");
  const formatBoldBtn = container.querySelector(".ais-format-bold");
  const formatItalicBtn = container.querySelector(".ais-format-italic");
  const zoomInBtn = container.querySelector(".ais-zoom-in");
  const zoomOutBtn = container.querySelector(".ais-zoom-out");
  const popoutBtn = container.querySelector(".ais-popout");
  const urlInput = container.querySelector(".ais-url-input");
  const editUrlBtn = container.querySelector(".ais-edit-url");
  const notesInput = container.querySelector(".ais-notes");
  const saveHistoryBtn = container.querySelector(".ais-save-history");
  
  // Auto-fill current page URL
  urlInput.value = window.location.href;
  let urlEditable = false;
  let currentSummary = "";

  // Close button with smooth animation
  closeBtn.addEventListener("click", () => {
    container.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => container.remove(), 300);
  });
  minimizeBtn.addEventListener("click", () => {
    const isMin = body.style.display === "none";
    body.style.display = isMin ? "block" : "none";
    minimizeBtn.textContent = isMin ? "−" : "+";
    minimizeBtn.title = isMin ? "Minimize" : "Maximize";
  });
  clearBtn.addEventListener("click", () => {
    result.textContent = "";
    result.classList.remove("error", "loading");
    currentSummary = "";
    if (saveHistoryBtn) saveHistoryBtn.style.display = "none";
  });
  summarizeBtn.addEventListener("click", async () => {
    result.classList.remove("error");
    result.classList.add("loading");
    result.innerHTML = '<div class="ais-spinner" aria-hidden="true"></div>';
    if (saveHistoryBtn) saveHistoryBtn.style.display = "none";
    
    const text = document.body.innerText.slice(0, 120000);
    const res = await sendMessage({ type: MessageType.SUMMARIZE_PAGE, text, length: lengthEl?.value || "medium" });
    result.classList.remove("loading");
    if (!res?.ok && res?.error) {
      result.classList.add("error");
      result.textContent = `Error: ${res.error}`;
      currentSummary = "";
      return;
    }
    currentSummary = res?.summary || "";
    result.textContent = currentSummary;
    if (saveHistoryBtn) saveHistoryBtn.style.display = "inline-block";
  });
  copyBtn.addEventListener("click", async () => {
    const text = result.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "✅ Copied";
      setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
      showPanelToast("📋 Copied to clipboard!", 1500);
    } catch {
      showPanelToast("❌ Copy failed!", 2000);
    }
  });

  // Copy as Markdown
  if (copyMarkdownBtn) {
    copyMarkdownBtn.addEventListener("click", async () => {
      const text = result.innerText || "";
      if (!text.trim()) {
        showPanelToast("⚠️ Nothing to copy!", 2000);
        return;
      }
      const markdown = `# Summary\n\n${text}\n\n---\n**URL:** ${urlInput.value}\n**Date:** ${new Date().toLocaleString()}\n`;
      try {
        await navigator.clipboard.writeText(markdown);
        copyMarkdownBtn.textContent = "✅ Copied";
        setTimeout(() => (copyMarkdownBtn.textContent = "📋 MD"), 1500);
        showPanelToast("📋 Markdown copied!", 1500);
      } catch {
        showPanelToast("❌ Copy failed!", 2000);
      }
    });
  }

  // Copy as Plain Text
  if (copyTextBtn) {
    copyTextBtn.addEventListener("click", async () => {
      const text = result.innerText || "";
      if (!text.trim()) {
        showPanelToast("⚠️ Nothing to copy!", 2000);
        return;
      }
      const plainText = `Summary\n${"=".repeat(50)}\n\n${text}\n\n${"=".repeat(50)}\nURL: ${urlInput.value}\nDate: ${new Date().toLocaleString()}\n`;
      try {
        await navigator.clipboard.writeText(plainText);
        copyTextBtn.textContent = "✅ Copied";
        setTimeout(() => (copyTextBtn.textContent = "📋 TXT"), 1500);
        showPanelToast("📋 Text copied!", 1500);
      } catch {
        showPanelToast("❌ Copy failed!", 2000);
      }
    });
  }

  // Format buttons (Bold and Italic)
  if (formatBoldBtn) {
    formatBoldBtn.addEventListener("click", () => {
      result.focus();
      document.execCommand('bold', false, null);
    });
  }

  if (formatItalicBtn) {
    formatItalicBtn.addEventListener("click", () => {
      result.focus();
      document.execCommand('italic', false, null);
    });
  }

  // URL editing toggle
  editUrlBtn.addEventListener("click", () => {
    urlEditable = !urlEditable;
    if (urlEditable) {
      urlInput.removeAttribute('readonly');
      urlInput.style.opacity = '1';
      urlInput.focus();
      editUrlBtn.textContent = '💾';
      editUrlBtn.title = 'Save URL';
    } else {
      urlInput.setAttribute('readonly', 'true');
      urlInput.style.opacity = '0.7';
      editUrlBtn.textContent = '✏️';
      editUrlBtn.title = 'Edit URL';
    }
  });
  function currentScale() {
    const v = parseFloat(container.getAttribute("data-ais-scale") || "1");
    return Math.min(1.6, Math.max(0.8, v));
  }
  function applyScale(v) {
    container.style.transform = `scale(${v})`;
    container.style.transformOrigin = "top right";
    container.setAttribute("data-ais-scale", String(v));
  }
  zoomInBtn.addEventListener("click", () => applyScale(currentScale() + 0.1));
  zoomOutBtn.addEventListener("click", () => applyScale(currentScale() - 0.1));
  popoutBtn.addEventListener("click", () => {
    const text = (result.textContent || "").replace(/</g, "&lt;");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>AI Summary</title>
      <style>body{font-family:ui-sans-serif,system-ui,Arial;margin:24px;white-space:pre-wrap;background:#0b1220;color:#e2e8f0}</style></head>
      <body><h1>AI Summary</h1><div>${text}</div></body></html>`;
    const w = window.open("about:blank", "_blank", "width=720,height=840,resizable=yes,scrollbars=yes");
    try { w.document.write(html); w.document.close(); } catch {}
  });
  sendBtn.addEventListener("click", async () => {
    const selection = window.getSelection()?.toString() || "";
    const prompt = promptEl.value.trim() || "Explain";
    if (!selection) {
      result.textContent = "Select some text first.";
      return;
    }
    result.classList.remove("error");
    result.classList.add("loading");
    result.innerHTML = '<div class="ais-spinner" aria-hidden="true"></div>';
    const res = await sendMessage({ type: MessageType.CHAT_SELECTION, prompt, selection });
    result.classList.remove("loading");
    if (!res?.ok && res?.error) {
      result.classList.add("error");
      result.textContent = `Error: ${res.error}`;
      return;
    }
    result.textContent = res?.reply || "";
  });

  // Save to History functionality (uses same storage key as popup)
  if (saveHistoryBtn) {
    saveHistoryBtn.addEventListener("click", async () => {
      const summary = currentSummary || result.innerText?.trim();
      const url = urlInput.value?.trim() || window.location.href;
      const notes = notesInput.value?.trim() || "";

      if (!summary || summary === "" || summary.length < 10) {
        showPanelToast("⚠️ No summary to save!", 2000);
        return;
      }

      try {
        const { summaryHistory = [] } = await chrome.storage.local.get("summaryHistory");
        
        // Check for duplicates (same summary + URL within 5 seconds)
        const existingIndex = summaryHistory.findIndex(item => 
          item.fullSummary === summary && 
          item.url === url && 
          item.timestamp > Date.now() - 5000
        );

        if (existingIndex === -1) {
          const newItem = {
            fullSummary: summary,
            url: url,
            notes: notes,
            timestamp: Date.now()
          };
          summaryHistory.unshift(newItem);
          await chrome.storage.local.set({ summaryHistory: summaryHistory.slice(0, 50) });
          showPanelToast("✅ Saved to history!", 2000);
          saveHistoryBtn.style.display = "none";
          
          // Clear notes after successful save
          notesInput.value = "";
        } else {
          showPanelToast("⚠️ Already saved recently!", 2000);
        }
      } catch (error) {
        console.error("Save history error:", error);
        showPanelToast("❌ Failed to save!", 2000);
      }
    });
  }

  // Toast notification for panel
  function showPanelToast(message, duration = 2000) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 520px;
      background: linear-gradient(135deg, #1e293b, #334155);
      color: #e2e8f0;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 2147483646;
      animation: slideInLeft 0.3s ease;
      border: 1px solid rgba(148,163,184,0.3);
      font-family: ui-sans-serif, system-ui, -apple-system, Arial, sans-serif;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOutLeft 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  makeDraggable(container, container.querySelector(".ais-header"));
}

// Add animations for toast (only once)
if (!document.getElementById('ais-toast-styles')) {
  const style = document.createElement("style");
  style.id = 'ais-toast-styles';
  style.textContent = `
    @keyframes slideInLeft {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutLeft {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function makeDraggable(el, handle) {
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  handle.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = el.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp, { once: true });
  });
  function onMove(e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
  }
  function onUp() {
    isDown = false;
    document.removeEventListener("mousemove", onMove);
  }
}

function ensurePanel() {
  if (!document.getElementById("ai-summarizer-panel")) {
    createPanel();
  }
}

function createSelectionBubble() {
  const bubble = document.createElement("button");
  bubble.id = "ai-selection-bubble";
  bubble.textContent = "Ask AI";
  bubble.style.display = "none";
  document.documentElement.appendChild(bubble);

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      bubble.style.left = `${rect.right + window.scrollX + 8}px`;
      bubble.style.top = `${rect.top + window.scrollY - 8}px`;
      bubble.style.display = "block";
    } else {
      bubble.style.display = "none";
    }
  });

  bubble.addEventListener("click", () => {
    ensurePanel();
    const promptEl = document.querySelector("#ai-summarizer-panel .ais-prompt");
    promptEl?.focus();
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === MessageType.SUMMARIZE_PAGE) {
    ensurePanel();
    const result = document.querySelector("#ai-summarizer-panel .ais-result");
    if (result) {
      result.classList.remove("loading");
      result.classList.toggle("error", !message?.summary);
      result.textContent = message.summary || "";
    }
  }
  if (message?.type === MessageType.CHAT_SELECTION) {
    ensurePanel();
    const result = document.querySelector("#ai-summarizer-panel .ais-result");
    if (result) {
      result.classList.remove("loading");
      result.classList.toggle("error", !message?.reply);
      result.textContent = message.reply || "";
    }
  }
});

(() => {
  createSelectionBubble();
})();

document.addEventListener("ais-open-panel", () => {
  let panel = document.getElementById("ai-summarizer-panel");
  if (!panel) {
    ensurePanel();
    
    // Show instant feedback toast
    setTimeout(() => {
      const toast = document.createElement("div");
      toast.textContent = "✨ Panel opened! Ready to summarize...";
      toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 520px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        z-index: 2147483646;
        animation: slideInLeft 0.3s ease;
        border: 1px solid rgba(16,185,129,0.5);
        font-family: ui-sans-serif, system-ui, -apple-system, Arial, sans-serif;
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = "slideOutLeft 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    }, 50);
  } else {
    // If panel exists, just highlight it
    panel.style.animation = "none";
    setTimeout(() => {
      panel.style.animation = "pulse 0.5s ease";
    }, 10);
  }
});

// Mark unloading to avoid late async calls
window.addEventListener("pagehide", () => {
  document.documentElement.setAttribute("data-ais-unloading", "1");
});

// Swallow noisy unhandled rejections caused by page context invalidation
window.addEventListener("unhandledrejection", (e) => {
  if (String(e?.reason || "").includes("Extension context invalidated")) {
    e.preventDefault();
  }
});
window.addEventListener("error", (e) => {
  if (String(e?.message || "").includes("Extension context invalidated")) {
    e.preventDefault();
  }
});



const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1";

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        provider: "auto", // auto | gemini | openai
        useOnDevice: true,
        // OpenAI
        openaiApiKey: "",
        preferredModel: "gpt-4o-mini",
        // Gemini
        geminiApiKey: "",
        geminiModel: "gemini-1.5-flash-001"
      },
      resolve
    );
  });
}

async function onDeviceSummarize(text) {
  try {
    if (typeof self !== "undefined" && self.ai && self.ai.summarizer) {
      const available = await self.ai.summarizer.capabilities();
      if (available && available.available !== "no") {
        const session = await self.ai.summarizer.create({
          type: "key-points",
          format: "markdown"
        });
        const summary = await session.summarize(text);
        await session.destroy?.();
        return summary;
      }
    }
  } catch (e) {
    // fall through to cloud
  }
  return null;
}

async function onDeviceChat(prompt) {
  try {
    if (typeof self !== "undefined" && self.ai && self.ai.assistant) {
      const available = await self.ai.assistant.capabilities();
      if (available && available.available !== "no") {
        const session = await self.ai.assistant.create();
        const reply = await session.prompt(prompt);
        await session.destroy?.();
        return reply;
      }
    }
  } catch (e) {
    // fall through to cloud
  }
  return null;
}

async function openAiRequest({ messages, model }) {
  const { openaiApiKey } = await getSettings();
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set. Add it in Options.");
  }
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages,
      temperature: 0.2
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function summarizeText(text, opts = {}) {
  const { provider, useOnDevice, preferredModel, geminiApiKey, geminiModel, openaiApiKey } = await getSettings();
  const length = opts.length || "medium";

  if (useOnDevice) {
    const local = await onDeviceSummarize(text);
    if (local) return local;
  }

  const lengthHint = length === "short" ? "Very concise." : length === "detailed" ? "Detailed, structured." : "Concise.";
  const messages = [
    { role: "system", content: `You are a precise summarizer. ${lengthHint} Use bullet points when helpful.` },
    { role: "user", content: `Summarize the following content:\n\n${text}` }
  ];

  if (provider === "gemini" || (provider === "auto" && geminiApiKey)) {
    try {
      return await geminiRequest({ messages, model: geminiModel });
    } catch (e) {
      if (openaiApiKey) {
        return openAiRequest({ model: preferredModel, messages });
      }
      throw e;
    }
  }
  return openAiRequest({ model: preferredModel, messages });
}

export async function chatAboutSelection(prompt, selection) {
  const { provider, useOnDevice, preferredModel, geminiApiKey, geminiModel, openaiApiKey } = await getSettings();
  if (useOnDevice) {
    const local = await onDeviceChat(`${prompt}\n\nContext:\n${selection}`);
    if (local) return local;
  }
  const messages = [
    { role: "system", content: "You are a helpful, precise assistant." },
    { role: "user", content: `${prompt}\n\nContext:\n${selection}` }
  ];
  if (provider === "gemini" || (provider === "auto" && geminiApiKey)) {
    try {
      return await geminiRequest({ messages, model: geminiModel });
    } catch (e) {
      if (openaiApiKey) {
        return openAiRequest({ model: preferredModel, messages });
      }
      throw e;
    }
  }
  return openAiRequest({ model: preferredModel, messages });
}

export async function getProviderInfo() {
  let onDevice = false;
  try {
    if (typeof self !== "undefined" && self.ai) {
      const caps = await (self.ai.summarizer?.capabilities?.() || Promise.resolve(null));
      onDevice = !!caps && caps.available !== "no";
    }
  } catch (e) {
    onDevice = false;
  }
  const { preferredModel, useOnDevice, provider, geminiModel } = await getSettings();
  return { onDeviceAvailable: onDevice, preferredModel, useOnDevice, provider, geminiModel };
}

function toGeminiContents(messages) {
  // Flatten OpenAI-style messages to a single user prompt with optional system prefix
  const system = messages.find((m) => m.role === "system")?.content || "";
  const userParts = messages.filter((m) => m.role !== "system").map((m) => `${m.role}: ${m.content}`).join("\n\n");
  const prompt = system ? `${system}\n\n${userParts}` : userParts;
  return [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];
}

export async function listGeminiModels() {
  const { geminiApiKey } = await getSettings();
  if (!geminiApiKey) return [];
  const url = `${GEMINI_API_BASE}/models?key=${encodeURIComponent(geminiApiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const models = data.models || [];
  return models
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => ({ name: m.name?.replace(/^models\//, ""), displayName: m.displayName || m.name }));
}

function chooseBestGeminiModel(names) {
  const prioritized = [
    /gemini-1\.5-flash-001$/,
    /gemini-1\.5-pro-001$/,
    /gemini-1\.5-flash-8b-001$/
  ];
  for (const re of prioritized) {
    const hit = names.find((n) => re.test(n));
    if (hit) return hit;
  }
  return names[0];
}

function canonicalizeGeminiModel(model) {
  if (!model) return "gemini-1.5-flash-latest";
  // If user entered without -latest, prefer the latest alias
  if (model === "gemini-1.5-flash" || model === "gemini-1.5-pro" || model === "gemini-1.5-flash-8b") {
    return `${model}-latest`;
  }
  return model;
}

async function geminiRequest({ messages, model }) {
  const { geminiApiKey } = await getSettings();
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not set. Add it in Options.");
  }
  const tryRequest = async (base, mdl) => {
    const url = `${base}/models/${encodeURIComponent(mdl)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
    const body = { contents: toGeminiContents(messages) };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res;
  };

  // First attempt: v1 + canonicalized model
  let modelCanon = canonicalizeGeminiModel(model);
  let res = await tryRequest(GEMINI_API_BASE, modelCanon);
  if (!res.ok && res.status === 404) {
    // Retry with -latest suffix if missing
    const withLatest = modelCanon.endsWith("-latest") ? modelCanon : `${modelCanon}-latest`;
    res = await tryRequest(GEMINI_API_BASE, withLatest);
  }
  if (!res.ok && res.status === 404) {
    // Retry on v1beta for older accounts/regions if needed
    const betaBase = "https://generativelanguage.googleapis.com/v1beta";
    res = await tryRequest(betaBase, modelCanon);
  }
  if (!res.ok && res.status === 404) {
    // Discover models and retry best available
    const available = await listGeminiModels();
    const names = available.map((m) => m.name);
    if (names.length > 0) {
      modelCanon = chooseBestGeminiModel(names);
      res = await tryRequest(GEMINI_API_BASE, modelCanon);
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.map((p) => p.text).filter(Boolean).join("\n");
  return text || "";
}



const express = require('express');
const router = express.Router();
const { optionalAuth } = require('./auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { buildSystemPrompt, TOOLS } = require('../services/chatPrompt');
const { searchProducts, checkOrderStatus } = require('../services/chatTools');

const MAX_TOOL_ITERATIONS = 4; // 3 tool-call rounds + 1 forced final answer
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 1000;
const FALLBACK_REPLY = "I'm sorry, please try again in a moment! 😊";

// gemini-flash-latest is Google's own self-updating alias to their current
// recommended flash model — deliberately not a dated model name, since a
// specific dated model (gemini-2.5-flash) turned out to already be blocked
// for new API keys ("no longer available to new users") by the time this
// was tested live, just minutes after being picked as the default.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// The client only ever sends/receives plain {role, content} text turns —
// internal functionCall/functionResponse turns never cross the wire to the
// browser, so a client can't inject fake tool results into later requests.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_MESSAGE_LENGTH) }],
    }));
}

async function callGemini(contents, systemPrompt, forceFinal) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      tools: [{ functionDeclarations: TOOLS }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      ...(forceFinal && { toolConfig: { functionCallingConfig: { mode: 'NONE' } } }),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[chat] Gemini API error:', JSON.stringify(data).slice(0, 500));
    throw new Error('LLM request failed');
  }
  return data;
}

function safeJsonArgs(args) {
  // Gemini already returns `args` as a parsed object (unlike OpenAI's
  // stringified `arguments`), but guard anyway in case that ever changes.
  if (args && typeof args === 'object') return args;
  try { return JSON.parse(args || '{}'); } catch { return {}; }
}

async function executeTool(name, args, user) {
  if (name === 'search_products') return searchProducts(args);
  if (name === 'check_order_status') return checkOrderStatus(args, user);
  return { error: 'unknown_tool' };
}

router.post('/', chatLimiter, optionalAuth, async (req, res) => {
  try {
    const message = (req.body?.message || '').toString().trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = buildSystemPrompt(req.user);
    let contents = [...sanitizeHistory(req.body?.history), { role: 'user', parts: [{ text: message }] }];

    const collectedToolResults = [];
    let finalText = null;

    for (let i = 1; i <= MAX_TOOL_ITERATIONS; i++) {
      const forceFinal = i === MAX_TOOL_ITERATIONS;
      const data = await callGemini(contents, systemPrompt, forceFinal);
      const candidateParts = data.candidates?.[0]?.content?.parts || [];
      const functionCalls = candidateParts.filter(p => p.functionCall);

      if (!functionCalls.length) {
        finalText = candidateParts.map(p => p.text).filter(Boolean).join('\n');
        break;
      }

      // Echo the model's own turn back before answering it, exactly as returned.
      contents.push({ role: 'model', parts: candidateParts });

      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        const result = await executeTool(name, safeJsonArgs(args), req.user);

        collectedToolResults.push({
          type: name === 'search_products' ? 'products' : 'order_status',
          data: result,
        });

        // Verified live against the real API: this current Gemini version
        // rejects role:'function' ("Role 'function' is not supported...
        // valid role: SYSTEM, ... MODEL, USER") — the function result goes
        // back as a 'user' turn instead.
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name, response: result } }],
        });
      }
    }

    res.json({ reply: finalText || FALLBACK_REPLY, toolResults: collectedToolResults });
  } catch (err) {
    console.error('[chat] error:', err.message);
    res.status(500).json({ reply: FALLBACK_REPLY, toolResults: [] });
  }
});

module.exports = router;

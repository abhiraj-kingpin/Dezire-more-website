const rateLimit = require('express-rate-limit');

// Applied only to auth endpoints that are realistic brute-force/spam
// targets (login, signup, resend-verification) — deliberately not the
// whole /api/auth router, since that also covers session restore (GET
// /me) and address/profile calls made constantly during normal browsing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

// Priya chat — real sessions send many messages back and forth, so this is
// much looser than the auth limiters, but still bounded against spam/LLM
// cost abuse (each message triggers at least one, sometimes several, real
// Gemini calls).
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Priya's a little busy right now — please try again in a few minutes." },
});

module.exports = { authLimiter, adminLoginLimiter, chatLimiter };

const crypto = require('crypto');

// In-memory store for active CAPTCHA challenges with TTL
const captchaStore = new Map();

// Periodic prune every 2 minutes for expired challenges
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expiresAt < now) {
      captchaStore.delete(id);
    }
  }
}, 2 * 60 * 1000);

/**
 * Generates an SVG visual challenge string without external heavy binary dependencies.
 */
const generateCaptchaSvg = (text) => {
  const width = 160;
  const height = 50;

  // Background noise lines
  let lines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d4a373" stroke-width="1.5" opacity="0.6"/>`;
  }

  // Background noise dots
  let dots = '';
  for (let i = 0; i < 25; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 1.8;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#9381ff" opacity="0.4"/>`;
  }

  // Render distorted characters
  let textElements = '';
  const charSpacing = width / (text.length + 1.2);
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = 18 + i * charSpacing;
    const y = 33 + (Math.random() * 6 - 3);
    const rot = Math.floor(Math.random() * 26) - 13;
    const colors = ['#264653', '#2a9d8f', '#e76f51', '#1d3557', '#457b9d'];
    const color = colors[i % colors.length];
    textElements += `<text x="${x}" y="${y}" font-family="Courier, monospace, sans-serif" font-size="24" font-weight="bold" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #fefae0; border-radius: 6px; border: 1px solid #e9d8a6;">
    ${lines}
    ${dots}
    ${textElements}
  </svg>`;
};

/**
 * Create a new CAPTCHA challenge.
 * Returns { captchaId, svg }
 */
const createCaptcha = () => {
  // Use easily readable characters (exclude 0, O, 1, I, l)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let answer = '';
  for (let i = 0; i < 5; i++) {
    answer += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const captchaId = crypto.randomBytes(16).toString('hex');
  const svg = generateCaptchaSvg(answer);

  // Store answer lowercased with 5-minute expiry
  captchaStore.set(captchaId, {
    answer: answer.toLowerCase(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return {
    captchaId,
    svg,
  };
};

/**
 * Verify a CAPTCHA response.
 * Enforces single-use by immediately deleting the challenge ID.
 */
const verifyCaptcha = (captchaId, userInput) => {
  if (!captchaId || !userInput) {
    return false;
  }

  const challenge = captchaStore.get(captchaId);
  if (!challenge) {
    return false; // Challenge not found or already consumed
  }

  // Single-use guarantee: consume immediately
  captchaStore.delete(captchaId);

  // Check expiration
  if (Date.now() > challenge.expiresAt) {
    return false;
  }

  // Compare case-insensitively
  return challenge.answer === String(userInput).trim().toLowerCase();
};

module.exports = {
  createCaptcha,
  verifyCaptcha,
};

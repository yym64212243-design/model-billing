/**
 * Model Billing Bridge - Content Script
 * 在 ChatGPT / Claude / Gemini 等页面右下角注入「Open Billing」，打开 Billing 站并带上来源参数。
 */

const DEFAULT_BILLING_URL_BASE = 'http://localhost:3000/billing';
const STORAGE_KEY_BILLING_URL_BASE = 'billingUrlBase';

const BUTTON_ID = 'model-billing-bridge-btn';

function isSupportedAiPage() {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  return (
    host.includes('openai.com') ||
    host.includes('chatgpt.com') ||
    host === 'chat.openai.com' ||
    host.includes('claude.ai') ||
    host.includes('anthropic.com') ||
    host.includes('gemini.google.com') ||
    host.includes('bard.google.com') ||
    (host.includes('google.com') && path.includes('gemini')) ||
    host.includes('openclaw.io') ||
    host.includes('openclaw.com') ||
    (host === 'localhost' && path.includes('billing'))
  );
}

function normalizeBillingBase(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

function getBillingBaseFromStorage() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get([STORAGE_KEY_BILLING_URL_BASE], (result) => {
        const saved = normalizeBillingBase(result?.[STORAGE_KEY_BILLING_URL_BASE]);
        resolve(saved || DEFAULT_BILLING_URL_BASE);
      });
    } catch (_) {
      resolve(DEFAULT_BILLING_URL_BASE);
    }
  });
}

function buildBillingUrl(base) {
  const params = new URLSearchParams();
  params.set('source', 'chrome_extension');
  params.set('host', window.location.hostname);
  params.set('path', window.location.pathname || '/');
  params.set('return_url', window.location.href);
  return `${base}?${params.toString()}`;
}

async function openBilling() {
  const base = await getBillingBaseFromStorage();
  const url = buildBillingUrl(base);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function createButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open Billing');
  btn.textContent = 'Open Billing';
  btn.className = 'model-billing-bridge-btn openclaw-billing-bridge-btn';

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await openBilling();
  });

  document.body.appendChild(btn);
}

function init() {
  if (!isSupportedAiPage()) return;
  createButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

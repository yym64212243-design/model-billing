const STORAGE_KEY_BILLING_URL_BASE = 'billingUrlBase';
const DEFAULT_BILLING_URL_BASE = 'http://localhost:3000/billing';

const input = document.getElementById('billing-url');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const statusEl = document.getElementById('status');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#b91c1c' : '#475569';
}

function normalizeBillingBase(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

function loadOptions() {
  chrome.storage.sync.get([STORAGE_KEY_BILLING_URL_BASE], (result) => {
    const saved = normalizeBillingBase(result?.[STORAGE_KEY_BILLING_URL_BASE]) || DEFAULT_BILLING_URL_BASE;
    input.value = saved;
  });
}

function saveOptions() {
  const normalized = normalizeBillingBase(input.value);
  if (!normalized) {
    setStatus('Invalid URL. Use http:// or https://', true);
    return;
  }
  chrome.storage.sync.set({ [STORAGE_KEY_BILLING_URL_BASE]: normalized }, () => {
    setStatus('Saved.');
  });
}

function resetToDefault() {
  chrome.storage.sync.set({ [STORAGE_KEY_BILLING_URL_BASE]: DEFAULT_BILLING_URL_BASE }, () => {
    input.value = DEFAULT_BILLING_URL_BASE;
    setStatus('Reset to default.');
  });
}

saveBtn.addEventListener('click', saveOptions);
resetBtn.addEventListener('click', resetToDefault);
document.addEventListener('DOMContentLoaded', loadOptions);

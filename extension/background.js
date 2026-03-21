// Model Billing Bridge - Background Service Worker

const STORAGE_KEY_BILLING_URL_BASE = 'billingUrlBase';
const DEFAULT_BILLING_URL_BASE = 'http://localhost:3000/billing';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([STORAGE_KEY_BILLING_URL_BASE], (result) => {
    if (!result?.[STORAGE_KEY_BILLING_URL_BASE]) {
      chrome.storage.sync.set({ [STORAGE_KEY_BILLING_URL_BASE]: DEFAULT_BILLING_URL_BASE });
    }
  });
  console.log('Model Billing Bridge installed.');
});

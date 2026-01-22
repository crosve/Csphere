// utils.js

// 1. Safe Polyfill: Use 'self' instead of 'window'
// In a Service Worker, 'self' refers to the ServiceWorkerGlobalScope.
if (typeof browser === "undefined") {
  self.browser = chrome;
}

/*
Cross-browser/version replacement for executeScript 
*/
function executeContentScript(tabId, file) {
  // Chrome MV3 path (Scripting API)
  if (chrome.scripting && chrome.scripting.executeScript) {
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [file],
    });
  }

  // Fallback/Firefox MV2 path
  if (browser.tabs && browser.tabs.executeScript) {
    return browser.tabs.executeScript(tabId, {
      file: file,
    });
  }

  console.error("No compatible executeScript API found");
}

/*
Getting active tab across browsers
*/
async function getActiveTab() {
  // Chrome MV3 uses promises for the 'tabs' API
  if (chrome.tabs && chrome.tabs.query) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  return null;
}

// 2. Exposing functions globally
// We attach to 'self' so both Service Workers and Window contexts can see it.
export const utils = { executeContentScript, getActiveTab };

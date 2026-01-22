// polyfilling browser to ensure it exists in Chrome MV3

const root = typeof window !== "undefined" ? window : globalThis;
if (typeof root.browser === "undefined" && typeof root.chrome !== "undefined") {
  root.browser = root.chrome;
}
/*
cross-browser replacement for chrome.scripting.executeScript 
*/

function executeContentScript(tabId, file) {
  // Firefox MV2
  if (root.browser?.tabs?.executeScript) {
    return root.browser.tabs.executeScript(tabId, { file });
  }

  // Chrome MV3
  if (root.chrome?.scripting?.executeScript) {
    return root.chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
  }

  console.error("No compatible executeScript API found");
}

/*
getting active tab across browsers
*/

async function getActiveTab() {
  // Firefox / polyfilled "browser" path
  if (root.browser?.tabs?.query) {
    const [tab] = await root.browser.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Chrome fallback
  if (root.chrome?.tabs?.query) {
    return new Promise((resolve) => {
      root.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
    });
  }

  console.error("No compatible getActiveTab API found");
  return null;
}

root.utils = {
  executeContentScript,
  getActiveTab,
};
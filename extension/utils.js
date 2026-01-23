// polyfilling browser to ensure it exists in Chrome MV3

if (typeof browser == "undefined") {
  window.browser = chrome;
}
/*
Cross-browser/version replacement for executeScript 
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
Getting active tab across browsers
*/
async function getActiveTab() {
  if (browser.tabs && browser.tabs.query) {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  if (chrome.tabs && chrome.tabs.query) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true }, (tabs) => resolve(tabs[0]));
    });
  }

  console.error("No comptabile getActiveTab API found");
  return null;
}

// exposing the functions globally for all scripts

self.utils = {
  executeContentScript,
  getActiveTab,
};

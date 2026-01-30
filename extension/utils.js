const root = typeof globalThis !== "undefined" ? globalThis : self;

// polyfilling browser to ensure it exists in Chrome MV3 and MV2 contexts
if (typeof root.browser === "undefined" && typeof root.chrome !== "undefined") {
  root.browser = root.chrome;
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
  if (root.browser?.tabs?.query) {
    const [tab] = await root.browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  if (root.chrome?.tabs?.query) {
    return new Promise((resolve) => {
      root.chrome.tabs.query({ active: true }, (tabs) => resolve(tabs[0]));
    });
  }

  console.error("No comptabile getActiveTab API found");
  return null;
}

// exposing the functions globally for all scripts
root.utils = {
  executeContentScript,
  getActiveTab,
};

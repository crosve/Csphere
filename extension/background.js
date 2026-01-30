if (typeof importScripts === "function") {
  importScripts("utils.js");
}

console.log("Background script loaded and running...");
browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and background script running...");
});

// For firefox MV2: browser.browserAction
// For chrome/edge/opera: browser.action

const clickAction = browser.action || browser.browserAction;

clickAction.onClicked.addListener(async (tab) => {
  globalThis.utils.executeContentScript(tab.id, "content.js");
});

// chrome.action.onClicked.addListener((tab) => {
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: getHtml,
//   });
// });
// function getHtml() {
//   const html = document.documentElement.outerHTML;
//   console.log(html); // You can also send this to the background script or store it as needed
// }

// // background.js
// chrome.action.onClicked.addListener(async (tab) => {
//   if (!tab.id) return;

//   // Inject content.js
//   await chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ["content.js"],
//   });

//   // Send message to the content script to extract HTML
//   chrome.tabs.sendMessage(tab.id, { action: "extractHTML" });
// });

// // Listen for HTML from content script
// chrome.runtime.onMessage.addListener((request) => {
//   if (request.action === "htmlExtracted") {
//     console.log("Extracted HTML:", request.html);
//   }
// });

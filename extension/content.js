var htmlContent = document.documentElement.outerHTML;

browser.runtime.sendMessage({
  action: "htmlExtracted",
  html: htmlContent,
});

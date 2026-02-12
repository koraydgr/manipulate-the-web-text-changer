chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "manipulate-text-action",
    title: "Manipulate!",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "manipulate-text-action") {
    
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.includes("chromewebstore.google.com") || tab.url.includes("chrome.google.com/webstore")) {
      console.log("This extension does not work on browser settings pages or the web store.");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { 
      action: "open_modal", 
      selectedText: info.selectionText 
    }).catch(err => {
      // Hata sadece konsolda sessizce tutulur, kullanıcıya hiçbir pop-up (alert) gösterilmez.
      console.error("Connection error (page might need refresh):", err);
    });
  }
});
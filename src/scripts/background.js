// Listener for when the extension is installed or updated
// This ensures the context menu is created when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Listener for messages sent from other parts of the extension
// For example, this listens for a message to update the context menu
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateContextMenu") {
    createContextMenu();
  }
});

// Function to create the context menu
function createContextMenu() {
  // Remove all existing context menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create the main context menu item
    chrome.contextMenus.create({
      id: "queries",
      title: "Queries",
      contexts: ["selection"], // Only show this menu when text is selected
    });

    // Create parent context menu items for URLs and Recipes
    chrome.contextMenus.create({
      id: "urls",
      parentId: "queries",
      title: "Lookups",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "recipes",
      parentId: "queries",
      title: "Recipes",
      contexts: ["selection"],
    });

    // Retrieve saved URLs and recipes from local storage
    chrome.storage.sync.get(["savedUrls", "savedRecipes"], (data) => {
      let urls = data.savedUrls || [];
      let recipes = data.savedRecipes || [];

      // Create a context menu item for each saved URL under the URLs parent
      urls.forEach((item) => {
        chrome.contextMenus.create({
          id: `url-${item.id}`,
          parentId: "urls",
          title: `${item.name}`,
          contexts: ["selection"],
        });
      });

      // Create a context menu item for each saved recipe under the Recipes parent
      recipes.forEach((item) => {
        chrome.contextMenus.create({
          id: `recipe-${item.id}`,
          parentId: "recipes",
          title: `${item.name}`,
          contexts: ["selection"],
        });
      });
    });
  });
}

// Listener for when a context menu item is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Retrieve saved URLs, recipes, and the CyberChef URL from local storage
  chrome.storage.sync.get(
    ["savedUrls", "savedRecipes", "cyberchefUrl"],
    (data) => {
      let urls = data.savedUrls || [];
      let recipes = data.savedRecipes || [];
      let cyberchefUrl =
        data.cyberchefUrl ||
        "https://gchq.github.io/CyberChef/#recipe=${recipe}&input=${encodedText}";

      if (info.menuItemId.startsWith("url-")) {
        // Handle URL context menu item clicks
        // Find the selected URL item
        let selectedItem = urls.find(
          (item) => `url-${item.id}` === info.menuItemId
        );
        if (selectedItem) {
          // Encode the selected text and replace the placeholder in the URL
          let encodedText = encodeURIComponent(info.selectionText);
          let finalUrl = selectedItem.url.replace("{placeholder}", encodedText);
          // Open the final URL in a new tab or notify the user if the URL is invalid
          if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
            chrome.tabs.create({ url: finalUrl });
          } else {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Blocked URL',
              message: 'Only http(s) URLs are allowed.'
            });
          }
        }
      } else if (info.menuItemId.startsWith("recipe-")) {
        // Handle Recipe context menu item clicks
        // Find the selected recipe item
        let selectedItem = recipes.find(
          (item) => `recipe-${item.id}` === info.menuItemId
        );
        if (selectedItem) {
          // Base64 encode the selected text and replace the placeholders in the URL
          let encodedText = btoa(info.selectionText);
          let finalUrl = cyberchefUrl
            .replace("${recipe}", selectedItem.recipe)
            .replace("${encodedText}", encodedText);
          // Open the final URL in a new tab or notify the user if the URL is invalid
          if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
            chrome.tabs.create({ url: finalUrl });
          } else {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Blocked URL',
              message: 'Only http(s) URLs are allowed.'
            });
          }
        }
      }
    }
  );
});

// Listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Listener for messages sent from other parts of the extension
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateContextMenu") {
    createContextMenu();
  }
});

// Function to create the context menu
function createContextMenu() {
  // Remove all existing context menu items
  chrome.contextMenus.removeAll(() => {
    // Create the main context menu item
    chrome.contextMenus.create({
      id: "queries",
      title: "Queries",
      contexts: ["selection"],
    });

    // Create parent context menu items for URLs and Recipes
    chrome.contextMenus.create({
      id: "urls",
      parentId: "queries",
      title: "URLs",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "recipes",
      parentId: "queries",
      title: "Recipes",
      contexts: ["selection"],
    });

    // Retrieve saved URLs from local storage
    chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
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
  // Retrieve saved URLs and recipes from local storage
  chrome.storage.local.get(
    ["savedUrls", "savedRecipes", "cyberchefUrl"],
    (data) => {
      let urls = data.savedUrls || [];
      let recipes = data.savedRecipes || [];
      let cyberchefUrl =
        data.cyberchefUrl ||
        "https://gchq.github.io/CyberChef/#recipe=${selectedItem.recipe}&input=${encodedText}";

      if (info.menuItemId.startsWith("url-")) {
        // Find the selected URL item
        let selectedItem = urls.find(
          (item) => `url-${item.id}` === info.menuItemId
        );
        if (selectedItem) {
          // Encode the selected text and replace the placeholder in the URL
          let encodedText = encodeURIComponent(info.selectionText);
          let finalUrl = selectedItem.url.replace("{placeholder}", encodedText);
          // Open the final URL in a new tab
          chrome.tabs.create({ url: finalUrl });
        }
      } else if (info.menuItemId.startsWith("recipe-")) {
        // Find the selected recipe item
        let selectedItem = recipes.find(
          (item) => `recipe-${item.id}` === info.menuItemId
        );
        if (selectedItem) {
          // Base64 encode the selected text and replace the placeholders in the URL
          let encodedText = btoa(info.selectionText);
          let finalUrl = cyberchefUrl
            .replace("${selectedItem.recipe}", selectedItem.recipe)
            .replace("${encodedText}", encodedText);
          // Open the final URL in a new tab
          chrome.tabs.create({ url: finalUrl });
        }
      }
    }
  );
});

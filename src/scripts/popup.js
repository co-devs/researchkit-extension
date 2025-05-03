// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
  const urlList = document.getElementById("urlList");
  const recipeList = document.getElementById("recipeList");

  // Load saved URLs and recipes from storage
  chrome.storage.sync.get(["savedUrls", "savedRecipes"], (data) => {
    const urls = data.savedUrls || [];
    const recipes = data.savedRecipes || [];

    // Display saved URLs
    urls.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.name;
      urlList.appendChild(li);
    });

    // Display saved recipes
    recipes.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.name;
      recipeList.appendChild(li);
    });
  });

  // Load the saved dark mode preference and apply it to the popup
  chrome.storage.sync.get("darkMode", (data) => {
    if (data.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });

  // Listen for messages from other parts of the extension
  // For example, this listens for updates to the dark mode preference
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleDarkMode") {
      document.body.classList.toggle("dark-mode", message.darkMode);
    }
  });

  // Example: Add event listeners for popup-specific actions
  // (Add your popup-specific logic here if needed)

  // Example: Handle button clicks in the popup
  const exampleButton = document.getElementById("exampleButton");
  if (exampleButton) {
    exampleButton.addEventListener("click", () => {
      alert("Button clicked!");
    });
  }
});

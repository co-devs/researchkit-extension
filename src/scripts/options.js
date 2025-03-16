// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
  // Get the urlTable and recipeTable elements from options.html
  const urlTable = document.getElementById("urlTable");
  const recipeTable = document.getElementById("recipeTable");

  const cyberchefUrlInput = document.getElementById("cyberchefUrl");
  const saveButton = document.getElementById("saveCyberchefUrl");
  const resetButton = document.getElementById("resetCyberchefUrl");

  const defaultCyberchefUrl =
    "https://gchq.github.io/CyberChef/#recipe=${recipe}&input=${encodedText}";

  // Load the saved CyberChef URL from storage
  chrome.storage.local.get("cyberchefUrl", (data) => {
    if (data.cyberchefUrl) {
      cyberchefUrlInput.value = data.cyberchefUrl;
    }
  });

  // Save the CyberChef URL to storage
  saveButton.addEventListener("click", () => {
    const cyberchefUrl = cyberchefUrlInput.value;
    chrome.storage.local.set({ cyberchefUrl }, () => {
      alert("CyberChef URL saved.");
    });
  });

  // Reset the CyberChef URL to the default value
  resetButton.addEventListener("click", () => {
    cyberchefUrlInput.value = defaultCyberchefUrl;
    chrome.storage.local.set({ cyberchefUrl: defaultCyberchefUrl }, () => {
      alert("CyberChef URL reset to default.");
    });
  });

  // Function to load saved options from chrome storage and display them
  function loadOptions() {
    chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
      // Clear the current list
      if (urlTable) {
        urlTable.innerHTML =
          "<tr><th>Name</th><th>URL</th><th>Action</th></tr>";
      }
      if (recipeTable) {
        recipeTable.innerHTML =
          "<tr><th>Name</th><th>Recipe</th><th>Action</th></tr>";
      }
      // Iterate over saved URLs and create table rows for each
      (data.savedUrls || []).forEach((item, index) => {
        let tr = createUrlRow(item, index);
        if (urlTable) {
          urlTable.appendChild(tr);
        }
      });
      // Iterate over saved Recipes and create table rows for each
      (data.savedRecipes || []).forEach((item, index) => {
        let tr = createRecipeRow(item, index);
        if (recipeTable) {
          recipeTable.appendChild(tr);
        }
      });
    });
  }

  // Function to create a table row element for a given URL
  function createUrlRow(item, index) {
    let tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.url}</code></td>`;
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    // Set up the remove button to delete the item when clicked
    removeBtn.onclick = () => removeUrlItem(index);
    let actionTd = document.createElement("td");
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);
    return tr;
  }

  // Function to create a table row element for a given Recipe
  function createRecipeRow(item, index) {
    let tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.recipe}</code></td>`;
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    // Set up the remove button to delete the item when clicked
    removeBtn.onclick = () => removeRecipeItem(index);
    let actionTd = document.createElement("td");
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);
    return tr;
  }

  // Function to remove an item from the saved URLs
  function removeUrlItem(index) {
    chrome.storage.local.get(["savedUrls"], (data) => {
      let items = data.savedUrls || [];
      // Remove the item at the specified index
      items.splice(index, 1);
      // Save the updated list back to chrome storage and reload options
      chrome.storage.local.set({ savedUrls: items }, loadOptions);
      // Notify the background script to update the context menu
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    });
  }

  // Function to remove an item from the saved Recipes
  function removeRecipeItem(index) {
    chrome.storage.local.get(["savedRecipes"], (data) => {
      let items = data.savedRecipes || [];
      // Remove the item at the specified index
      items.splice(index, 1);
      // Save the updated list back to chrome storage and reload options
      chrome.storage.local.set({ savedRecipes: items }, loadOptions);
      // Notify the background script to update the context menu
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    });
  }

  // Set up the add URL button to save a new URL when clicked
  document.getElementById("addUrl").addEventListener("click", () => {
    let name = document.getElementById("urlName").value.trim();
    let url = document.getElementById("urlValue").value.trim();
    // Ensure the name is not empty and the URL contains the placeholder
    if (name && url.includes("{placeholder}")) {
      chrome.storage.local.get(["savedUrls"], (data) => {
        let urls = data.savedUrls || [];
        // Create a new item with a unique ID, name, and URL
        let newItem = { id: Date.now(), name, url };
        // Add the new item to the list and save it to chrome storage
        urls.push(newItem);
        chrome.storage.local.set({ savedUrls: urls }, loadOptions);
        // Notify the background script to update the context menu
        chrome.runtime.sendMessage({ action: "updateContextMenu" });
      });
    }
  });

  // Set up the add Recipe button to save a new Recipe when clicked
  document.getElementById("addRecipe").addEventListener("click", () => {
    let name = document.getElementById("recipeName").value.trim();
    let recipe = document.getElementById("recipeValue").value.trim();
    // Ensure the name and recipe are not empty
    if (name && recipe) {
      chrome.storage.local.get(["savedRecipes"], (data) => {
        let recipes = data.savedRecipes || [];
        // Create a new item with a unique ID, name, and recipe
        let newItem = { id: Date.now(), name, recipe };
        // Add the new item to the list and save it to chrome storage
        recipes.push(newItem);
        chrome.storage.local.set({ savedRecipes: recipes }, loadOptions);
        // Notify the background script to update the context menu
        chrome.runtime.sendMessage({ action: "updateContextMenu" });
      });
    }
  });

  // Load the saved options when the page is loaded
  loadOptions();
});

// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
  // Get the urlTable and recipeTable elements from options.html
  const urlTable = document.getElementById("urlTable");
  const recipeTable = document.getElementById("recipeTable");

  const cyberchefUrlInput = document.getElementById("cyberchefUrl");
  const saveButton = document.getElementById("saveCyberchefUrl");
  const resetButton = document.getElementById("resetCyberchefUrl");

  const urlNameInput = document.getElementById("urlName");
  const urlValueInput = document.getElementById("urlValue");
  const addUrlButton = document.getElementById("addUrl");

  const recipeNameInput = document.getElementById("recipeName");
  const recipeValueInput = document.getElementById("recipeValue");
  const addRecipeButton = document.getElementById("addRecipe");

  const defaultCyberchefUrl =
    "https://gchq.github.io/CyberChef/#recipe=${recipe}&input=${encodedText}";

  let savedUrls = [];
  let savedRecipes = [];

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
      savedUrls = data.savedUrls || [];
      savedRecipes = data.savedRecipes || [];

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
      savedUrls.forEach((item, index) => {
        let tr = createUrlRow(item, index);
        if (urlTable) {
          urlTable.appendChild(tr);
        }
      });
      // Iterate over saved Recipes and create table rows for each
      savedRecipes.forEach((item, index) => {
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
    tr.draggable = true;
    tr.dataset.index = index;
    tr.dataset.type = "url";
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.url}</code></td>`;
    let actionTd = document.createElement("td");

    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeUrlItem(index);
    actionTd.appendChild(removeBtn);

    tr.appendChild(actionTd);
    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to create a table row element for a given Recipe
  function createRecipeRow(item, index) {
    let tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = index;
    tr.dataset.type = "recipe";
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.recipe}</code></td>`;
    let actionTd = document.createElement("td");

    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeRecipeItem(index);
    actionTd.appendChild(removeBtn);

    tr.appendChild(actionTd);
    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to add drag and drop handlers to a table row
  function addDragAndDropHandlers(row) {
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
  }

  let draggedRow = null;

  function handleDragStart(event) {
    draggedRow = event.target;
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event) {
    event.preventDefault();
    if (
      draggedRow !== event.target &&
      draggedRow.dataset.type === event.target.closest("tr").dataset.type
    ) {
      let rows = Array.from(draggedRow.parentNode.children);
      let draggedIndex = rows.indexOf(draggedRow);
      let targetIndex = rows.indexOf(event.target.closest("tr"));
      if (draggedIndex < targetIndex) {
        event.target.closest("tr").after(draggedRow);
      } else {
        event.target.closest("tr").before(draggedRow);
      }
      updateOrder();
    }
  }

  function updateOrder() {
    let urlRows = Array.from(urlTable.querySelectorAll("tr")).slice(1);
    let recipeRows = Array.from(recipeTable.querySelectorAll("tr")).slice(1);

    let newUrls = urlRows.map((row) => {
      let index = row.dataset.index;
      return savedUrls[index];
    });

    let newRecipes = recipeRows.map((row) => {
      let index = row.dataset.index;
      return savedRecipes[index];
    });

    chrome.storage.local.set(
      { savedUrls: newUrls, savedRecipes: newRecipes },
      () => {
        chrome.runtime.sendMessage({ action: "updateContextMenu" });
      }
    );
  }

  // Function to remove an item from the saved URLs
  function removeUrlItem(index) {
    savedUrls.splice(index, 1);
    chrome.storage.local.set({ savedUrls }, loadOptions);
    chrome.runtime.sendMessage({ action: "updateContextMenu" });
  }

  // Function to remove an item from the saved Recipes
  function removeRecipeItem(index) {
    savedRecipes.splice(index, 1);
    chrome.storage.local.set({ savedRecipes }, loadOptions);
    chrome.runtime.sendMessage({ action: "updateContextMenu" });
  }

  // Function to add a new URL
  function addUrl() {
    let name = urlNameInput.value.trim();
    let url = urlValueInput.value.trim();
    // Ensure the name is not empty and the URL contains the placeholder
    if (name && url.includes("{placeholder}")) {
      let newItem = { id: Date.now(), name, url };
      savedUrls.push(newItem);
      chrome.storage.local.set({ savedUrls }, loadOptions);
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    }
  }

  // Function to add a new Recipe
  function addRecipe() {
    let name = recipeNameInput.value.trim();
    let recipe = recipeValueInput.value.trim();
    // Ensure the name and recipe are not empty
    if (name && recipe) {
      let newItem = { id: Date.now(), name, recipe };
      savedRecipes.push(newItem);
      chrome.storage.local.set({ savedRecipes }, loadOptions);
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    }
  }

  // Function to export saved lookups and recipes to a JSON file
  function exportData() {
    chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
      const exportData = {
        savedUrls: data.savedUrls || [],
        savedRecipes: data.savedRecipes || []
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "researchkit_export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Function to import lookups and recipes from a JSON file
  function importData(event) {
    const fileInput = document.getElementById("importFile");
    fileInput.click();

    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            chrome.storage.local.get(["savedUrls", "savedRecipes"], (currentData) => {
              const mergedUrls = [...(currentData.savedUrls || []), ...(importedData.savedUrls || [])];
              const mergedRecipes = [...(currentData.savedRecipes || []), ...(importedData.savedRecipes || [])];

              chrome.storage.local.set({ savedUrls: mergedUrls, savedRecipes: mergedRecipes }, () => {
                alert("Data imported successfully.");
                loadOptions();
              });
            });
          } catch (error) {
            alert("Invalid JSON file.");
          }
        };
        reader.readAsText(file);
      }
    };
  }

  // Set up the add URL button to save a new URL when clicked
  addUrlButton.addEventListener("click", addUrl);

  // Set up the add Recipe button to save a new Recipe when clicked
  addRecipeButton.addEventListener("click", addRecipe);

  // Add event listeners to handle pressing the enter key
  urlNameInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      addUrl();
    }
  });

  urlValueInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      addUrl();
    }
  });

  recipeNameInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      addRecipe();
    }
  });

  recipeValueInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      addRecipe();
    }
  });

  // Add event listener to the export button
  document.getElementById("exportData").addEventListener("click", exportData);

  // Add event listener to the import button
  document.getElementById("importData").addEventListener("click", importData);

  // Load the saved options when the page is loaded
  loadOptions();

  const urlsSection = document.getElementById("urlsSection");
  const recipesSection = document.getElementById("recipesSection");
  const advancedSettingsSection = document.getElementById("advancedSettingsSection");
  const showUrlsButton = document.getElementById("showUrls");
  const showRecipesButton = document.getElementById("showRecipes");
  const showAdvancedSettingsButton = document.getElementById("showAdvancedSettings");

  // Function to show the URLs section and hide the Recipes and Advanced Settings sections
  function showUrls() {
    urlsSection.classList.add("active");
    recipesSection.classList.remove("active");
    advancedSettingsSection.classList.remove("active");
  }

  // Function to show the Recipes section and hide the URLs and Advanced Settings sections
  function showRecipes() {
    recipesSection.classList.add("active");
    urlsSection.classList.remove("active");
    advancedSettingsSection.classList.remove("active");
  }

  // Function to show the Advanced Settings section and hide the URLs and Recipes sections
  function showAdvancedSettings() {
    advancedSettingsSection.classList.add("active");
    urlsSection.classList.remove("active");
    recipesSection.classList.remove("active");
  }

  // Add event listeners to the menu buttons
  showUrlsButton.addEventListener("click", showUrls);
  showRecipesButton.addEventListener("click", showRecipes);
  showAdvancedSettingsButton.addEventListener("click", showAdvancedSettings);

  // Show the URLs section by default
  showUrls();

  const darkModeToggle = document.getElementById("darkModeToggle");

  // Load the saved dark mode preference
  chrome.storage.local.get("darkMode", (data) => {
    if (data.darkMode) {
      document.body.classList.add("dark-mode");
      darkModeToggle.checked = true;
    }
  });

  // Toggle dark mode and save the preference
  darkModeToggle.addEventListener("change", () => {
    const isDarkMode = darkModeToggle.checked;
    document.body.classList.toggle("dark-mode", isDarkMode);
    chrome.storage.local.set({ darkMode: isDarkMode });

    // Notify the popup to update its dark mode
    chrome.runtime.sendMessage({ action: "toggleDarkMode", darkMode: isDarkMode });
  });
});

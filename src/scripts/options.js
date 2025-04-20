// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
  // Get references to HTML elements for URLs, Recipes, and CyberChef settings
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

  // Load the saved CyberChef URL from storage and populate the input field
  chrome.storage.local.get("cyberchefUrl", (data) => {
    if (data.cyberchefUrl) {
      cyberchefUrlInput.value = data.cyberchefUrl;
    }
  });

  // Save the CyberChef URL to storage when the save button is clicked
  saveButton.addEventListener("click", () => {
    const cyberchefUrl = cyberchefUrlInput.value;
    chrome.storage.local.set({ cyberchefUrl }, () => {
      alert("CyberChef URL saved.");
    });
  });

  // Reset the CyberChef URL to the default value when the reset button is clicked
  resetButton.addEventListener("click", () => {
    cyberchefUrlInput.value = defaultCyberchefUrl;
    chrome.storage.local.set({ cyberchefUrl: defaultCyberchefUrl }, () => {
      alert("CyberChef URL reset to default.");
    });
  });

  // Function to load saved URLs and Recipes from storage and display them in tables
  function loadOptions() {
    chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
      savedUrls = data.savedUrls || [];
      savedRecipes = data.savedRecipes || [];

      // Clear the current table content
      if (urlTable) {
        urlTable.innerHTML =
          "<tr><th>Name</th><th>URL</th><th>Action</th></tr>";
      }
      if (recipeTable) {
        recipeTable.innerHTML =
          "<tr><th>Name</th><th>Recipe</th><th>Action</th></tr>";
      }

      // Populate the URL table with saved URLs
      savedUrls.forEach((item, index) => {
        let tr = createUrlRow(item, index);
        if (urlTable) {
          urlTable.appendChild(tr);
        }
      });

      // Populate the Recipe table with saved Recipes
      savedRecipes.forEach((item, index) => {
        let tr = createRecipeRow(item, index);
        if (recipeTable) {
          recipeTable.appendChild(tr);
        }
      });
    });
  }

  // Function to create a table row for a saved URL
  function createUrlRow(item, index) {
    let tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = index;
    tr.dataset.type = "url";
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.url}</code></td>`;
    let actionTd = document.createElement("td");

    // Add a remove button to the row
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeUrlItem(index);
    actionTd.appendChild(removeBtn);

    tr.appendChild(actionTd);
    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to create a table row for a saved Recipe
  function createRecipeRow(item, index) {
    let tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = index;
    tr.dataset.type = "recipe";
    tr.innerHTML = `<td>${item.name}</td><td><code>${item.recipe}</code></td>`;
    let actionTd = document.createElement("td");

    // Add a remove button to the row
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeRecipeItem(index);
    actionTd.appendChild(removeBtn);

    tr.appendChild(actionTd);
    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to add drag-and-drop handlers to a table row
  function addDragAndDropHandlers(row) {
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
  }

  let draggedRow = null;

  // Handle the start of a drag event
  function handleDragStart(event) {
    draggedRow = event.target;
    event.dataTransfer.effectAllowed = "move";
  }

  // Handle the drag-over event
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  // Handle the drop event
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

  // Update the order of URLs and Recipes after a drag-and-drop operation
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

  // Function to remove a URL from the saved list
  function removeUrlItem(index) {
    savedUrls.splice(index, 1);
    chrome.storage.local.set({ savedUrls }, loadOptions);
    chrome.runtime.sendMessage({ action: "updateContextMenu" });
  }

  // Function to remove a Recipe from the saved list
  function removeRecipeItem(index) {
    savedRecipes.splice(index, 1);
    chrome.storage.local.set({ savedRecipes }, loadOptions);
    chrome.runtime.sendMessage({ action: "updateContextMenu" });
  }

  // Function to add a new URL to the saved list
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

  // Function to add a new Recipe to the saved list
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

  // Function to export saved URLs and Recipes to a JSON file
  function exportData() {
    chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
      const exportData = {
        savedUrls: data.savedUrls || [],
        savedRecipes: data.savedRecipes || [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "researchkit_export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Function to import URLs and Recipes from a JSON file
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
            chrome.storage.local.get(
              ["savedUrls", "savedRecipes"],
              (currentData) => {
                const mergedUrls = [
                  ...(currentData.savedUrls || []),
                  ...(importedData.savedUrls || []),
                ];
                const mergedRecipes = [
                  ...(currentData.savedRecipes || []),
                  ...(importedData.savedRecipes || []),
                ];

                chrome.storage.local.set(
                  { savedUrls: mergedUrls, savedRecipes: mergedRecipes },
                  () => {
                    alert("Data imported successfully.");
                    loadOptions();
                  }
                );
              }
            );
          } catch (error) {
            alert("Invalid JSON file.");
          }
        };
        reader.readAsText(file);
      }
    };
  }

  // Set up event listeners for adding URLs and Recipes
  addUrlButton.addEventListener("click", addUrl);
  addRecipeButton.addEventListener("click", addRecipe);

  // Add event listeners to handle pressing the Enter key for inputs
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

  // Add event listeners for exporting and importing data
  document.getElementById("exportData").addEventListener("click", exportData);
  document.getElementById("importData").addEventListener("click", importData);

  // Load the saved options when the page is loaded
  loadOptions();

  // Section toggling logic for URLs, Recipes, and Advanced Settings
  const urlsSection = document.getElementById("urlsSection");
  const recipesSection = document.getElementById("recipesSection");
  const advancedSettingsSection = document.getElementById(
    "advancedSettingsSection"
  );
  const showUrlsButton = document.getElementById("showUrls");
  const showRecipesButton = document.getElementById("showRecipes");
  const showAdvancedSettingsButton = document.getElementById(
    "showAdvancedSettings"
  );

  // Function to show the URLs section and hide others
  function showUrls() {
    urlsSection.classList.add("active");
    recipesSection.classList.remove("active");
    advancedSettingsSection.classList.remove("active");
  }

  // Function to show the Recipes section and hide others
  function showRecipes() {
    recipesSection.classList.add("active");
    urlsSection.classList.remove("active");
    advancedSettingsSection.classList.remove("active");
  }

  // Function to show the Advanced Settings section and hide others
  function showAdvancedSettings() {
    advancedSettingsSection.classList.add("active");
    urlsSection.classList.remove("active");
    recipesSection.classList.remove("active");
  }

  // Add event listeners to the menu buttons for section toggling
  showUrlsButton.addEventListener("click", showUrls);
  showRecipesButton.addEventListener("click", showRecipes);
  showAdvancedSettingsButton.addEventListener("click", showAdvancedSettings);

  // Show the URLs section by default
  showUrls();

  // Dark mode toggle logic
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Load the saved dark mode preference and apply it
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
    chrome.runtime.sendMessage({
      action: "toggleDarkMode",
      darkMode: isDarkMode,
    });
  });
});

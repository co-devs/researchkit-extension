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
  const urlSearchInput = document.getElementById("urlSearch");

  const recipeNameInput = document.getElementById("recipeName");
  const recipeValueInput = document.getElementById("recipeValue");
  const addRecipeButton = document.getElementById("addRecipe");
  const recipeSearchInput = document.getElementById("recipeSearch");

  // Note modal elements
  const modal = document.getElementById("noteModal");
  const closeModalBtn = document.querySelector(".close");
  const noteTextArea = document.getElementById("noteText");
  const saveNoteBtn = document.getElementById("saveNote");
  let currentItem = null; // Will store the currently edited item
  let currentItemType = null; // Will store whether it's a URL or Recipe

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

      // Clear the current table content and add headers including the drag handle column
      if (urlTable) {
        urlTable.innerHTML =
          "<tr><th></th><th>Name</th><th>URL</th><th>Action</th></tr>"; // Added empty header for drag handle
      }
      if (recipeTable) {
        recipeTable.innerHTML =
          "<tr><th></th><th>Name</th><th>Recipe</th><th>Action</th></tr>"; // Added empty header for drag handle
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
    tr.dataset.id = item.id;

    // Create drag handle cell (first column)
    let dragHandleTd = document.createElement("td");
    let dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.title = "Drag to reorder";
    dragHandleTd.appendChild(dragHandle);

    // Create name cell with click handler for notes (second column)
    let nameTd = document.createElement("td");
    nameTd.className = "name-cell";
    nameTd.textContent = item.name;
    nameTd.onclick = () => openNoteModal(item, "url");

    // Add note indicator if note exists
    if (item.note && item.note.trim() !== "") {
      let noteIcon = document.createElement("span");
      noteIcon.className = "note-icon";
      noteIcon.innerHTML = " 📝";
      noteIcon.title = "Has note";
      nameTd.appendChild(noteIcon);
    }

    // Create URL cell
    let urlTd = document.createElement("td");
    let codeElement = document.createElement("code");
    codeElement.textContent = item.url;
    urlTd.appendChild(codeElement);

    // Create actions cell (fourth column)
    let actionTd = document.createElement("td");

    // Add a remove button
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeUrlItem(index);
    actionTd.appendChild(removeBtn);

    // Append all cells to row in the new order
    tr.appendChild(dragHandleTd); // First column
    tr.appendChild(nameTd);       // Second column
    tr.appendChild(urlTd);        // Third column
    tr.appendChild(actionTd);     // Fourth column

    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to create a table row for a saved Recipe
  function createRecipeRow(item, index) {
    let tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = index;
    tr.dataset.type = "recipe";
    tr.dataset.id = item.id;

    // Create drag handle cell (first column)
    let dragHandleTd = document.createElement("td");
    let dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.title = "Drag to reorder";
    dragHandleTd.appendChild(dragHandle);

    // Create name cell with click handler for notes (second column)
    let nameTd = document.createElement("td");
    nameTd.className = "name-cell";
    nameTd.textContent = item.name;
    nameTd.onclick = () => openNoteModal(item, "recipe");

    // Add note indicator if note exists
    if (item.note && item.note.trim() !== "") {
      let noteIcon = document.createElement("span");
      noteIcon.className = "note-icon";
      noteIcon.innerHTML = " 📝";
      noteIcon.title = "Has note";
      nameTd.appendChild(noteIcon);
    }

    // Create recipe cell
    let recipeTd = document.createElement("td");
    let codeElement = document.createElement("code");
    codeElement.textContent = item.recipe;
    recipeTd.appendChild(codeElement);

    // Create actions cell (fourth column)
    let actionTd = document.createElement("td");

    // Add a remove button
    let removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeRecipeItem(index);
    actionTd.appendChild(removeBtn);

    // Append all cells to row in the new order
    tr.appendChild(dragHandleTd); // First column
    tr.appendChild(nameTd);       // Second column
    tr.appendChild(recipeTd);     // Third column
    tr.appendChild(actionTd);     // Fourth column

    addDragAndDropHandlers(tr);
    return tr;
  }

  // Function to add drag-and-drop handlers to a table row
  function addDragAndDropHandlers(row) {
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragend", handleDragEnd);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("dragenter", handleDragEnter);
    row.addEventListener("dragleave", handleDragLeave);
    row.addEventListener("drop", handleDrop);
  }

  let draggedRow = null;

  // Handle the start of a drag event
  function handleDragStart(event) {
    draggedRow = event.target.closest("tr");
    draggedRow.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }

  // Handle the end of a drag event
  function handleDragEnd(event) {
    draggedRow.classList.remove("dragging");
    const rows = document.querySelectorAll(".drag-over");
    rows.forEach(row => row.classList.remove("drag-over"));
  }

  // Handle dragenter event (when dragged element enters a valid drop target)
  function handleDragEnter(event) {
    const targetRow = event.target.closest("tr");
    if (targetRow && draggedRow !== targetRow &&
      draggedRow.dataset.type === targetRow.dataset.type) {
      targetRow.classList.add("drag-over");
    }
  }

  // Handle dragleave event (when dragged element leaves a valid drop target)
  function handleDragLeave(event) {
    const targetRow = event.target.closest("tr");
    if (targetRow) {
      targetRow.classList.remove("drag-over");
    }
  }

  // Handle the drag-over event
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  // Handle the drop event
  function handleDrop(event) {
    event.preventDefault();
    const targetRow = event.target.closest("tr");
    if (targetRow) {
      targetRow.classList.remove("drag-over");
    }

    if (
      draggedRow !== event.target &&
      draggedRow.dataset.type === targetRow.dataset.type
    ) {
      let rows = Array.from(draggedRow.parentNode.children);
      let draggedIndex = rows.indexOf(draggedRow);
      let targetIndex = rows.indexOf(targetRow);
      if (draggedIndex < targetIndex) {
        targetRow.after(draggedRow);
      } else {
        targetRow.before(draggedRow);
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

    // Validate URL - must contain placeholder and start with http:// or https://
    if (name && url.includes("{placeholder}")) {
      // Create a test URL with a placeholder replacement to validate
      const testUrl = url.replace("{placeholder}", "test");

      if (testUrl.startsWith("http://") || testUrl.startsWith("https://")) {
        let newItem = { id: Date.now(), name, url, note: "" };
        savedUrls.push(newItem);
        chrome.storage.local.set({ savedUrls }, loadOptions);
        chrome.runtime.sendMessage({ action: "updateContextMenu" });

        // Clear input fields after successful add
        urlNameInput.value = "";
        urlValueInput.value = "";
      } else {
        alert("Error: URLs must start with http:// or https://");
      }
    } else if (!url.includes("{placeholder}")) {
      alert("Error: URL must contain {placeholder}");
    }
  }

  // Function to add a new Recipe to the saved list
  function addRecipe() {
    let name = recipeNameInput.value.trim();
    let recipe = recipeValueInput.value.trim();
    // Ensure the name and recipe are not empty
    if (name && recipe) {
      let newItem = { id: Date.now(), name, recipe, note: "" };
      savedRecipes.push(newItem);
      chrome.storage.local.set({ savedRecipes }, loadOptions);
      chrome.runtime.sendMessage({ action: "updateContextMenu" });

      // Clear input fields after successful add
      recipeNameInput.value = "";
      recipeValueInput.value = "";
    } else if (!name) {
      alert("Error: Recipe name cannot be empty");
    } else if (!recipe) {
      alert("Error: Recipe value cannot be empty");
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

                // Validate imported URLs
                let validUrls = (importedData.savedUrls || []).filter(item => {
                  if (!item.url || !item.url.includes("{placeholder}")) {
                    return false;
                  }

                  const testUrl = item.url.replace("{placeholder}", "test");
                  return testUrl.startsWith("http://") || testUrl.startsWith("https://");
                });

                if (validUrls.length < (importedData.savedUrls || []).length) {
                  const skippedCount = (importedData.savedUrls || []).length - validUrls.length;
                  alert(`Warning: ${skippedCount} URL(s) were skipped because they didn't meet security requirements.`);
                }

                // For recipes, only filter out items with empty recipe property
                let validRecipes = (importedData.savedRecipes || []).filter(item => {
                  return item.recipe; // Just ensure the recipe property exists and is not empty
                });

                const mergedUrls = [
                  ...(currentData.savedUrls || []),
                  ...validUrls,
                ];

                const mergedRecipes = [
                  ...(currentData.savedRecipes || []),
                  ...validRecipes,
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

  // Note modal functionality
  function openNoteModal(item, type) {
    currentItem = item;
    currentItemType = type;
    noteTextArea.value = item.note || "";
    modal.style.display = "block";
  }

  // Close the modal when the close button is clicked
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close the modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Save the note when the save button is clicked
  saveNoteBtn.addEventListener("click", () => {
    if (!currentItem) return;

    // Update the note in memory
    currentItem.note = noteTextArea.value;

    // Update the note in storage
    if (currentItemType === "url") {
      chrome.storage.local.set({ savedUrls }, () => {
        modal.style.display = "none";
        loadOptions(); // Reload to show note indicator
      });
    } else if (currentItemType === "recipe") {
      chrome.storage.local.set({ savedRecipes }, () => {
        modal.style.display = "none";
        loadOptions(); // Reload to show note indicator
      });
    }
  });

  // Search/filter functionality for URLs
  urlSearchInput.addEventListener("input", () => {
    filterItems(urlTable, urlSearchInput.value, savedUrls, createUrlRow);
  });

  // Search/filter functionality for Recipes
  recipeSearchInput.addEventListener("input", () => {
    filterItems(recipeTable, recipeSearchInput.value, savedRecipes, createRecipeRow);
  });

  // Function to filter items based on search input
  function filterItems(table, query, items, rowCreator) {
    // Clear the current table content, including the drag handle header
    table.innerHTML = "<tr><th></th><th>Name</th><th>" +
      (items === savedUrls ? "URL" : "Recipe") +
      "</th><th>Action</th></tr>";

    // If no query, show all items
    if (!query) {
      items.forEach((item, index) => {
        let tr = rowCreator(item, index);
        table.appendChild(tr);
      });
      return;
    }

    // Filter items by name, URL/recipe, and notes
    const lowerQuery = query.toLowerCase();
    items.forEach((item, index) => {
      if (
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.url && item.url.toLowerCase().includes(lowerQuery)) ||
        (item.recipe && item.recipe.toLowerCase().includes(lowerQuery)) ||
        (item.note && item.note.toLowerCase().includes(lowerQuery))
      ) {
        let tr = rowCreator(item, index);
        table.appendChild(tr);
      }
    });
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

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
    if (draggedRow !== event.target) {
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

  // Set up the add URL button to save a new URL when clicked
  document.getElementById("addUrl").addEventListener("click", () => {
    let name = document.getElementById("urlName").value.trim();
    let url = document.getElementById("urlValue").value.trim();
    // Ensure the name is not empty and the URL contains the placeholder
    if (name && url.includes("{placeholder}")) {
      let newItem = { id: Date.now(), name, url };
      savedUrls.push(newItem);
      chrome.storage.local.set({ savedUrls }, loadOptions);
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    }
  });

  // Set up the add Recipe button to save a new Recipe when clicked
  document.getElementById("addRecipe").addEventListener("click", () => {
    let name = document.getElementById("recipeName").value.trim();
    let recipe = document.getElementById("recipeValue").value.trim();
    // Ensure the name and recipe are not empty
    if (name && recipe) {
      let newItem = { id: Date.now(), name, recipe };
      savedRecipes.push(newItem);
      chrome.storage.local.set({ savedRecipes }, loadOptions);
      chrome.runtime.sendMessage({ action: "updateContextMenu" });
    }
  });

  // Load the saved options when the page is loaded
  loadOptions();
});

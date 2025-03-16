document.addEventListener("DOMContentLoaded", () => {
  const urlList = document.getElementById("urlList");
  const recipeList = document.getElementById("recipeList");

  // Load saved URLs and recipes from storage
  chrome.storage.local.get(["savedUrls", "savedRecipes"], (data) => {
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
});

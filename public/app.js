// Basic search
async function searchCupcakes(keyword) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
    const data = await res.json();
    resultsDiv.innerHTML = `
      <h3>Search results for "${keyword}"</h3>
      <ul>
        ${data.results.map(r => `<li><strong>${r.cname}</strong> — Ingredients: ${r.ingredients}</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Recipe suggestion
async function suggestRecipes(pantryItems) {
  try {
    const res = await fetch('/api/recipes/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: pantryItems })
    });
    const data = await res.json();
    resultsDiv.innerHTML = `
      <h3>Recipes you can make with: ${pantryItems.join(", ")}</h3>
      <ul>
        ${data.possibleCupcakes.map(c => `<li><strong>${c.cname}</strong> — Ingredients: ${c.ingredients}</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

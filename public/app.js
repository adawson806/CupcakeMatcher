const baseGroup = document.getElementById("base-group");
const icingGroup = document.getElementById("icing-group");
const toppingGroup = document.getElementById("topping-group");
const summaryText = document.getElementById("summary-text");
const resultsDiv = document.getElementById("results");
const matchBtn = document.getElementById("match-btn");
const resetBtn = document.getElementById("reset-btn");

const searchBtn = document.getElementById("search-btn");
const recipeBtn = document.getElementById("recipe-btn");

let sessionID = null;
let selections = { base: null, icing: null, topping: null };

// Utility: call backend
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Step 1: start quiz
async function startQuiz() {
  try {
    const data = await postJSON("/api/quiz/start", {});
    sessionID = data.sessionID;
    renderOptions(baseGroup, data.options, answerBase);
    icingGroup.innerHTML = "";
    toppingGroup.innerHTML = "";
    summaryText.textContent = "None yet — choose options above.";
    resultsDiv.innerHTML = "";
    matchBtn.disabled = true;
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error starting quiz: ${err.message}</p>`;
  }
}

// Render helper
function renderOptions(container, options, handler) {
  container.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => handler(opt);
    container.appendChild(btn);
  });
}

// Step 2: choose base
async function answerBase(base) {
  try {
    selections.base = base;
    const data = await postJSON("/api/quiz/answer", { sessionID, answer: base });
    renderOptions(icingGroup, data.options, answerIcing);
    toppingGroup.innerHTML = "";
    summaryText.textContent = `Base: ${base}`;
    matchBtn.disabled = true;
    resultsDiv.innerHTML = "";
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Step 3: choose icing
async function answerIcing(icing) {
  try {
    selections.icing = icing;
    const data = await postJSON("/api/quiz/answer", { sessionID, answer: icing });
    renderOptions(toppingGroup, data.options, answerTopping);
    summaryText.textContent = `Base: ${selections.base}, Icing: ${icing}`;
    matchBtn.disabled = true;
    resultsDiv.innerHTML = "";
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Step 4: choose topping
async function answerTopping(topping) {
  try {
    selections.topping = topping;
    const data = await postJSON("/api/quiz/answer", { sessionID, answer: topping });
    summaryText.textContent = `Base: ${selections.base}, Icing: ${selections.icing}, Topping: ${topping}`;
    matchBtn.disabled = false;

    matchBtn.onclick = () => {
      const recs = data.recommendation.cupcakes;
      const profile = data.recommendation.profile;
      resultsDiv.innerHTML = `
        <h3>${data.recommendation.message}</h3>
        <p><em>Your flavor profile: ${profile}</em></p>
        <ul>
          ${recs.map(c => `
            <li>
              <strong>${c.cupcake}</strong>
              ${c.retailers.length === 0
                ? `<div><em>No retailers found</em></div>`
                : `<ul>${c.retailers.map(r => `<li>${r.rname} — ${r.location}</li>`).join("")}</ul>`
              }
            </li>
          `).join("")}
        </ul>
      `;
    };
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Reset quiz
resetBtn.onclick = () => {
  selections = { base: null, icing: null, topping: null };
  icingGroup.innerHTML = "";
  toppingGroup.innerHTML = "";
  summaryText.textContent = "None yet — choose options above.";
  resultsDiv.innerHTML = "";
  matchBtn.disabled = true;
  startQuiz();
};

// Basic Search
searchBtn.onclick = async () => {
  const keyword = document.getElementById("search-input").value.trim();
  if (!keyword) return;
  try {
    const data = await getJSON(`/api/search?q=${encodeURIComponent(keyword)}`);
    resultsDiv.innerHTML = `
      <h3>Search results for "${keyword}"</h3>
      <ul>
        ${data.results.map(r => `<li><strong>${r.cname}</strong> — Ingredients: ${r.ingredients}</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
};

// Recipe Suggestion
recipeBtn.onclick = async () => {
  const pantryInput = document.getElementById("pantry-input").value.trim();
  if (!pantryInput) return;
  const pantryItems = pantryInput.split(",").map(s => s.trim()).filter(Boolean);
  try {
    const data = await postJSON('/api/recipes/suggest', { ingredients: pantryItems });
    resultsDiv.innerHTML = `
      <h3>Recipes you can make with: ${pantryItems.join(", ")}</h3>
      <ul>
        ${data.possibleCupcakes.map(c => `<li><strong>${c.cname}</strong> — Ingredients: ${c.ingredients}</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
};

// Initialize quiz
startQuiz();

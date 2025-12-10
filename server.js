/**
 * Basic Search: keyword search for cupcakes
 */
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const rows = await runQuery(`
      SELECT c.cname, GROUP_CONCAT(DISTINCT i.iname) AS ingredients
      FROM cupcake c
      LEFT JOIN cupcake_ingredient ci ON ci.cupcakeID = c.cupcakeID
      LEFT JOIN ingredient i ON i.ingredientID = ci.ingredientID
      WHERE c.cname LIKE ? OR i.iname LIKE ?
      GROUP BY c.cupcakeID
    `, [`%${q}%`, `%${q}%`]);

    res.json({ query: q, results: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Flavor Profiler classification
 */
function classifyProfile(base, icing, topping) {
  if (base.includes('Chocolate')) return 'Chocolate Lover';
  if (base.includes('Fruity') || icing.includes('Strawberry') || topping.includes('Fruit')) return 'Fruity Fanatic';
  if (base.includes('Nutty')) return 'Nutty Enthusiast';
  if (base.includes('Spiced')) return 'Spice Seeker';
  if (base.includes('Coffee')) return 'Caffeine Connoisseur';
  return 'Cupcake Explorer';
}

app.post('/api/quiz/answer', async (req, res) => {
  // ...existing code...
  if (state.step === 3) {
    state.answers.topping = answer;
    state.step = 4;
    const baseNode = QUIZ_TREE.find(b => b.base === state.answers.base);
    const icingNode = baseNode.icings.find(i => i.name === state.answers.icing);
    const toppingNode = icingNode.toppings.find(t => t.name === answer);

    const cupcakes = toppingNode.cupcakes;
    const results = [];
    for (const cname of cupcakes) {
      const rows = await runQuery(`
        SELECT r.rname, r.location
        FROM retailer r
        JOIN cupcake_available_at ca ON ca.retailerID = r.retailerID
        JOIN cupcake c ON c.cupcakeID = ca.cupcakeID
        WHERE c.cname = ?
      `, [cname]);
      results.push({ cupcake: cname, retailers: rows });
    }

    const classification = classifyProfile(state.answers.base, state.answers.icing, state.answers.topping);

    return res.json({
      sessionID,
      step: 4,
      recommendation: {
        message: `Here are your recommended cupcakes:`,
        cupcakes: results,
        profile: classification
      }
    });
  }
});

/**
 * Recipe Suggestion: match pantry ingredients
 */
app.post('/api/recipes/suggest', async (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Provide an array of ingredients' });
  }

  try {
    const placeholders = ingredients.map(() => '?').join(',');
    const rows = await runQuery(`
      SELECT c.cname, GROUP_CONCAT(DISTINCT i.iname) AS ingredients
      FROM cupcake c
      JOIN cupcake_ingredient ci ON ci.cupcakeID = c.cupcakeID
      JOIN ingredient i ON i.ingredientID = ci.ingredientID
      WHERE i.iname IN (${placeholders})
      GROUP BY c.cupcakeID
      HAVING COUNT(DISTINCT i.iname) = ?
    `, [...ingredients, ingredients.length]);

    res.json({ pantry: ingredients, possibleCupcakes: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

(function () {
  const RECIPE_IMAGE_MAX_PX = 1200;
  const RECIPE_IMAGE_MAX_BYTES = 900000;

  let bindings = null;
  let lastAnalysis = null;

  const els = {};

  function getApiUrl() {
    if (window.location.protocol === "file:") return null;
    return `${window.location.origin}/.netlify/functions/parse-recipe`;
  }

  function normalizeName(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function significantWords(text) {
    const stop = new Set([
      "a", "an", "the", "of", "and", "or", "to", "for", "with", "without", "optional",
      "fresh", "large", "small", "medium", "chopped", "diced", "minced", "sliced",
    ]);
    return normalizeName(text)
      .split(" ")
      .filter((word) => word.length > 2 && !stop.has(word));
  }

  function scoreMatch(ingredient, candidate) {
    const ingredientNorm = normalizeName(ingredient);
    const candidateNorm = normalizeName(candidate);
    if (!ingredientNorm || !candidateNorm) return 0;
    if (candidateNorm === ingredientNorm) return 100;
    if (candidateNorm.includes(ingredientNorm) || ingredientNorm.includes(candidateNorm)) return 80;

    const ingredientWords = significantWords(ingredient);
    const candidateWords = significantWords(candidate);
    if (!ingredientWords.length || !candidateWords.length) return 0;

    let overlap = 0;
    ingredientWords.forEach((word) => {
      if (candidateWords.some((candidateWord) => candidateWord.includes(word) || word.includes(candidateWord))) {
        overlap += 1;
      }
    });

    return (overlap / ingredientWords.length) * 70;
  }

  function findFridgeMatch(ingredient, leftovers) {
    let best = null;
    let bestScore = 0;

    leftovers.forEach((item) => {
      const score = scoreMatch(ingredient, item.description);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });

    settingsPresets().forEach((preset) => {
      const score = scoreMatch(ingredient, preset.description);
      if (score > bestScore) {
        bestScore = score;
        best = { description: preset.description, fromPreset: true };
      }
    });

    return bestScore >= 45 ? best : null;
  }

  function settingsPresets() {
    return bindings?.getSettings?.().presets || [];
  }

  function findShoppingMatch(ingredient, shoppingItems) {
    const unchecked = shoppingItems.filter((item) => !item.checked);
    let best = null;
    let bestScore = 0;

    unchecked.forEach((item) => {
      const score = scoreMatch(ingredient, item.text);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });

    return bestScore >= 45 ? best : null;
  }

  function analyzeIngredients(ingredients) {
    const leftovers = bindings.getLeftovers();
    const shoppingItems = bindings.getShopping();

    return ingredients.map((ingredient) => {
      const fridgeMatch = findFridgeMatch(ingredient, leftovers);
      const shoppingMatch = findShoppingMatch(ingredient, shoppingItems);

      if (fridgeMatch) {
        return {
          ingredient,
          status: "have",
          detail: fridgeMatch.fromPreset
            ? `Shortcut: ${fridgeMatch.description}`
            : `${fridgeMatch.description}${fridgeMatch.quantity > 1 ? ` ×${fridgeMatch.quantity}` : ""} · ${fridgeMatch.location}`,
        };
      }

      if (shoppingMatch) {
        return {
          ingredient,
          status: "shopping",
          detail: `Already on list: ${shoppingMatch.text}`,
        };
      }

      return {
        ingredient,
        status: "need",
        detail: "Not in fridge or shopping list",
      };
    });
  }

  async function compressRecipeImage(file) {
    const bitmap = typeof createImageBitmap === "function"
      ? await createImageBitmap(file)
      : await loadImageFromFile(file);

    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    const scale = Math.min(1, RECIPE_IMAGE_MAX_PX / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (bitmap.close) {
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
    } else {
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }

    let quality = 0.82;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > RECIPE_IMAGE_MAX_BYTES && quality > 0.45) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > RECIPE_IMAGE_MAX_BYTES) {
      throw new Error("Recipe photo is too large. Try a closer crop.");
    }

    return dataUrl;
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that image."));
      };
      image.src = url;
    });
  }

  function parseBasicIngredients(text) {
    const skipSection = /^(method|instructions|directions|steps|notes|nutrition|serves|servings|prep|cook|total|equipment)/i;
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const ingredients = [];
    let inIngredients = false;

    for (const line of lines) {
      if (/^ingredients\b/i.test(line)) {
        inIngredients = true;
        continue;
      }
      if (/^(method|instructions|directions|steps)\b/i.test(line)) {
        inIngredients = false;
        continue;
      }

      if (skipSection.test(line)) continue;

      let cleaned = line
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .replace(/^[\d\s/]+(?:cup|cups|tbsp|tsp|oz|g|kg|ml|l|lb|lbs|clove|cloves|pinch|can|cans|packet|packets|bunch|slice|slices)s?\b\s*/i, "")
        .replace(/\s*[-–—]\s*.*$/, "")
        .trim();

      if (!cleaned || cleaned.length < 2) continue;
      if (/^(and|or|to serve|optional)$/i.test(cleaned)) continue;

      ingredients.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
    }

    if (!ingredients.length) {
      return lines
        .filter((line) => !skipSection.test(line))
        .slice(0, 40)
        .map((line) => line.replace(/^[-*•\d.)]+\s*/, "").trim())
        .filter((line) => line.length > 1);
    }

    return [...new Set(ingredients)];
  }

  function localTextParse(text) {
    const ingredients = parseBasicIngredients(text);
    if (!ingredients.length) {
      throw new Error("Could not find ingredients in that text.");
    }
    return { title: "", ingredients, parser: "basic" };
  }

  async function parseRecipeInput() {
    const text = els.textInput?.value.trim() || "";
    const url = els.urlInput?.value.trim() || "";
    const file = els.imageInput?.files?.[0];

    if (!text && !url && !file) {
      throw new Error("Paste a recipe, enter a URL, or choose a photo.");
    }

    if (text && !url && !file) {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return localTextParse(text);
      }

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok) return data;
        if (!response.ok && data.error) throw new Error(data.error);
      } catch (error) {
        if (error.message && !/fetch|network|failed/i.test(error.message)) {
          throw error;
        }
      }

      return localTextParse(text);
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      throw new Error("URL and photo parsing need the Netlify-deployed app with AI enabled.");
    }

    const payload = {};
    if (text) payload.text = text;
    if (url) payload.url = url;
    if (file) payload.imageBase64 = await compressRecipeImage(file);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Could not parse recipe.");
    }

    return data;
  }

  function setStatus(message, isError = false) {
    if (!els.statusEl) return;
    els.statusEl.textContent = message;
    els.statusEl.classList.toggle("recipe-status--error", isError);
  }

  function renderResults() {
    if (!lastAnalysis || !els.resultsEl) return;

    const { title, ingredients, rows, parser } = lastAnalysis;
    const needCount = rows.filter((row) => row.status === "need").length;

    els.resultsEl.innerHTML = `
      <div class="recipe-results__header">
        <h2 class="recipe-results__title">${bindings.escapeHtml(title || "Recipe ingredients")}</h2>
        <p class="recipe-results__meta">${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"} · parsed with ${parser === "openai" ? "AI" : parser === "basic" ? "basic parser" : "AI"}</p>
      </div>
      <ul class="recipe-results-list">
        ${rows
          .map(
            (row) => `
              <li class="recipe-result recipe-result--${row.status}">
                <span class="recipe-result__badge" aria-hidden="true">${row.status === "have" ? "✓" : row.status === "shopping" ? "🛒" : "+"}</span>
                <div class="recipe-result__body">
                  <span class="recipe-result__name">${bindings.escapeHtml(row.ingredient)}</span>
                  <span class="recipe-result__detail">${bindings.escapeHtml(row.detail)}</span>
                </div>
              </li>
            `
          )
          .join("")}
      </ul>
      <div class="recipe-results__actions">
        <button type="button" id="recipe-add-shopping" class="btn btn--primary"${needCount ? "" : " disabled"}>
          ${needCount ? `Add ${needCount} item${needCount === 1 ? "" : "s"} to shopping list` : "Nothing to add"}
        </button>
      </div>
    `;

    els.resultsEl.classList.remove("hidden");
    document.getElementById("recipe-add-shopping")?.addEventListener("click", addMissingToShoppingList);
  }

  function addMissingToShoppingList() {
    if (!lastAnalysis) return;

    const missing = lastAnalysis.rows.filter((row) => row.status === "need");
    if (!missing.length) return;

    missing.forEach((row) => bindings.addToShoppingList(row.ingredient));
    bindings.onShoppingUpdated?.();

    lastAnalysis.rows = lastAnalysis.rows.map((row) =>
      row.status === "need"
        ? { ...row, status: "shopping", detail: `Added to shopping list: ${row.ingredient}` }
        : row
    );

    setStatus(`Added ${missing.length} item${missing.length === 1 ? "" : "s"} to your shopping list.`);
    renderResults();
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    setStatus("Checking recipe…");
    els.analyzeBtn.disabled = true;

    try {
      const parsed = await parseRecipeInput();
      const rows = analyzeIngredients(parsed.ingredients);
      lastAnalysis = {
        title: parsed.title,
        ingredients: parsed.ingredients,
        rows,
        parser: parsed.parser,
      };
      renderResults();
      setStatus("Done. Review what you have and what to buy.");
    } catch (error) {
      setStatus(error.message || "Could not check recipe.", true);
    } finally {
      els.analyzeBtn.disabled = false;
    }
  }

  function cacheElements() {
    els.form = document.getElementById("recipe-form");
    els.textInput = document.getElementById("recipe-text");
    els.urlInput = document.getElementById("recipe-url");
    els.imageInput = document.getElementById("recipe-image");
    els.analyzeBtn = document.getElementById("recipe-analyze");
    els.statusEl = document.getElementById("recipe-status");
    els.resultsEl = document.getElementById("recipe-results");
  }

  function bindUI(appBindings) {
    bindings = appBindings;
    cacheElements();
    if (!els.form) return;

    els.form.addEventListener("submit", handleAnalyze);
  }

  function resetPage() {
    lastAnalysis = null;
    els.resultsEl?.classList.add("hidden");
    if (els.resultsEl) els.resultsEl.innerHTML = "";
    setStatus("");
  }

  window.LeftoversRecipe = {
    bindUI,
    resetPage,
  };
})();

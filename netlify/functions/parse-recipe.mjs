function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
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

export default async (request) => {
  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return jsonResponse({ ok: false, error: "Provide recipe text to paste." }, 400);
  }

  try {
    const ingredients = parseBasicIngredients(text);
    if (!ingredients.length) {
      return jsonResponse({ ok: false, error: "Could not find ingredients in that text." }, 422);
    }

    return jsonResponse({
      ok: true,
      title: "",
      ingredients,
      parser: "basic",
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Could not parse recipe." }, 500);
  }
};

const INGREDIENT_JSON_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "recipe_ingredients",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        ingredients: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["title", "ingredients"],
    },
  },
};

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

async function fetchUrlText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "LeftoversRecipeBot/1.0" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error("Could not fetch that recipe URL.");
  }

  const html = await response.text();
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = withoutStyles
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!text) throw new Error("No readable text found at that URL.");
  return text.slice(0, 12000);
}

async function callOpenAI({ apiKey, messages, useJsonSchema = true }) {
  const body = {
    model: messages.some((message) => Array.isArray(message.content)) ? "gpt-4o" : "gpt-4o-mini",
    messages,
    temperature: 0.2,
  };

  if (useJsonSchema) {
    body.response_format = INGREDIENT_JSON_SCHEMA;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "Recipe parsing failed.");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Recipe parsing returned no result.");

  if (useJsonSchema) {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || "",
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.filter(Boolean) : [],
      parser: "openai",
    };
  }

  return { title: "", ingredients: parseBasicIngredients(content), parser: "openai-text" };
}

async function parseWithOpenAI({ text, url, imageBase64, apiKey }) {
  let sourceText = text || "";

  if (url) {
    sourceText = await fetchUrlText(url);
  }

  if (imageBase64) {
    return callOpenAI({
      apiKey,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract recipe title and a list of ingredient names from this recipe image. Use simple shopping-friendly names (e.g. 'Milk', 'Chicken breast'). Ignore quantities in the ingredient names.",
            },
            {
              type: "image_url",
              image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
    });
  }

  return callOpenAI({
    apiKey,
    messages: [
      {
        role: "user",
        content: `Extract the recipe title and a list of ingredient names from this recipe text. Use simple shopping-friendly names (e.g. "Milk", "Chicken breast"). Ignore amounts and preparation notes in the ingredient names.\n\n${sourceText}`,
      },
    ],
  });
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
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";

  if (!text && !url && !imageBase64) {
    return jsonResponse({ ok: false, error: "Provide recipe text, a URL, or an image." }, 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    if (apiKey) {
      const parsed = await parseWithOpenAI({ text, url, imageBase64, apiKey });
      return jsonResponse({
        ok: true,
        title: parsed.title,
        ingredients: parsed.ingredients,
        parser: parsed.parser,
      });
    }

    if (url || imageBase64) {
      return jsonResponse({
        ok: false,
        error: "URL and photo parsing need OPENAI_API_KEY in Netlify. Paste the recipe text for now.",
      }, 503);
    }

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

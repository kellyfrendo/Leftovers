import {
  fetchKitchenByDeviceId,
  fetchKitchenByKitchenKey,
  upsertKitchenSync,
} from "./_lib/kitchen.mjs";

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

function normalizeKitchenKey(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid request body.";
  if (!body.kitchen_key || normalizeKitchenKey(body.kitchen_key).length !== 8) {
    return "Missing or invalid kitchen_key.";
  }
  if (!body.device_id || typeof body.device_id !== "string") return "Missing device_id.";
  if (typeof body.email !== "string") return "Missing email.";
  if (typeof body.notifications_enabled !== "boolean") return "Missing notifications_enabled.";
  if (!Number.isInteger(body.notify_days_before)) return "Missing notify_days_before.";
  if (!Array.isArray(body.leftovers)) return "Missing leftovers.";
  if (!Array.isArray(body.shopping)) return "Missing shopping.";
  if (!body.settings || typeof body.settings !== "object") return "Missing settings.";
  if (!Array.isArray(body.settings.categories) || !body.settings.categories.length) {
    return "Missing settings categories.";
  }
  if (!Array.isArray(body.settings.containers) || !body.settings.containers.length) {
    return "Missing settings containers.";
  }
  if (!Array.isArray(body.settings.locations) || !body.settings.locations.length) {
    return "Missing settings locations.";
  }
  if (!Array.isArray(body.settings.presets)) body.settings.presets = [];
  return null;
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { ok: false, error: "Server sync is not configured yet. Add Supabase env vars in Netlify." },
      503
    );
  }

  const env = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };

  if (request.method === "GET") {
    const params = new URL(request.url).searchParams;
    const kitchenKey = normalizeKitchenKey(params.get("kitchen_key"));
    const deviceId = params.get("device_id");

    try {
      let kitchen = null;
      if (kitchenKey.length === 8) {
        kitchen = await fetchKitchenByKitchenKey(env, kitchenKey);
      }
      if (!kitchen && deviceId) {
        kitchen = await fetchKitchenByDeviceId(env, deviceId);
      }
      return jsonResponse({ ok: true, kitchen });
    } catch (error) {
      return jsonResponse({ ok: false, error: error.message || "Load failed." }, 500);
    }
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Could not parse JSON." }, 400);
  }

  const validationError = validatePayload(body);
  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400);
  }

  const email = body.email.trim();
  if (body.notifications_enabled && !email) {
    return jsonResponse({ ok: false, error: "Email is required when notifications are enabled." }, 400);
  }

  const kitchenKey = normalizeKitchenKey(body.kitchen_key);
  const categories = body.settings.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
  }));

  try {
    await upsertKitchenSync(env, {
      kitchen_key: kitchenKey,
      device_id: body.device_id,
      email,
      notify_days_before: body.notify_days_before,
      notifications_enabled: body.notifications_enabled,
      leftovers: body.leftovers,
      shopping: body.shopping,
      settings: body.settings,
      categories,
      updated_at: new Date().toISOString(),
    });

    return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Sync failed." }, 500);
  }
};

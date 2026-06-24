import {
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

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid request body.";
  if (!body.device_id || typeof body.device_id !== "string") return "Missing device_id.";
  if (typeof body.email !== "string") return "Missing email.";
  if (typeof body.notifications_enabled !== "boolean") return "Missing notifications_enabled.";
  if (!Number.isInteger(body.notify_days_before)) return "Missing notify_days_before.";
  if (!Array.isArray(body.leftovers)) return "Missing leftovers.";
  if (!Array.isArray(body.categories)) return "Missing categories.";
  return null;
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { ok: false, error: "Server sync is not configured yet. Add Supabase env vars in Netlify." },
      503
    );
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

  try {
    await upsertKitchenSync(
      { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      {
        device_id: body.device_id,
        email,
        notify_days_before: body.notify_days_before,
        notifications_enabled: body.notifications_enabled,
        leftovers: body.leftovers,
        categories: body.categories,
        updated_at: new Date().toISOString(),
      }
    );

    return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Sync failed." }, 500);
  }
};

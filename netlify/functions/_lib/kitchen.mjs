export function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(dateStr, today = todayString()) {
  const target = parseDate(dateStr);
  const todayDate = parseDate(today);
  return Math.round((target - todayDate) / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getCategoryLabel(categories, categoryId) {
  const match = categories.find((cat) => cat.id === categoryId);
  return match?.label || categoryId || "Unknown";
}

export function buildAlerts(leftovers, categories, notifyDaysBefore, today = todayString()) {
  const overdue = [];
  const dueSoon = [];

  for (const item of leftovers) {
    if (!item?.eatBy) continue;

    const remaining = daysUntil(item.eatBy, today);
    const qty = item.quantity || 1;
    const summary = {
      description: item.description || "Item",
      quantity: qty,
      eatBy: item.eatBy,
      eatByLabel: formatDisplayDate(item.eatBy),
      category: getCategoryLabel(categories, item.category),
      location: item.location || "",
    };

    if (remaining < 0) {
      overdue.push(summary);
    } else if (remaining <= notifyDaysBefore) {
      dueSoon.push({ ...summary, daysLeft: remaining });
    }
  }

  overdue.sort((a, b) => a.eatBy.localeCompare(b.eatBy));
  dueSoon.sort((a, b) => a.eatBy.localeCompare(b.eatBy) || a.description.localeCompare(b.description));

  return { overdue, dueSoon };
}

export function buildEmailHtml({ overdue, dueSoon, notifyDaysBefore }) {
  const section = (title, items, renderLine) => {
    if (!items.length) return "";
    const rows = items.map((item) => `<li>${renderLine(item)}</li>`).join("");
    return `<h2 style="font-size:18px;margin:24px 0 8px;">${title}</h2><ul>${rows}</ul>`;
  };

  const overdueSection = section("Overdue", overdue, (item) => {
    const qty = item.quantity > 1 ? ` ×${item.quantity}` : "";
    const location = item.location ? ` · ${item.location}` : "";
    return `<strong>${item.description}${qty}</strong> (${item.category}) — eat by ${item.eatByLabel}${location}`;
  });

  const soonSection = section(
    `Due within ${notifyDaysBefore} day${notifyDaysBefore === 1 ? "" : "s"}`,
    dueSoon,
    (item) => {
      const qty = item.quantity > 1 ? ` ×${item.quantity}` : "";
      const location = item.location ? ` · ${item.location}` : "";
      const when =
        item.daysLeft === 0 ? "Eat today" : item.daysLeft === 1 ? "1 day left" : `${item.daysLeft} days left`;
      return `<strong>${item.description}${qty}</strong> (${item.category}) — ${when}, eat by ${item.eatByLabel}${location}`;
    }
  );

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1a2332;line-height:1.5;">
      <p>Here is your daily Leftovers fridge check.</p>
      ${overdueSection}
      ${soonSection}
      <p style="margin-top:24px;color:#5c6b7a;font-size:14px;">Sent by your Leftovers app.</p>
    </div>
  `;
}

export async function supabaseRequest(env, path, options = {}) {
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function upsertKitchenSync(env, row) {
  return supabaseRequest(env, "kitchen_sync?on_conflict=device_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
}

export async function fetchEnabledKitchens(env) {
  return supabaseRequest(
    env,
    "kitchen_sync?notifications_enabled=eq.true&email=not.is.null&select=device_id,email,notify_days_before,leftovers,categories,last_notified_date"
  );
}

export async function markNotifiedToday(env, deviceId, today) {
  return supabaseRequest(env, `kitchen_sync?device_id=eq.${deviceId}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ last_notified_date: today }),
  });
}

export async function sendResendEmail(env, { to, subject, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed (${response.status}): ${text}`);
  }
}

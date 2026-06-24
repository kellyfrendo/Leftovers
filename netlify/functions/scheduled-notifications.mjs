import {
  buildAlerts,
  buildEmailHtml,
  fetchEnabledKitchens,
  markNotifiedToday,
  sendResendEmail,
  todayString,
} from "./_lib/kitchen.mjs";

export default async () => {
  const env = process.env;
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Missing env vars: ${missing.join(", ")}`,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const today = todayString();
  const kitchens = await fetchEnabledKitchens(env);
  const results = [];

  for (const kitchen of kitchens) {
    if (!kitchen.email?.trim()) {
      results.push({ deviceId: kitchen.device_id, status: "skipped", reason: "missing email" });
      continue;
    }

    if (kitchen.last_notified_date === today) {
      results.push({ deviceId: kitchen.device_id, status: "skipped", reason: "already notified today" });
      continue;
    }

    const alerts = buildAlerts(
      kitchen.leftovers || [],
      kitchen.categories || [],
      kitchen.notify_days_before ?? 3,
      today
    );

    if (!alerts.overdue.length && !alerts.dueSoon.length) {
      results.push({ deviceId: kitchen.device_id, status: "skipped", reason: "nothing due" });
      continue;
    }

    const total = alerts.overdue.length + alerts.dueSoon.length;
    const subject =
      total === 1
        ? "Leftovers: 1 item needs attention"
        : `Leftovers: ${total} items need attention`;

    try {
      await sendResendEmail(env, {
        to: kitchen.email.trim(),
        subject,
        html: buildEmailHtml({
          overdue: alerts.overdue,
          dueSoon: alerts.dueSoon,
          notifyDaysBefore: kitchen.notify_days_before ?? 3,
        }),
      });

      await markNotifiedToday(env, kitchen.device_id, today);
      results.push({ deviceId: kitchen.device_id, status: "sent", total });
    } catch (error) {
      results.push({
        deviceId: kitchen.device_id,
        status: "error",
        error: error.message || "send failed",
      });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      date: today,
      checked: kitchens.length,
      results,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const config = {
  schedule: "0 8 * * *",
};

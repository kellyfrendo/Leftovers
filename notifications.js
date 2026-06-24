const NOTIFICATIONS_STORAGE_KEY = "leftovers-notifications";
const DEVICE_ID_KEY = "leftovers-device-id";

const DEFAULT_NOTIFICATIONS = {
  enabled: false,
  email: "",
  daysBefore: 3,
  lastSyncedAt: null,
  lastSyncError: null,
};

let syncTimer = null;

function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function loadNotificationSettings() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_NOTIFICATIONS);
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      email: typeof parsed.email === "string" ? parsed.email : "",
      daysBefore: Number.isInteger(parsed.daysBefore) ? parsed.daysBefore : 3,
      lastSyncedAt: parsed.lastSyncedAt || null,
      lastSyncError: parsed.lastSyncError || null,
    };
  } catch {
    return structuredClone(DEFAULT_NOTIFICATIONS);
  }
}

function saveNotificationSettings(next) {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
}

function getSyncUrl() {
  if (window.location.protocol === "file:") return null;
  return `${window.location.origin}/.netlify/functions/sync-kitchen`;
}

function formatSyncTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setNotificationsStatus(message, isError = false) {
  const statusEl = document.getElementById("notifications-status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? "var(--overdue)" : "var(--text-muted)";
}

function populateNotificationsForm() {
  const settings = loadNotificationSettings();
  const enabledInput = document.getElementById("notifications-enabled");
  const emailInput = document.getElementById("notifications-email");
  const daysInput = document.getElementById("notifications-days");
  if (!enabledInput || !emailInput || !daysInput) return;

  enabledInput.checked = settings.enabled;
  emailInput.value = settings.email;
  daysInput.value = String(settings.daysBefore);

  if (settings.lastSyncError) {
    setNotificationsStatus(`Last sync failed: ${settings.lastSyncError}`, true);
  } else if (settings.lastSyncedAt) {
    setNotificationsStatus(`Last synced ${formatSyncTime(settings.lastSyncedAt)}.`);
  } else if (!getSyncUrl()) {
    setNotificationsStatus("Sync works after the app is deployed to Netlify.");
  } else {
    setNotificationsStatus("Not synced yet.");
  }
}

async function syncNotificationsToCloud({ force = false } = {}) {
  const current = loadNotificationSettings();
  const syncUrl = getSyncUrl();

  if (!syncUrl) {
    const next = { ...current, lastSyncError: "Sync is only available on Netlify." };
    saveNotificationSettings(next);
    setNotificationsStatus(next.lastSyncError, true);
    return { ok: false, error: next.lastSyncError };
  }

  if (!current.enabled && !force) {
    return { ok: true, skipped: true };
  }

  if (current.enabled && !current.email.trim()) {
    const error = "Add an email address to enable notifications.";
    const next = { ...current, lastSyncError: error };
    saveNotificationSettings(next);
    setNotificationsStatus(error, true);
    return { ok: false, error };
  }

  const payload = {
    device_id: getDeviceId(),
    email: current.email.trim(),
    notifications_enabled: current.enabled,
    notify_days_before: current.daysBefore,
    leftovers: window.LeftoversApp.getLeftovers(),
    categories: window.LeftoversApp.getCategories(),
  };

  try {
    const response = await fetch(syncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Sync failed.");
    }

    const next = {
      ...current,
      lastSyncedAt: data.syncedAt || new Date().toISOString(),
      lastSyncError: null,
    };
    saveNotificationSettings(next);
    setNotificationsStatus(`Last synced ${formatSyncTime(next.lastSyncedAt)}.`);
    return { ok: true };
  } catch (error) {
    const next = {
      ...current,
      lastSyncError: error.message || "Sync failed.",
    };
    saveNotificationSettings(next);
    setNotificationsStatus(`Last sync failed: ${next.lastSyncError}`, true);
    return { ok: false, error: next.lastSyncError };
  }
}

function queueNotificationSync() {
  const current = loadNotificationSettings();
  if (!current.enabled) return;

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncNotificationsToCloud();
  }, 800);
}

function handleNotificationsSave(event) {
  event.preventDefault();
  const form = event.target;
  const enabled = form.enabled.checked;
  const email = form.email.value.trim();
  const daysBefore = Number(form.daysBefore.value);

  if (enabled && !email) {
    setNotificationsStatus("Add an email address to turn on notifications.", true);
    return;
  }

  if (!Number.isInteger(daysBefore) || daysBefore < 0 || daysBefore > 30) {
    setNotificationsStatus("Choose a warning period between 0 and 30 days.", true);
    return;
  }

  const previous = loadNotificationSettings();
  const next = {
    ...previous,
    enabled,
    email,
    daysBefore,
  };
  saveNotificationSettings(next);
  syncNotificationsToCloud({ force: true });
}

function bindNotificationsUI() {
  const form = document.getElementById("notifications-form");
  const syncBtn = document.getElementById("notifications-sync-now");
  if (form) form.addEventListener("submit", handleNotificationsSave);
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      syncNotificationsToCloud({ force: true });
    });
  }
}

window.LeftoversNotifications = {
  bindNotificationsUI,
  populateNotificationsForm,
  queueNotificationSync,
  syncNotificationsToCloud,
  loadNotificationSettings,
};

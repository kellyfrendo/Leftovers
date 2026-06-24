const DEFAULT_NOTIFICATIONS = {
  enabled: false,
  email: "",
  daysBefore: 3,
};

let notificationSettings = structuredClone(DEFAULT_NOTIFICATIONS);

function getSettings() {
  return { ...notificationSettings };
}

function applyFromCloud({ enabled, email, daysBefore }) {
  notificationSettings = {
    enabled: Boolean(enabled),
    email: typeof email === "string" ? email : "",
    daysBefore: Number.isInteger(daysBefore) ? daysBefore : 3,
  };
}

function applyLegacyLocal(notifications) {
  if (!notifications || typeof notifications !== "object") return;

  notificationSettings = {
    enabled: Boolean(notifications.enabled),
    email: typeof notifications.email === "string" ? notifications.email : "",
    daysBefore: Number.isInteger(notifications.daysBefore) ? notifications.daysBefore : 3,
  };
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

function refreshNotificationsStatus() {
  const syncStatus = window.LeftoversCloud?.getSyncStatus() || {};

  if (syncStatus.lastSyncError) {
    setNotificationsStatus(`Last save failed: ${syncStatus.lastSyncError}`, true);
  } else if (syncStatus.saving) {
    setNotificationsStatus("Saving to cloud…");
  } else if (syncStatus.lastSyncedAt) {
    setNotificationsStatus(`Last saved ${formatSyncTime(syncStatus.lastSyncedAt)}.`);
  } else if (!window.LeftoversCloud?.isAvailable()) {
    setNotificationsStatus("Open the Netlify-deployed app to use cloud storage.", true);
  } else {
    setNotificationsStatus("Your kitchen is stored in the cloud.");
  }
}

function populateNotificationsForm() {
  const enabledInput = document.getElementById("notifications-enabled");
  const emailInput = document.getElementById("notifications-email");
  const daysInput = document.getElementById("notifications-days");
  if (!enabledInput || !emailInput || !daysInput) return;

  enabledInput.checked = notificationSettings.enabled;
  emailInput.value = notificationSettings.email;
  daysInput.value = String(notificationSettings.daysBefore);
  refreshNotificationsStatus();
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

  notificationSettings = {
    enabled,
    email,
    daysBefore,
  };

  window.LeftoversCloud?.saveNow().then(
    () => refreshNotificationsStatus(),
    () => refreshNotificationsStatus()
  );
}

function bindNotificationsUI() {
  const form = document.getElementById("notifications-form");
  const syncBtn = document.getElementById("notifications-sync-now");
  if (form) form.addEventListener("submit", handleNotificationsSave);
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      window.LeftoversCloud?.saveNow().then(
        () => refreshNotificationsStatus(),
        () => refreshNotificationsStatus()
      );
    });
  }

  window.LeftoversCloud?.onStatusChange(() => {
    refreshNotificationsStatus();
  });
}

window.LeftoversNotifications = {
  bindNotificationsUI,
  populateNotificationsForm,
  getSettings,
  applyFromCloud,
  applyLegacyLocal,
};

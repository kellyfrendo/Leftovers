const DEVICE_ID_KEY = "leftovers-device-id";

const LEGACY_STORAGE_KEYS = [
  "leftovers-fridge",
  "leftovers-shopping",
  "leftovers-settings",
  "leftovers-notifications",
  "leftovers-category-schema",
  "leftovers-category-days-schema",
  "leftovers-category-builtin-schema",
  "leftovers-container-schema",
  "leftovers-location-schema",
  "leftovers-location-builtin-schema",
];

let getState = null;
let saveTimer = null;
const statusListeners = new Set();

let syncStatus = {
  lastSyncedAt: null,
  lastSyncError: null,
  saving: false,
};

function getApiUrl() {
  if (window.location.protocol === "file:") return null;
  return `${window.location.origin}/.netlify/functions/sync-kitchen`;
}

function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function notifyStatusListeners() {
  const snapshot = { ...syncStatus };
  statusListeners.forEach((listener) => listener(snapshot));
}

function readLegacyLocalData() {
  const settingsRaw = localStorage.getItem("leftovers-settings");
  const leftoversRaw = localStorage.getItem("leftovers-fridge");
  const shoppingRaw = localStorage.getItem("leftovers-shopping");
  const notificationsRaw = localStorage.getItem("leftovers-notifications");

  if (!settingsRaw && !leftoversRaw && !shoppingRaw && !notificationsRaw) {
    return null;
  }

  let settings = null;
  let leftovers = [];
  let shopping = [];
  let notifications = null;

  try {
    if (settingsRaw) settings = JSON.parse(settingsRaw);
  } catch {
    settings = null;
  }

  try {
    if (leftoversRaw) leftovers = JSON.parse(leftoversRaw);
  } catch {
    leftovers = [];
  }

  try {
    if (shoppingRaw) shopping = JSON.parse(shoppingRaw);
  } catch {
    shopping = [];
  }

  try {
    if (notificationsRaw) notifications = JSON.parse(notificationsRaw);
  } catch {
    notifications = null;
  }

  return { settings, leftovers, shopping, notifications };
}

function clearLegacyLocalData() {
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

async function loadKitchen() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error("Cloud storage requires the Netlify-deployed app.");
  }

  const response = await fetch(`${apiUrl}?device_id=${encodeURIComponent(getDeviceId())}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Could not load your kitchen from the cloud.");
  }

  return {
    kitchen: data.kitchen || null,
    legacy: data.kitchen ? null : readLegacyLocalData(),
  };
}

async function saveKitchen(payload) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error("Cloud storage requires the Netlify-deployed app.");
  }

  syncStatus.saving = true;
  notifyStatusListeners();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: getDeviceId(),
        ...payload,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Could not save to the cloud.");
    }

    syncStatus.lastSyncedAt = data.syncedAt || new Date().toISOString();
    syncStatus.lastSyncError = null;
    return { ok: true, syncedAt: syncStatus.lastSyncedAt };
  } catch (error) {
    syncStatus.lastSyncError = error.message || "Save failed.";
    throw error;
  } finally {
    syncStatus.saving = false;
    notifyStatusListeners();
  }
}

function registerStateProvider(provider) {
  getState = provider;
}

function queueSave() {
  if (!getState) return;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveKitchen(getState());
    } catch {
      // Status already updated in saveKitchen.
    }
  }, 800);
}

async function saveNow() {
  if (!getState) {
    throw new Error("App is not ready to save yet.");
  }
  clearTimeout(saveTimer);
  return saveKitchen(getState());
}

function onStatusChange(listener) {
  statusListeners.add(listener);
  listener({ ...syncStatus });
  return () => statusListeners.delete(listener);
}

function getSyncStatus() {
  return { ...syncStatus };
}

window.LeftoversCloud = {
  isAvailable: () => Boolean(getApiUrl()),
  getDeviceId,
  registerStateProvider,
  loadKitchen,
  saveNow,
  queueSave,
  onStatusChange,
  getSyncStatus,
  clearLegacyLocalData,
};

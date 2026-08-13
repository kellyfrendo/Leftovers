const KITCHEN_KEY_STORAGE = "leftovers-kitchen-key";
const DEVICE_ID_KEY = "leftovers-device-id";
const LOCAL_DEV_STORAGE_KEY = "leftovers-local-dev-kitchen";

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

const KITCHEN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

function isLocalDevHost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function readLocalDevKitchen() {
  try {
    const raw = localStorage.getItem(LOCAL_DEV_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalDevKitchen(payload) {
  localStorage.setItem(LOCAL_DEV_STORAGE_KEY, JSON.stringify(payload));
}

function buildLocalDevKitchen(payload) {
  return {
    kitchen_key: getKitchenKey(),
    settings: payload.settings,
    leftovers: payload.leftovers,
    shopping: payload.shopping,
    email: payload.email,
    notifications_enabled: payload.notifications_enabled,
    notify_days_before: payload.notify_days_before,
  };
}

function normalizeKitchenKey(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function formatKitchenKey(raw) {
  const key = normalizeKitchenKey(raw);
  if (key.length !== 8) return key;
  return `${key.slice(0, 4)}-${key.slice(4)}`;
}

function isLegacyKitchenKey(key) {
  const normalized = normalizeKitchenKey(key);
  return normalized.length !== 8;
}

function generateKitchenKey() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += KITCHEN_CODE_CHARS[Math.floor(Math.random() * KITCHEN_CODE_CHARS.length)];
  }
  return code;
}

function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getKitchenKey() {
  let key = localStorage.getItem(KITCHEN_KEY_STORAGE);
  if (!key) {
    key = generateKitchenKey();
    localStorage.setItem(KITCHEN_KEY_STORAGE, key);
  }
  return normalizeKitchenKey(key);
}

function setKitchenKey(key) {
  const normalized = normalizeKitchenKey(key);
  if (normalized.length !== 8) {
    throw new Error("Enter a valid 8-character kitchen code.");
  }
  localStorage.setItem(KITCHEN_KEY_STORAGE, normalized);
  return normalized;
}

function notifyStatusListeners() {
  statusListeners.forEach((listener) => listener({ ...syncStatus }));
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

async function fetchKitchenFromApi(params) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error("Cloud storage requires the Netlify-deployed app.");
  }

  if (isLocalDevHost()) {
    try {
      const query = new URLSearchParams(params);
      const response = await fetch(`${apiUrl}?${query.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        return data.kitchen || null;
      }
    } catch {
      // Fall back to browser storage for local desktop testing.
    }

    const stored = readLocalDevKitchen();
    return stored ? buildLocalDevKitchen(stored) : null;
  }

  const query = new URLSearchParams(params);
  const response = await fetch(`${apiUrl}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Could not load your kitchen from the cloud.");
  }

  return data.kitchen || null;
}

async function loadKitchen() {
  const kitchenKey = getKitchenKey();
  let kitchen = await fetchKitchenFromApi({ kitchen_key: kitchenKey });

  if (!kitchen) {
    kitchen = await fetchKitchenFromApi({ device_id: getDeviceId() });
  }

  return {
    kitchen,
    legacy: kitchen ? null : readLegacyLocalData(),
    kitchenKey,
    needsReadableKitchenKey: Boolean(kitchen && isLegacyKitchenKey(kitchen.kitchen_key || kitchenKey)),
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
    if (!isLocalDevHost()) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitchen_key: getKitchenKey(),
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
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitchen_key: getKitchenKey(),
          device_id: getDeviceId(),
          ...payload,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        syncStatus.lastSyncedAt = data.syncedAt || new Date().toISOString();
        syncStatus.lastSyncError = null;
        return { ok: true, syncedAt: syncStatus.lastSyncedAt };
      }
    } catch {
      // Fall back to browser storage for local desktop testing.
    }

    writeLocalDevKitchen(payload);
    syncStatus.lastSyncedAt = new Date().toISOString();
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

async function joinKitchen(rawKey) {
  const kitchenKey = setKitchenKey(rawKey);
  const kitchen = await fetchKitchenFromApi({ kitchen_key: kitchenKey });
  if (!kitchen) {
    throw new Error("No kitchen found with that code. Check the code and try again.");
  }
  return kitchen;
}

async function copyKitchenCode() {
  const code = formatKitchenKey(getKitchenKey());
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(code);
    return code;
  }

  window.prompt("Copy your kitchen code:", code);
  return code;
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
  getKitchenKey,
  formatKitchenKey,
  setKitchenKey,
  generateKitchenKey,
  registerStateProvider,
  loadKitchen,
  joinKitchen,
  copyKitchenCode,
  saveNow,
  queueSave,
  onStatusChange,
  getSyncStatus,
  clearLegacyLocalData,
};

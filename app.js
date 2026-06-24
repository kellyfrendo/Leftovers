const BACKUP_VERSION = 1;
const MAX_ITEM_QUANTITY = 30;

const DEFAULT_SETTINGS = {
  categories: [
    { id: "fruit", label: "Fruit", days: 5 },
    { id: "vegetables", label: "Vegetables", days: 5 },
    { id: "meat-chicken", label: "Meat and chicken", days: 5 },
    { id: "fish-seafood", label: "Fish and seafood", days: 5 },
    { id: "dairy", label: "Dairy", days: 14 },
    { id: "condiments", label: "Condiments", days: 30 },
    { id: "cooked-stuff", label: "Cooked stuff", days: 7 },
    { id: "drinks", label: "Drinks", days: 60 },
    { id: "frozen-item", label: "Frozen item", days: 90 },
    { id: "other", label: "Other", days: 7 },
  ],
  containers: [
    { id: "glass-jar", label: "Glass jar" },
    { id: "square-tub-small", label: "Square tub (small)" },
    { id: "square-tub-medium", label: "Square tub (medium)" },
    { id: "rectangle-tub-small", label: "Rectangle tub (small)" },
    { id: "rectangle-tub-medium", label: "Rectangle tub (medium)" },
    { id: "round-tub-small", label: "Round tub (small)" },
    { id: "round-tub-medium", label: "Round tub (medium)" },
    { id: "original-packaging", label: "Original packaging" },
    { id: "foil-tray", label: "Foil tray" },
    { id: "other", label: "Other" },
  ],
  locations: [
    { id: "top-shelf", label: "Top shelf" },
    { id: "middle-shelf", label: "Middle shelf" },
    { id: "bottom-shelf", label: "Bottom shelf" },
    { id: "top-drawer", label: "Top drawer" },
    { id: "left-drawer", label: "Left drawer" },
    { id: "right-drawer", label: "Right drawer" },
    { id: "door", label: "Door" },
    { id: "freezer", label: "Freezer" },
  ],
  presets: [],
};

const LEFTOVERS_PAGE_CATEGORY_IDS = new Set(["cooked-stuff"]);

const CATEGORY_ICONS = {
  fruit: "🍎",
  vegetables: "🥬",
  "meat-chicken": "🍗",
  "fish-seafood": "🐟",
  dairy: "🧀",
  condiments: "🫙",
  "cooked-stuff": "🍲",
  drinks: "🥤",
  "frozen-item": "❄️",
  other: "📦",
};

const LEFTOVERS_ADD_DEFAULTS = {
  categoryId: "cooked-stuff",
  location: "Middle shelf",
};

const CATEGORY_ADD_DEFAULTS = {
  drinks: {
    container: "Original packaging",
    location: "Top shelf",
  },
  "frozen-item": {
    container: "Original packaging",
    location: "Freezer",
  },
  "cooked-stuff": {
    location: "Middle shelf",
  },
  condiments: {
    container: "Original packaging",
    location: "Door",
  },
  fruit: {
    container: "Original packaging",
    location: "Left drawer",
  },
  vegetables: {
    container: "Original packaging",
    location: "Right drawer",
  },
};

const LEGACY_CATEGORY_MAP = {
  "cooked-meal": "cooked-stuff",
  "meat-poultry": "meat-chicken",
  "soup-stew": "cooked-stuff",
  "seafood": "fish-seafood",
};

const CATEGORY_SCHEMA_VERSION = "2";

const CATEGORY_DAYS_SCHEMA_VERSION = "2";

const CATEGORY_BUILTIN_SCHEMA_VERSION = "1";

const LEGACY_CONTAINER_MAP = {
  "Square tub": "Square tub (small)",
  "Glass container": "Other",
};

const CONTAINER_SCHEMA_VERSION = "1";

const LEGACY_LOCATION_MAP = {
  "Fiambre drawer": "Top drawer",
};

const LOCATION_SCHEMA_VERSION = "1";

const LOCATION_BUILTIN_SCHEMA_VERSION = "1";

const PAGES = {
  home: document.getElementById("page-home"),
  leftovers: document.getElementById("page-leftovers"),
  add: document.getElementById("page-add"),
  fridge: document.getElementById("page-fridge"),
  shopping: document.getElementById("page-shopping"),
  settings: document.getElementById("page-settings"),
  "settings-categories": document.getElementById("page-settings-categories"),
  "settings-containers": document.getElementById("page-settings-containers"),
  "settings-locations": document.getElementById("page-settings-locations"),
  "settings-presets": document.getElementById("page-settings-presets"),
  "settings-inventory": document.getElementById("page-settings-inventory"),
  "settings-notifications": document.getElementById("page-settings-notifications"),
  "settings-backup": document.getElementById("page-settings-backup"),
};

const SETTINGS_DETAIL_PAGES = new Set([
  "settings-categories",
  "settings-containers",
  "settings-locations",
  "settings-presets",
  "settings-inventory",
  "settings-notifications",
  "settings-backup",
]);

let settings = createDefaultSettings();
let leftovers = [];
let shoppingItems = [];
let fridgeExcludedCategories = new Set();
let currentPage = "home";
let returnPage = "leftovers";
let addFormDefaults = null;
let settingsEdit = { type: null, id: null };

const form = document.getElementById("add-form");
const addBackBtn = document.getElementById("add-back");
const dateInput = document.getElementById("date");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const quantityInput = document.getElementById("quantity");
const containerInput = document.getElementById("container");
const locationInput = document.getElementById("location");
const eatByPreview = document.getElementById("eat-by-preview");
const leftoverList = document.getElementById("leftover-list");
const emptyState = document.getElementById("empty-state");
const leftoversAddItemBtn = document.getElementById("leftovers-add-item");
const fridgeByLocation = document.getElementById("fridge-by-location");
const fridgeEmpty = document.getElementById("fridge-empty");
const fridgeSummary = document.getElementById("fridge-summary");
const fridgeFiltersPanel = document.getElementById("fridge-filters-panel");
const fridgeCategoryFilters = document.getElementById("fridge-category-filters");
const fridgeShowAllBtn = document.getElementById("fridge-show-all");
const fridgeHideAllBtn = document.getElementById("fridge-hide-all");
const fridgeFilterEmpty = document.getElementById("fridge-filter-empty");
const shoppingForm = document.getElementById("shopping-form");
const shoppingInput = document.getElementById("shopping-input");
const shoppingList = document.getElementById("shopping-list");
const shoppingEmpty = document.getElementById("shopping-empty");
const shoppingExportBtn = document.getElementById("shopping-export");
const exportBackupBtn = document.getElementById("settings-export");
const importBackupBtn = document.getElementById("settings-import");
const importBackupFile = document.getElementById("settings-import-file");
const backupStatusEl = document.getElementById("settings-backup-status");
const inventoryEmpty = document.getElementById("inventory-empty");
const inventoryContent = document.getElementById("inventory-content");

const SETTINGS_LISTS = {
  categories: document.getElementById("settings-categories-list"),
  containers: document.getElementById("settings-containers-list"),
  locations: document.getElementById("settings-locations-list"),
  presets: document.getElementById("settings-presets-list"),
};

const settingsPresetsAddForm = document.getElementById("settings-presets-add");
const descriptionPresetsDatalist = document.getElementById("description-presets-datalist");
const appLoadingEl = document.getElementById("app-loading");
const appErrorEl = document.getElementById("app-error");

init();

async function init() {
  showAppLoading(true);
  hideAppError();

  try {
    await bootstrapFromCloud();
  } catch (error) {
    showAppLoading(false);
    showAppError(error.message || "Could not load your kitchen from the cloud.");
    return;
  }

  showAppLoading(false);

  dateInput.value = todayString();
  populateDropdowns();
  updateDescriptionDatalist();
  updateEatByPreview();

  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.page === "add" && btn.dataset.return) {
        returnPage = btn.dataset.return;
      }
      navigateTo(btn.dataset.page);
    });
  });

  addBackBtn.addEventListener("click", () => navigateTo(returnPage));

  leftoversAddItemBtn.addEventListener("click", openAddItemFromLeftovers);

  form.addEventListener("submit", handleSubmit);
  dateInput.addEventListener("change", updateEatByPreview);
  categoryInput.addEventListener("change", handleCategoryChange);
  descriptionInput.addEventListener("input", () => applyPresetForDescription(descriptionInput.value));
  descriptionInput.addEventListener("change", () => applyPresetForDescription(descriptionInput.value));

  shoppingForm.addEventListener("submit", handleShoppingSubmit);
  shoppingExportBtn.addEventListener("click", exportShoppingList);

  fridgeShowAllBtn.addEventListener("click", () => {
    showAllFridgeCategories();
    renderFridgeOverview();
  });

  fridgeHideAllBtn.addEventListener("click", () => {
    hideAllFridgeCategories();
    renderFridgeOverview();
  });

  document.querySelectorAll(".settings-add-form").forEach((addForm) => {
    addForm.addEventListener("submit", handleSettingsAdd);
  });

  settingsPresetsAddForm.addEventListener("submit", handlePresetAdd);

  exportBackupBtn.addEventListener("click", exportBackup);
  importBackupBtn.addEventListener("click", () => importBackupFile.click());
  importBackupFile.addEventListener("change", handleImportBackup);

  window.LeftoversNotifications?.bindNotificationsUI();
  navigateTo("home");
}

function createDefaultSettings() {
  const next = structuredClone(DEFAULT_SETTINGS);
  next._schemaVersions = {};
  return next;
}

function getSchemaVersions() {
  if (!settings._schemaVersions || typeof settings._schemaVersions !== "object") {
    settings._schemaVersions = {};
  }
  return settings._schemaVersions;
}

function normalizeSettings(parsed) {
  if (!parsed || typeof parsed !== "object") return createDefaultSettings();

  const next = {
    categories: parsed.categories?.length
      ? parsed.categories
      : structuredClone(DEFAULT_SETTINGS.categories),
    containers: parsed.containers?.length
      ? parsed.containers
      : structuredClone(DEFAULT_SETTINGS.containers),
    locations: parsed.locations?.length
      ? parsed.locations
      : structuredClone(DEFAULT_SETTINGS.locations),
    presets: Array.isArray(parsed.presets) ? parsed.presets : [],
    _schemaVersions:
      parsed._schemaVersions && typeof parsed._schemaVersions === "object"
        ? parsed._schemaVersions
        : {},
  };
  return next;
}

function buildCloudPayload() {
  const notifications = window.LeftoversNotifications?.getSettings() || {
    enabled: false,
    email: "",
    daysBefore: 3,
  };

  return {
    settings,
    leftovers,
    shopping: shoppingItems,
    email: notifications.email,
    notifications_enabled: notifications.enabled,
    notify_days_before: notifications.daysBefore,
  };
}

function applyKitchenFromCloud(kitchen) {
  const hasStoredSettings =
    kitchen.settings &&
    typeof kitchen.settings === "object" &&
    Array.isArray(kitchen.settings.categories) &&
    kitchen.settings.categories.length;

  if (hasStoredSettings) {
    settings = normalizeSettings(kitchen.settings);
  } else {
    settings = createDefaultSettings();
    if (Array.isArray(kitchen.categories) && kitchen.categories.length) {
      const labelById = new Map(kitchen.categories.map((cat) => [cat.id, cat.label]));
      settings.categories = settings.categories.map((cat) => ({
        ...cat,
        label: labelById.get(cat.id) || cat.label,
      }));
    }
  }

  leftovers = Array.isArray(kitchen.leftovers) ? kitchen.leftovers : [];
  shoppingItems = Array.isArray(kitchen.shopping) ? kitchen.shopping : [];
  window.LeftoversNotifications?.applyFromCloud({
    enabled: kitchen.notifications_enabled,
    email: kitchen.email,
    daysBefore: kitchen.notify_days_before,
  });
}

function applyLegacyLocalData(legacy) {
  if (legacy.settings) {
    settings = normalizeSettings(legacy.settings);
  }
  if (Array.isArray(legacy.leftovers)) leftovers = legacy.leftovers;
  if (Array.isArray(legacy.shopping)) shoppingItems = legacy.shopping;
  window.LeftoversNotifications?.applyLegacyLocal(legacy.notifications);
}

async function bootstrapFromCloud() {
  if (!window.LeftoversCloud?.isAvailable()) {
    throw new Error("Open the Netlify-deployed app to use Leftovers.");
  }

  window.LeftoversCloud.registerStateProvider(buildCloudPayload);

  const { kitchen, legacy } = await window.LeftoversCloud.loadKitchen();

  if (kitchen) {
    applyKitchenFromCloud(kitchen);
  } else if (legacy) {
    applyLegacyLocalData(legacy);
  }

  runDataMigrations();

  const needsInitialSave = !kitchen || !kitchen.settings?.categories?.length;
  if (needsInitialSave) {
    await window.LeftoversCloud.saveNow();
  }

  window.LeftoversCloud.clearLegacyLocalData();
}

function runDataMigrations() {
  migrateCategorySchema();
  migrateDefaultCategoryDays();
  migrateBuiltinCategories();
  migrateContainerSchema();
  migrateLocationSchema();
  migrateBuiltinLocations();
}

function showAppLoading(show) {
  if (!appLoadingEl) return;
  appLoadingEl.classList.toggle("hidden", !show);
  document.querySelector(".app")?.classList.toggle("app--loading", show);
}

function showAppError(message) {
  if (!appErrorEl) return;
  appErrorEl.textContent = message;
  appErrorEl.classList.remove("hidden");
  document.querySelector(".app")?.classList.add("app--loading");
}

function hideAppError() {
  appErrorEl?.classList.add("hidden");
}

function migrateLocationSchema() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.location === LOCATION_SCHEMA_VERSION) return;

  settings.locations = structuredClone(DEFAULT_SETTINGS.locations);

  leftovers.forEach((item) => {
    const mapped = LEGACY_LOCATION_MAP[item.location];
    if (mapped) item.location = mapped;
  });

  settings.presets.forEach((preset) => {
    const mapped = LEGACY_LOCATION_MAP[preset.location];
    if (mapped) preset.location = mapped;
  });

  saveSettings();
  saveLeftovers();
  schemaVersions.location = LOCATION_SCHEMA_VERSION;
}

function migrateBuiltinLocations() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.locationBuiltin === LOCATION_BUILTIN_SCHEMA_VERSION) return;

  DEFAULT_SETTINGS.locations.forEach((defaultLoc) => {
    const hasId = settings.locations.some((loc) => loc.id === defaultLoc.id);
    const hasLabel = settings.locations.some(
      (loc) => loc.label.toLowerCase() === defaultLoc.label.toLowerCase()
    );
    if (hasId || hasLabel) return;

    settings.locations.push(structuredClone(defaultLoc));
  });

  saveSettings();
  schemaVersions.locationBuiltin = LOCATION_BUILTIN_SCHEMA_VERSION;
}

function migrateContainerSchema() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.container === CONTAINER_SCHEMA_VERSION) return;

  settings.containers = structuredClone(DEFAULT_SETTINGS.containers);

  leftovers.forEach((item) => {
    const mapped = LEGACY_CONTAINER_MAP[item.container];
    if (mapped) item.container = mapped;
  });

  saveSettings();
  saveLeftovers();
  schemaVersions.container = CONTAINER_SCHEMA_VERSION;
}

function migrateCategorySchema() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.category === CATEGORY_SCHEMA_VERSION) return;

  settings.categories = structuredClone(DEFAULT_SETTINGS.categories);

  leftovers.forEach((item) => {
    const mapped = LEGACY_CATEGORY_MAP[item.category];
    if (mapped) item.category = mapped;
  });

  settings.presets.forEach((preset) => {
    const mapped = LEGACY_CATEGORY_MAP[preset.categoryId];
    if (mapped) preset.categoryId = mapped;
  });

  saveSettings();
  saveLeftovers();
  schemaVersions.category = CATEGORY_SCHEMA_VERSION;
}

function migrateDefaultCategoryDays() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.categoryDays === CATEGORY_DAYS_SCHEMA_VERSION) return;

  const defaultDays = new Map(DEFAULT_SETTINGS.categories.map((cat) => [cat.id, cat.days]));
  settings.categories.forEach((cat) => {
    if (defaultDays.has(cat.id)) cat.days = defaultDays.get(cat.id);
  });

  saveSettings();
  schemaVersions.categoryDays = CATEGORY_DAYS_SCHEMA_VERSION;
}

function migrateBuiltinCategories() {
  const schemaVersions = getSchemaVersions();
  if (schemaVersions.categoryBuiltin === CATEGORY_BUILTIN_SCHEMA_VERSION) return;

  DEFAULT_SETTINGS.categories.forEach((defaultCat) => {
    if (settings.categories.some((cat) => cat.id === defaultCat.id)) return;

    const otherIndex = settings.categories.findIndex((cat) => cat.id === "other");
    if (otherIndex >= 0) {
      settings.categories.splice(otherIndex, 0, structuredClone(defaultCat));
    } else {
      settings.categories.push(structuredClone(defaultCat));
    }
  });

  saveSettings();
  schemaVersions.categoryBuiltin = CATEGORY_BUILTIN_SCHEMA_VERSION;
}

function openAddItemFromLeftovers() {
  returnPage = "leftovers";
  addFormDefaults = { ...LEFTOVERS_ADD_DEFAULTS };
  navigateTo("add");
}

function loadSettings() {
  return normalizeSettings(settings);
}

function saveSettings() {
  populateDropdowns();
  updateDescriptionDatalist();
  if (currentPage === "fridge" && leftovers.length > 0) {
    renderFridgeCategoryFilters();
  }
  window.LeftoversCloud?.queueSave();
}

function getOrderedCategories() {
  return settings.categories;
}

function categoryOptionsHtml(selectedId) {
  return getOrderedCategories()
    .map(
      (cat) =>
        `<option value="${escapeHtml(cat.id)}"${cat.id === selectedId ? " selected" : ""}>${escapeHtml(cat.label)}</option>`
    )
    .join("");
}

function locationOptionsHtml(selectedLabel) {
  return settings.locations
    .map(
      (loc) =>
        `<option value="${escapeHtml(loc.label)}"${loc.label === selectedLabel ? " selected" : ""}>${escapeHtml(loc.label)}</option>`
    )
    .join("");
}

function findPresetByDescription(text) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;
  return settings.presets.find((preset) => preset.description.toLowerCase() === normalized);
}

function applyPresetForDescription(text) {
  const preset = findPresetByDescription(text);
  if (!preset) return;

  if (settings.categories.some((cat) => cat.id === preset.categoryId)) {
    categoryInput.value = preset.categoryId;
  }
  applyCategoryDefaults(categoryInput.value);
  if (settings.locations.some((loc) => loc.label === preset.location)) {
    locationInput.value = preset.location;
  }
  updateEatByPreview();
}

function applyCategoryDefaults(categoryId) {
  const defaults = CATEGORY_ADD_DEFAULTS[categoryId];
  if (!defaults) return;

  if (defaults.container && settings.containers.some((item) => item.label === defaults.container)) {
    containerInput.value = defaults.container;
  }
  if (defaults.location && settings.locations.some((item) => item.label === defaults.location)) {
    locationInput.value = defaults.location;
  }
}

function handleCategoryChange() {
  applyCategoryDefaults(categoryInput.value);
  updateEatByPreview();
}

function updateDescriptionDatalist() {
  if (!descriptionPresetsDatalist) return;
  descriptionPresetsDatalist.innerHTML = settings.presets
    .map((preset) => `<option value="${escapeHtml(preset.description)}"></option>`)
    .join("");
}

function populatePresetFormSelects(form) {
  const categorySelect = form.categoryId;
  const locationSelect = form.location;
  if (categorySelect) {
    categorySelect.innerHTML = categoryOptionsHtml(categorySelect.value || settings.categories[0]?.id);
  }
  if (locationSelect) {
    locationSelect.innerHTML = locationOptionsHtml(locationSelect.value || settings.locations[0]?.label);
  }
}

function getCategoryById(id) {
  return settings.categories.find((item) => item.id === id);
}

function getCategoryLabel(id) {
  return getCategoryById(id)?.label || id;
}

function getCategoryIcon(id) {
  return CATEGORY_ICONS[id] || "🏷️";
}

function getCategoryDays(id) {
  return getCategoryById(id)?.days ?? 4;
}

function getLocationLabels() {
  return settings.locations.map((item) => item.label);
}

function isFreezerLocation(label) {
  if (!label) return false;
  const setting = settings.locations.find((item) => item.label === label);
  if (setting?.id === "freezer") return true;
  return label.toLowerCase() === "freezer";
}

function sortLocationsWithFreezerLast(locations) {
  const freezer = locations.filter(isFreezerLocation);
  const rest = locations.filter((loc) => !isFreezerLocation(loc));
  return [...rest, ...freezer];
}

function getOrderedLocationLabels() {
  const labels = getLocationLabels();
  const extras = [...new Set(leftovers.map((item) => item.location).filter((loc) => loc && !labels.includes(loc)))];
  return sortLocationsWithFreezerLast([...labels, ...extras]);
}

function populateDropdowns() {
  populateQuantityDropdown();
  fillSelect(categoryInput, getOrderedCategories(), (item) => item.id, (item) => item.label);
  fillSelect(containerInput, settings.containers, (item) => item.label, (item) => item.label);
  fillSelect(locationInput, settings.locations, (item) => item.label, (item) => item.label);
}

function fillSelect(select, items, getValue, getLabel) {
  const current = select.value;
  select.innerHTML = items
    .map((item) => `<option value="${escapeHtml(getValue(item))}">${escapeHtml(getLabel(item))}</option>`)
    .join("");
  if (current && [...select.options].some((opt) => opt.value === current)) {
    select.value = current;
  }
}

function populateQuantityDropdown() {
  const current = quantityInput.value;
  quantityInput.innerHTML = Array.from({ length: MAX_ITEM_QUANTITY }, (_, index) => {
    const value = String(index + 1);
    return `<option value="${value}">${value}</option>`;
  }).join("");
  if (current && Number(current) >= 1 && Number(current) <= MAX_ITEM_QUANTITY) {
    quantityInput.value = current;
  } else {
    quantityInput.value = "1";
  }
}

function slugify(text) {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}

function uniqueId(type, label) {
  let id = slugify(label);
  let n = 1;
  while (settings[type].some((item) => item.id === id)) {
    id = `${slugify(label)}-${n++}`;
  }
  return id;
}

function countLeftoversUsing(type, value) {
  if (type === "categories") return leftovers.filter((item) => item.category === value).length;
  if (type === "containers") return leftovers.filter((item) => item.container === value).length;
  if (type === "locations") return leftovers.filter((item) => item.location === value).length;
  return 0;
}

function navigateTo(page) {
  currentPage = page;

  Object.entries(PAGES).forEach(([name, el]) => {
    el.classList.toggle("hidden", name !== page);
  });

  if (page === "leftovers") renderLeftovers();
  if (page === "fridge") {
    hideAllFridgeCategories();
    renderFridgeOverview();
  }
  if (page === "shopping") renderShopping();
  if (SETTINGS_DETAIL_PAGES.has(page)) renderSettingsPage(page);
  if (page === "add") {
    populateDropdowns();
    updateDescriptionDatalist();
    dateInput.value = todayString();
    if (addFormDefaults) {
      if (settings.categories.some((cat) => cat.id === addFormDefaults.categoryId)) {
        categoryInput.value = addFormDefaults.categoryId;
      }
      if (settings.locations.some((loc) => loc.label === addFormDefaults.location)) {
        locationInput.value = addFormDefaults.location;
      }
      addFormDefaults = null;
    }
    applyCategoryDefaults(categoryInput.value);
    updateEatByPreview();
    descriptionInput.focus();
  }
}

function loadLeftovers() {
  return leftovers;
}

function saveLeftovers() {
  window.LeftoversCloud?.queueSave();
}

function loadShopping() {
  return shoppingItems;
}

function saveShopping() {
  window.LeftoversCloud?.queueSave();
}

function buildBackupPayload() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    leftovers,
    shopping: shoppingItems,
    settings,
  };
}

function exportBackup() {
  const payload = buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `leftovers-backup-${todayString()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setBackupStatus("Backup downloaded.");
}

function validateBackup(data) {
  if (!data || typeof data !== "object") return "Invalid backup file.";
  if (!Array.isArray(data.leftovers)) return "Backup is missing fridge items.";
  if (!Array.isArray(data.shopping)) return "Backup is missing shopping list.";
  if (!data.settings || typeof data.settings !== "object") return "Backup is missing settings.";
  if (!Array.isArray(data.settings.categories) || !data.settings.categories.length) {
    return "Backup settings are missing categories.";
  }
  if (!Array.isArray(data.settings.containers) || !data.settings.containers.length) {
    return "Backup settings are missing containers.";
  }
  if (!Array.isArray(data.settings.locations) || !data.settings.locations.length) {
    return "Backup settings are missing locations.";
  }
  if (!Array.isArray(data.settings.presets)) data.settings.presets = [];
  return null;
}

function applyBackup(data) {
  settings = normalizeSettings(data.settings);
  leftovers = data.leftovers;
  shoppingItems = data.shopping;
  fridgeExcludedCategories.clear();
  settingsEdit = { type: null, id: null };
  saveSettings();
  saveLeftovers();
  saveShopping();
  populateDropdowns();
  updateDescriptionDatalist();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
  if (currentPage === "shopping") renderShopping();
  if (SETTINGS_DETAIL_PAGES.has(currentPage)) renderSettingsPage(currentPage);
  window.LeftoversCloud?.saveNow().catch(() => {});
}

function handleImportBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const error = validateBackup(data);
      if (error) {
        setBackupStatus(error);
        return;
      }

      const itemCount = data.leftovers.length;
      const shoppingCount = data.shopping.length;
      const message =
        `Import this backup? It will replace your current data ` +
        `(${itemCount} fridge item${itemCount === 1 ? "" : "s"}, ` +
        `${shoppingCount} shopping item${shoppingCount === 1 ? "" : "s"}, and all settings).`;

      if (!confirm(message)) {
        setBackupStatus("Import cancelled.");
        return;
      }

      applyBackup(data);
      setBackupStatus("Import complete.");
    } catch {
      setBackupStatus("Could not read backup file. Make sure it is valid JSON.");
    }
  };
  reader.readAsText(file);
}

function setBackupStatus(message) {
  if (backupStatusEl) backupStatusEl.textContent = message;
}

function todayString() {
  return formatDateInput(new Date());
}

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(dateStr, days) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function formatDisplayDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(dateStr) {
  const target = parseDate(dateStr);
  const today = parseDate(todayString());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getStatus(eatByDate) {
  const remaining = daysUntil(eatByDate);
  if (remaining < 0) return "overdue";
  if (remaining <= 1) return "soon";
  return "fresh";
}

function statusLabel(status) {
  if (status === "overdue") return "Overdue";
  if (status === "soon") return "Use soon";
  return "Fresh";
}

function statusMessage(eatByDate) {
  const remaining = daysUntil(eatByDate);
  if (remaining < 0) {
    const days = Math.abs(remaining);
    return days === 1 ? "1 day past eat-by" : `${days} days past eat-by`;
  }
  if (remaining === 0) return "Eat today";
  if (remaining === 1) return "1 day left";
  return `${remaining} days left`;
}

function updateEatByPreview() {
  const date = dateInput.value;
  const category = categoryInput.value;
  if (!date || !category) {
    eatByPreview.textContent = "";
    return;
  }
  const days = getCategoryDays(category);
  const eatBy = addDays(date, days);
  eatByPreview.textContent = `Eat by ${formatDisplayDate(eatBy)} (${days} days for ${getCategoryLabel(category).toLowerCase()})`;
}

function getItemQuantity(item) {
  return item.quantity || 1;
}

function formatItemDescription(item) {
  const qty = getItemQuantity(item);
  const name = escapeHtml(item.description);
  return qty > 1 ? `${name} <span class="item-qty">×${qty}</span>` : name;
}

function formatFridgeItemLabel(item) {
  return `${escapeHtml(item.description)} (${getItemQuantity(item)})`;
}

function handleSubmit(event) {
  event.preventDefault();

  const item = {
    id: crypto.randomUUID(),
    dateAdded: dateInput.value,
    description: descriptionInput.value.trim(),
    quantity: Number(quantityInput.value),
    category: categoryInput.value,
    container: containerInput.value,
    location: locationInput.value,
    eatBy: addDays(dateInput.value, getCategoryDays(categoryInput.value)),
  };

  leftovers.unshift(item);
  saveLeftovers();

  descriptionInput.value = "";
  quantityInput.value = "1";
  containerInput.selectedIndex = 0;
  locationInput.selectedIndex = 0;
  dateInput.value = todayString();
  updateEatByPreview();
  navigateTo(returnPage);
}

function removeLeftover(id) {
  leftovers = leftovers.filter((item) => item.id !== id);
  saveLeftovers();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
  if (currentPage === "settings-inventory") renderInventory();
}

function setLeftoverQuantity(id, quantity) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  const qty = Math.max(0, Math.min(MAX_ITEM_QUANTITY, Number(quantity) || 0));
  if (qty <= 0) {
    removeLeftover(id);
    return;
  }

  if (qty === getItemQuantity(item)) return;

  item.quantity = qty;
  saveLeftovers();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
}

function reduceLeftoverQuantity(id) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  const nextQty = getItemQuantity(item) - 1;
  if (nextQty <= 0) {
    const description = item.description;
    removeLeftover(id);
    if (confirm(`Add "${description}" to your Shopping List?`)) {
      addToShoppingList(description);
    }
    return;
  }

  item.quantity = nextQty;
  saveLeftovers();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
}

function increaseLeftoverQuantity(id) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  const nextQty = Math.min(getItemQuantity(item) + 1, MAX_ITEM_QUANTITY);
  if (nextQty === getItemQuantity(item)) return;

  item.quantity = nextQty;
  saveLeftovers();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
}

function relocateLeftover(id, newLocation) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item || item.location === newLocation) return;
  item.location = newLocation;
  saveLeftovers();
  if (currentPage === "leftovers") renderLeftovers();
  if (currentPage === "fridge") renderFridgeOverview();
}

function locationSelectHtml(itemId, currentLocation, className) {
  const labels = getOrderedLocationLabels();
  const options = labels
    .map(
      (loc) =>
        `<option value="${escapeHtml(loc)}"${loc === currentLocation ? " selected" : ""}>${escapeHtml(loc)}</option>`
    )
    .join("");
  return `<select class="${className}" data-id="${itemId}" aria-label="Move to location">${options}</select>`;
}

function bindLocationSelects(container, selector) {
  container.querySelectorAll(selector).forEach((select) => {
    select.addEventListener("change", () => relocateLeftover(select.dataset.id, select.value));
  });
}

function getLeftoversPageItems() {
  return leftovers.filter((item) => LEFTOVERS_PAGE_CATEGORY_IDS.has(item.category));
}

function getFilteredLeftovers() {
  return [...getLeftoversPageItems()].sort((a, b) => {
    const statusOrder = { overdue: 0, soon: 1, fresh: 2 };
    const statusA = getStatus(a.eatBy);
    const statusB = getStatus(b.eatBy);
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    return a.eatBy.localeCompare(b.eatBy);
  });
}

function renderLeftovers() {
  const pageItems = getLeftoversPageItems();
  const filtered = getFilteredLeftovers();

  emptyState.classList.toggle("hidden", filtered.length > 0 || pageItems.length === 0);
  leftoverList.classList.toggle("hidden", filtered.length === 0);

  if (pageItems.length === 0) {
    emptyState.classList.remove("hidden");
    const title = emptyState.querySelector(".empty-state__title");
    const text = emptyState.querySelector(".empty-state__text");
    if (leftovers.length === 0) {
      title.textContent = "Your fridge is empty";
      text.textContent = "Add cooked stuff from the home menu.";
    } else {
      title.textContent = "No cooked stuff";
      text.innerHTML = "Only cooked stuff appears here.<br>Add a cooked item to track it.";
    }
    leftoverList.innerHTML = "";
    return;
  }

  const defaultLocation = settings.locations[0]?.label || "";

  leftoverList.innerHTML = filtered
    .map((item) => {
      const status = getStatus(item.eatBy);

      return `
        <li class="card card--${status}">
          <div class="card__main">
            <div class="card__header">
              <h3 class="card__title">${formatItemDescription(item)}</h3>
            </div>
            <dl class="card__meta">
              <div>
                <dt>Added</dt>
                <dd>${formatDisplayDate(item.dateAdded)}</dd>
              </div>
              <div>
                <dt>Eat by</dt>
                <dd class="card__eat-by">${formatDisplayDate(item.eatBy)}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>${getItemQuantity(item)}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>${escapeHtml(getCategoryLabel(item.category))}</dd>
              </div>
              <div>
                <dt>Container</dt>
                <dd>${escapeHtml(item.container)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>${locationSelectHtml(item.id, item.location || defaultLocation, "card__location-select")}</dd>
              </div>
            </dl>
            <p class="card__countdown">${statusMessage(item.eatBy)}</p>
          </div>
          <button
            type="button"
            class="btn btn--ghost btn--icon card__reduce"
            data-id="${item.id}"
            aria-label="Reduce ${escapeHtml(item.description)} quantity by 1"
          >
            <span aria-hidden="true">➖</span>
          </button>
        </li>
      `;
    })
    .join("");

  leftoverList.querySelectorAll(".card__reduce").forEach((btn) => {
    btn.addEventListener("click", () => reduceLeftoverQuantity(btn.dataset.id));
  });

  bindLocationSelects(leftoverList, ".card__location-select");
}

function hideAllFridgeCategories() {
  fridgeExcludedCategories.clear();
  settings.categories.forEach((cat) => fridgeExcludedCategories.add(cat.id));
}

function showAllFridgeCategories() {
  fridgeExcludedCategories.clear();
}

function getFridgeVisibleLeftovers() {
  return leftovers.filter((item) => {
    const known = settings.categories.some((cat) => cat.id === item.category);
    if (!known) return true;
    return !fridgeExcludedCategories.has(item.category);
  });
}

function renderFridgeCategoryFilters() {
  fridgeCategoryFilters.innerHTML = getOrderedCategories()
    .map((cat) => {
      const included = !fridgeExcludedCategories.has(cat.id);
      return `
        <button
          type="button"
          class="filter-btn filter-btn--icon ${included ? "filter-btn--active" : ""}"
          data-category="${cat.id}"
          aria-pressed="${included}"
          aria-label="${escapeHtml(cat.label)}"
          title="${escapeHtml(cat.label)}"
        >
          <span class="filter-btn__icon" aria-hidden="true">${getCategoryIcon(cat.id)}</span>
        </button>
      `;
    })
    .join("");

  fridgeCategoryFilters.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.category;
      if (fridgeExcludedCategories.has(id)) {
        fridgeExcludedCategories.delete(id);
      } else {
        fridgeExcludedCategories.add(id);
      }
      renderFridgeOverview();
    });
  });

  const allIncluded = fridgeExcludedCategories.size === 0;
  const allExcluded = fridgeExcludedCategories.size >= getOrderedCategories().length;
  fridgeShowAllBtn.disabled = allIncluded;
  fridgeShowAllBtn.setAttribute("aria-disabled", String(allIncluded));
  fridgeHideAllBtn.disabled = allExcluded;
  fridgeHideAllBtn.setAttribute("aria-disabled", String(allExcluded));
}

function renderFridgeOverview() {
  if (leftovers.length === 0) {
    fridgeEmpty.classList.remove("hidden");
    fridgeFiltersPanel.classList.add("hidden");
    fridgeFilterEmpty.classList.add("hidden");
    fridgeByLocation.innerHTML = "";
    fridgeSummary.textContent = "";
    return;
  }

  fridgeEmpty.classList.add("hidden");
  fridgeFiltersPanel.classList.remove("hidden");
  renderFridgeCategoryFilters();

  const visible = getFridgeVisibleLeftovers();
  fridgeSummary.textContent = `${visible.length} of ${leftovers.length} item${leftovers.length === 1 ? "" : "s"} shown`;

  if (visible.length === 0) {
    fridgeFilterEmpty.classList.remove("hidden");
    fridgeByLocation.innerHTML = "";
    return;
  }

  fridgeFilterEmpty.classList.add("hidden");

  const byLocation = {};
  visible.forEach((item) => {
    const loc = item.location || "Unknown";
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(item);
  });

  const orderedLocations = getOrderedLocationLabels().filter((loc) => byLocation[loc]);

  fridgeByLocation.innerHTML = orderedLocations
    .map((location) => {
      const items = byLocation[location].sort((a, b) => a.description.localeCompare(b.description));
      return `
        <section class="panel location-group">
          <h2 class="location-group__title">${escapeHtml(location)}</h2>
          <ul class="location-group__list">
            ${items
              .map((item) => {
                const status = getStatus(item.eatBy);
                return `
                  <li class="location-item location-item--${status}">
                    <details class="location-item__details">
                      <summary class="location-item__summary">
                        <span class="location-item__name">${formatFridgeItemLabel(item)}</span>
                        <span class="location-item__chevron" aria-hidden="true">▼</span>
                      </summary>
                      <div class="location-item__body">
                        <span class="location-item__detail">${escapeHtml(item.container)} · eat by ${formatDisplayDate(item.eatBy)} (${getItemQuantity(item)})</span>
                        <label class="location-item__move">
                          <span class="location-item__move-label">Move to</span>
                          ${locationSelectHtml(item.id, item.location || location, "location-item__select")}
                        </label>
                        <div class="location-item__actions">
                          <button
                            type="button"
                            class="btn btn--ghost btn--icon location-item__reduce"
                            data-id="${item.id}"
                            aria-label="Reduce ${escapeHtml(item.description)} quantity by 1"
                          >
                            <span aria-hidden="true">➖</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn--ghost btn--icon location-item__increase"
                            data-id="${item.id}"
                            aria-label="Increase ${escapeHtml(item.description)} quantity by 1"
                            ${getItemQuantity(item) >= MAX_ITEM_QUANTITY ? "disabled" : ""}
                          >
                            <span aria-hidden="true">➕</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn--ghost btn--icon location-item__shopping"
                            data-id="${item.id}"
                            aria-label="Add ${escapeHtml(item.description)} to shopping list"
                          >
                            <span aria-hidden="true">🛒</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn--ghost btn--icon location-item__delete"
                            data-id="${item.id}"
                            aria-label="Remove ${escapeHtml(item.description)} from fridge"
                          >
                            <span aria-hidden="true">🗑️</span>
                          </button>
                        </div>
                      </div>
                    </details>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
      `;
    })
    .join("");

  bindLocationSelects(fridgeByLocation, ".location-item__select");

  fridgeByLocation.querySelectorAll(".location-item__reduce").forEach((btn) => {
    btn.addEventListener("click", () => reduceLeftoverQuantity(btn.dataset.id));
  });

  fridgeByLocation.querySelectorAll(".location-item__increase").forEach((btn) => {
    btn.addEventListener("click", () => increaseLeftoverQuantity(btn.dataset.id));
  });

  fridgeByLocation.querySelectorAll(".location-item__shopping").forEach((btn) => {
    btn.addEventListener("click", () => addLeftoverToShoppingList(btn.dataset.id));
  });

  fridgeByLocation.querySelectorAll(".location-item__delete").forEach((btn) => {
    btn.addEventListener("click", () => removeLeftover(btn.dataset.id));
  });
}

function renderSettingsPage(page) {
  if (page === "settings-categories") renderSettingsList("categories");
  if (page === "settings-containers") renderSettingsList("containers");
  if (page === "settings-locations") renderSettingsList("locations");
  if (page === "settings-presets") {
    renderPresetsList();
    populatePresetFormSelects(settingsPresetsAddForm);
  }
  if (page === "settings-inventory") renderInventory();
  if (page === "settings-notifications") window.LeftoversNotifications?.populateNotificationsForm();
}

function renderInventory() {
  const hasItems = leftovers.length > 0;
  inventoryEmpty.classList.toggle("hidden", hasItems);
  inventoryContent.classList.toggle("hidden", !hasItems);

  if (!hasItems) {
    inventoryContent.innerHTML = "";
    return;
  }

  const byLocation = {};
  leftovers.forEach((item) => {
    const loc = item.location || "Unknown";
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(item);
  });

  const orderedLocations = getOrderedLocationLabels().filter((loc) => byLocation[loc]);
  const unknownLocations = Object.keys(byLocation).filter((loc) => !orderedLocations.includes(loc)).sort();
  const locations = sortLocationsWithFreezerLast([...orderedLocations, ...unknownLocations]);

  inventoryContent.innerHTML = locations
    .map((location) => {
      const items = byLocation[location].sort((a, b) => a.description.localeCompare(b.description));
      return `
        <section class="panel inventory-group">
          <h2 class="inventory-group__title">${escapeHtml(location)}</h2>
          <div class="inventory-table-wrap">
            <table class="inventory-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Category</th>
                  <th scope="col" class="inventory-table__qty-col">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td class="inventory-table__item">${escapeHtml(item.description)}</td>
                    <td class="inventory-table__category">${escapeHtml(getCategoryLabel(item.category))}</td>
                    <td class="inventory-table__qty">
                      <input
                        type="number"
                        class="inventory-qty"
                        data-id="${item.id}"
                        min="0"
                        max="${MAX_ITEM_QUANTITY}"
                        step="1"
                        inputmode="numeric"
                        value="${getItemQuantity(item)}"
                        aria-label="Quantity for ${escapeHtml(item.description)} in ${escapeHtml(location)}"
                      />
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");

  inventoryContent.querySelectorAll(".inventory-qty").forEach((input) => {
    input.addEventListener("change", () => {
      setLeftoverQuantity(input.dataset.id, input.value);
      if (currentPage === "settings-inventory") renderInventory();
    });
  });
}

function renderCurrentSettingsPage() {
  if (SETTINGS_DETAIL_PAGES.has(currentPage)) renderSettingsPage(currentPage);
}

function renderPresetsList() {
  const listEl = SETTINGS_LISTS.presets;
  const items = settings.presets;

  listEl.innerHTML = items
    .map((item, index) => {
      const isEditing = settingsEdit.type === "presets" && settingsEdit.id === item.id;
      const categoryLabel = getCategoryLabel(item.categoryId);
      const meta = `${escapeHtml(categoryLabel)} · ${escapeHtml(item.location)}`;

      if (isEditing) {
        return `
          <li class="settings-item settings-item--editing">
            <form class="settings-edit-form settings-preset-form" data-setting-type="presets" data-item-id="${item.id}">
              <input type="text" name="description" value="${escapeHtml(item.description)}" required maxlength="120" />
              <select name="categoryId" required>${categoryOptionsHtml(item.categoryId)}</select>
              <select name="location" required>${locationOptionsHtml(item.location)}</select>
              <div class="settings-item__actions">
                <button type="submit" class="btn btn--primary btn--small">Save</button>
                <button type="button" class="btn btn--ghost btn--small" data-action="cancel">Cancel</button>
              </div>
            </form>
          </li>
        `;
      }

      const canMoveUp = index > 0;
      const canMoveDown = index < items.length - 1;

      return `
        <li class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">${escapeHtml(item.description)}</span>
            <span class="settings-item__meta">${meta}</span>
          </div>
          <div class="settings-item__actions">
            <button type="button" class="btn btn--ghost btn--small" data-action="up" data-setting-type="presets" data-item-id="${item.id}" ${canMoveUp ? "" : "disabled"} aria-label="Move up">↑</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="down" data-setting-type="presets" data-item-id="${item.id}" ${canMoveDown ? "" : "disabled"} aria-label="Move down">↓</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="edit" data-setting-type="presets" data-item-id="${item.id}">Edit</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="delete" data-setting-type="presets" data-item-id="${item.id}">Delete</button>
          </div>
        </li>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleSettingsAction(btn));
  });

  listEl.querySelectorAll(".settings-edit-form").forEach((editForm) => {
    editForm.addEventListener("submit", handleSettingsEditSave);
    editForm.querySelector('[data-action="cancel"]')?.addEventListener("click", () => {
      settingsEdit = { type: null, id: null };
      renderCurrentSettingsPage();
    });
  });
}

function handlePresetAdd(event) {
  event.preventDefault();
  const formEl = event.target;
  const description = formEl.description.value.trim();
  const categoryId = formEl.categoryId.value;
  const location = formEl.location.value;
  if (!description || !categoryId || !location) return;

  if (findPresetByDescription(description)) {
    alert("A shortcut with this description already exists.");
    return;
  }

  settings.presets.push({
    id: crypto.randomUUID(),
    description,
    categoryId,
    location,
  });

  saveSettings();
  formEl.reset();
  populatePresetFormSelects(formEl);
  renderCurrentSettingsPage();
}

function renderSettingsList(type) {
  const listEl = SETTINGS_LISTS[type];
  const items = settings[type];

  listEl.innerHTML = items
    .map((item, index) => {
      const isEditing = settingsEdit.type === type && settingsEdit.id === item.id;

      if (isEditing) {
        if (type === "categories") {
          return `
            <li class="settings-item settings-item--editing">
              <form class="settings-edit-form settings-edit-form--category" data-setting-type="${type}" data-item-id="${item.id}">
                <span class="settings-item__icon" aria-hidden="true">${getCategoryIcon(item.id)}</span>
                <input type="text" name="label" value="${escapeHtml(item.label)}" required maxlength="60" />
                <input type="number" name="days" value="${item.days}" min="1" max="90" required aria-label="Days in fridge" />
                <div class="settings-item__actions">
                  <button type="submit" class="btn btn--primary btn--small">Save</button>
                  <button type="button" class="btn btn--ghost btn--small" data-action="cancel">Cancel</button>
                </div>
              </form>
            </li>
          `;
        }

        return `
          <li class="settings-item settings-item--editing">
            <form class="settings-edit-form" data-setting-type="${type}" data-item-id="${item.id}">
              <input type="text" name="label" value="${escapeHtml(item.label)}" required maxlength="60" />
              <div class="settings-item__actions">
                <button type="submit" class="btn btn--primary btn--small">Save</button>
                <button type="button" class="btn btn--ghost btn--small" data-action="cancel">Cancel</button>
              </div>
            </form>
          </li>
        `;
      }

      const meta = type === "categories" ? `<span class="settings-item__meta">${item.days} days</span>` : "";
      const categoryLabel =
        type === "categories"
          ? `<span class="settings-item__label settings-item__label--category">
              <span class="settings-item__icon" aria-hidden="true">${getCategoryIcon(item.id)}</span>
              ${escapeHtml(item.label)}
            </span>`
          : `<span class="settings-item__label">${escapeHtml(item.label)}</span>`;
      const canMoveUp = index > 0;
      const canMoveDown = index < items.length - 1;

      return `
        <li class="settings-item">
          <div class="settings-item__info">
            ${categoryLabel}
            ${meta}
          </div>
          <div class="settings-item__actions">
            <button type="button" class="btn btn--ghost btn--small" data-action="up" data-setting-type="${type}" data-item-id="${item.id}" ${canMoveUp ? "" : "disabled"} aria-label="Move up">↑</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="down" data-setting-type="${type}" data-item-id="${item.id}" ${canMoveDown ? "" : "disabled"} aria-label="Move down">↓</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="edit" data-setting-type="${type}" data-item-id="${item.id}">Edit</button>
            <button type="button" class="btn btn--ghost btn--small" data-action="delete" data-setting-type="${type}" data-item-id="${item.id}">Delete</button>
          </div>
        </li>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleSettingsAction(btn));
  });

  listEl.querySelectorAll(".settings-edit-form").forEach((editForm) => {
    editForm.addEventListener("submit", handleSettingsEditSave);
    editForm.querySelector('[data-action="cancel"]')?.addEventListener("click", () => {
      settingsEdit = { type: null, id: null };
      renderCurrentSettingsPage();
    });
  });
}

function handleSettingsAction(btn) {
  const action = btn.dataset.action;
  const type = btn.getAttribute("data-setting-type");
  const id = btn.getAttribute("data-item-id");
  if (!action || !type || !id) return;

  if (action === "edit") {
    settingsEdit = { type, id };
    renderCurrentSettingsPage();
    return;
  }

  if (action === "delete") {
    deleteSettingItem(type, id);
    return;
  }

  if (action === "up" || action === "down") {
    moveSettingItem(type, id, action === "up" ? -1 : 1);
  }
}

function handleSettingsAdd(event) {
  event.preventDefault();
  const formEl = event.target;
  const type = formEl.getAttribute("data-setting-type");
  const label = formEl.label.value.trim();
  if (!label) return;

  if (type === "categories") {
    const days = Number(formEl.days.value);
    if (!days || days < 1) return;
    settings.categories.push({ id: uniqueId("categories", label), label, days });
  } else {
    settings[type].push({ id: uniqueId(type, label), label });
  }

  saveSettings();
  formEl.reset();
  if (type === "categories") formEl.days.value = 7;
  renderCurrentSettingsPage();
}

function handleSettingsEditSave(event) {
  event.preventDefault();
  const formEl = event.target;
  const type = formEl.getAttribute("data-setting-type");
  const id = formEl.getAttribute("data-item-id");
  const item = settings[type].find((entry) => entry.id === id);
  if (!item) return;

  if (type === "presets") {
    const description = formEl.description.value.trim();
    const categoryId = formEl.categoryId.value;
    const location = formEl.location.value;
    if (!description || !categoryId || !location) return;

    const duplicate = settings.presets.find(
      (preset) => preset.id !== id && preset.description.toLowerCase() === description.toLowerCase()
    );
    if (duplicate) {
      alert("A shortcut with this description already exists.");
      return;
    }

    item.description = description;
    item.categoryId = categoryId;
    item.location = location;
    settingsEdit = { type: null, id: null };
    saveSettings();
    renderCurrentSettingsPage();
    return;
  }

  const newLabel = formEl.label.value.trim();
  if (!newLabel) return;

  if (type === "categories") {
    const days = Number(formEl.days.value);
    if (!days || days < 1) return;
    item.label = newLabel;
    item.days = days;
  } else {
    const oldLabel = item.label;
    item.label = newLabel;
    if (oldLabel !== newLabel) {
      leftovers.forEach((leftover) => {
        if (type === "containers" && leftover.container === oldLabel) leftover.container = newLabel;
        if (type === "locations" && leftover.location === oldLabel) leftover.location = newLabel;
      });
      saveLeftovers();
    }
  }

  settingsEdit = { type: null, id: null };
  saveSettings();
  renderCurrentSettingsPage();
}

function moveSettingItem(type, id, direction) {
  const items = settings[type];
  if (!items) return;
  const index = items.findIndex((item) => item.id === id);
  const newIndex = index + direction;
  if (index < 0 || newIndex < 0 || newIndex >= items.length) return;

  const [moved] = items.splice(index, 1);
  items.splice(newIndex, 0, moved);
  saveSettings();
  renderCurrentSettingsPage();
}

function deleteSettingItem(type, id) {
  if (type === "presets") {
    settings.presets = settings.presets.filter((entry) => entry.id !== id);
    saveSettings();
    renderCurrentSettingsPage();
    return;
  }

  const items = settings[type];
  if (items.length <= 1) {
    alert("You must keep at least one option.");
    return;
  }

  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  const usageKey = type === "categories" ? item.id : item.label;
  const inUse = countLeftoversUsing(type, usageKey);
  if (inUse > 0) {
    alert(`This option is used by ${inUse} item${inUse === 1 ? "" : "s"} in the fridge and can't be deleted.`);
    return;
  }

  settings[type] = items.filter((entry) => entry.id !== id);
  saveSettings();
  renderCurrentSettingsPage();
}

function buildShoppingListExportText() {
  const lines = shoppingItems.map((item) => (item.checked ? `✓ ${item.text}` : item.text));
  return `Shopping List\n\n${lines.join("\n")}\n`;
}

async function exportShoppingList() {
  if (!shoppingItems.length) {
    alert("Your shopping list is empty.");
    return;
  }

  const content = buildShoppingListExportText();
  const filename = `shopping-list-${todayString()}.txt`;
  const file = new File([content], filename, { type: "text/plain" });

  try {
    if (navigator.share) {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Shopping List" });
        return;
      }

      await navigator.share({ text: content, title: "Shopping List" });
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleShoppingSubmit(event) {
  event.preventDefault();

  const text = shoppingInput.value.trim();
  if (!text) return;

  addToShoppingList(text);
  shoppingInput.value = "";
  renderShopping();
  shoppingInput.focus();
}

function addToShoppingList(text) {
  shoppingItems.push({ id: crypto.randomUUID(), text, checked: false });
  saveShopping();
}

function addLeftoverToShoppingList(id) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  addToShoppingList(item.description);
  if (currentPage === "shopping") renderShopping();
}

function toggleShoppingItem(id) {
  shoppingItems = shoppingItems.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  saveShopping();
  renderShopping();
}

function removeShoppingItem(id) {
  shoppingItems = shoppingItems.filter((item) => item.id !== id);
  saveShopping();
  renderShopping();
}

function renderShopping() {
  const hasItems = shoppingItems.length > 0;
  shoppingEmpty.classList.toggle("hidden", hasItems);
  shoppingList.classList.toggle("hidden", !hasItems);
  shoppingExportBtn.disabled = !hasItems;

  if (!hasItems) {
    shoppingList.innerHTML = "";
    return;
  }

  shoppingList.innerHTML = shoppingItems
    .map(
      (item) => `
      <li class="shopping-item ${item.checked ? "shopping-item--checked" : ""}">
        <label class="shopping-item__label">
          <input type="checkbox" data-id="${item.id}" ${item.checked ? "checked" : ""} />
          <span>${escapeHtml(item.text)}</span>
        </label>
        <button type="button" class="btn btn--ghost btn--small shopping-item__remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.text)}">Remove</button>
      </li>
    `
    )
    .join("");

  shoppingList.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener("change", () => toggleShoppingItem(box.dataset.id));
  });

  shoppingList.querySelectorAll(".shopping-item__remove").forEach((btn) => {
    btn.addEventListener("click", () => removeShoppingItem(btn.dataset.id));
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

window.LeftoversApp = {
  getLeftovers: () => leftovers,
  getCategories: () => getOrderedCategories().map((cat) => ({ id: cat.id, label: cat.label })),
  getSettings: () => settings,
  getShopping: () => shoppingItems,
};

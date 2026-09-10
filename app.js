const BACKUP_VERSION = 1;
const MAX_ITEM_QUANTITY = 30;
const PRESET_PHOTO_MAX_PX = 400;
const PRESET_PHOTO_JPEG_QUALITY = 0.82;
const PRESET_PHOTO_MAX_BYTES = 180000;

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
    { id: "canned-goods", label: "Canned goods", days: 90 },
    { id: "dried-goods", label: "Dried goods", days: 90 },
    { id: "spices", label: "Spices", days: 365 },
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
    { id: "cupboard", label: "Cupboard" },
    { id: "freezer", label: "Freezer" },
  ],
  presets: [],
  accessibilityTextSize: "default",
};

const TEXT_SIZE_OPTIONS = [
  { id: "default", label: "Default", hint: "Standard size" },
  { id: "large", label: "Large", hint: "Easier to read (+15%)" },
  { id: "extra-large", label: "Extra large", hint: "Maximum size (+30%)" },
];

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
  "canned-goods": "🥫",
  "dried-goods": "🧺",
  spices: "🧂",
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
  "canned-goods": {
    container: "Original packaging",
    location: "Cupboard",
  },
  "dried-goods": {
    container: "Original packaging",
    location: "Cupboard",
  },
  spices: {
    container: "Original packaging",
    location: "Cupboard",
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

const CATEGORY_BUILTIN_SCHEMA_VERSION = "3";

const LEGACY_CONTAINER_MAP = {
  "Square tub": "Square tub (small)",
  "Glass container": "Other",
};

const CONTAINER_SCHEMA_VERSION = "1";

const LEGACY_LOCATION_MAP = {
  "Fiambre drawer": "Top drawer",
};

const LOCATION_SCHEMA_VERSION = "1";

const LOCATION_BUILTIN_SCHEMA_VERSION = "2";

const BATCH_DEFAULT_ROW_COUNT = 3;

const PAGES = {
  home: document.getElementById("page-home"),
  leftovers: document.getElementById("page-leftovers"),
  add: document.getElementById("page-add"),
  "add-groceries": document.getElementById("page-add-groceries"),
  "add-batch": document.getElementById("page-add-batch"),
  "add-photo": document.getElementById("page-add-photo"),
  fridge: document.getElementById("page-fridge"),
  shopping: document.getElementById("page-shopping"),
  search: document.getElementById("page-search"),
  recipe: document.getElementById("page-recipe"),
  settings: document.getElementById("page-settings"),
  "settings-categories": document.getElementById("page-settings-categories"),
  "settings-containers": document.getElementById("page-settings-containers"),
  "settings-locations": document.getElementById("page-settings-locations"),
  "settings-presets": document.getElementById("page-settings-presets"),
  "settings-inventory": document.getElementById("page-settings-inventory"),
  "settings-notifications": document.getElementById("page-settings-notifications"),
  "settings-accessibility": document.getElementById("page-settings-accessibility"),
  "settings-kitchen": document.getElementById("page-settings-kitchen"),
  "settings-backup": document.getElementById("page-settings-backup"),
};

const SETTINGS_DETAIL_PAGES = new Set([
  "settings-categories",
  "settings-containers",
  "settings-locations",
  "settings-presets",
  "settings-inventory",
  "settings-notifications",
  "settings-accessibility",
  "settings-kitchen",
  "settings-backup",
]);

let settings = createDefaultSettings();
let leftovers = [];
let shoppingItems = [];
let fridgeExcludedCategories = new Set();
let inventoryLocationScope = "fridge";
let currentPage = "home";
let returnPage = "leftovers";
let addFormDefaults = null;
let leftoverAddMode = false;
let editingItemId = null;
let revealInventoryAfterEdit = false;
let shoppingPutAwayDraft = null;
let searchSelectedLocations = new Set();
let settingsEdit = { type: null, id: null };
let batchRowCounter = 0;
let pendingPresetAddPhoto = null;
let presetEditPhoto = undefined;

const form = document.getElementById("add-form");
const addBackBtn = document.getElementById("add-back");
const batchAddForm = document.getElementById("batch-add-form");
const batchAddBackBtn = document.getElementById("batch-add-back");
const addPhotoBackBtn = document.getElementById("add-photo-back");
const batchDateInput = document.getElementById("batch-date");
const batchAddRows = document.getElementById("batch-add-rows");
const batchAddRowBtn = document.getElementById("batch-add-row");
const batchAddFromShoppingBtn = document.getElementById("batch-add-from-shopping");
const batchAddSubmitBtn = document.getElementById("batch-add-submit");
const batchAddStatus = document.getElementById("batch-add-status");
const dateInput = document.getElementById("date");
const dateTodayBtn = document.getElementById("date-today");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const quantityInput = document.getElementById("quantity");
const containerInput = document.getElementById("container");
const locationInput = document.getElementById("location");
const eatByPreview = document.getElementById("eat-by-preview");
const addPageTitle = document.getElementById("add-page-title");
const addHeading = document.getElementById("add-heading");
const addSubmitBtn = document.getElementById("add-submit");
const leftoverList = document.getElementById("leftover-list");
const emptyState = document.getElementById("empty-state");
const leftoversAddItemBtn = document.getElementById("leftovers-add-item");
const fridgeByLocation = document.getElementById("fridge-by-location");
const fridgeEmpty = document.getElementById("fridge-empty");
const fridgeSummary = document.getElementById("fridge-summary");
const fridgePageTitle = document.getElementById("fridge-page-title");
const fridgeEmptyIcon = document.getElementById("fridge-empty-icon");
const fridgeEmptyTitle = document.getElementById("fridge-empty-title");
const fridgeAddBatchBtn = document.getElementById("fridge-add-batch");
const fridgeAddItemBtn = document.getElementById("fridge-add-item");
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
const shoppingStatus = document.getElementById("shopping-status");
const shoppingMain = document.getElementById("shopping-main");
const shoppingPutAwayBar = document.getElementById("shopping-put-away-bar");
const shoppingPutAwayCount = document.getElementById("shopping-put-away-count");
const shoppingPutAwayOpenBtn = document.getElementById("shopping-put-away-open");
const shoppingPutAwayPanel = document.getElementById("shopping-put-away");
const shoppingPutAwayList = document.getElementById("shopping-put-away-list");
const shoppingPutAwayCancelBtn = document.getElementById("shopping-put-away-cancel");
const shoppingPutAwayConfirmBtn = document.getElementById("shopping-put-away-confirm");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchLocationChips = document.getElementById("search-location-chips");
const searchLocationsAllBtn = document.getElementById("search-locations-all");
const searchLocationsNoneBtn = document.getElementById("search-locations-none");
const searchStatus = document.getElementById("search-status");
const searchEmpty = document.getElementById("search-empty");
const searchEmptyTitle = document.getElementById("search-empty-title");
const searchEmptyText = document.getElementById("search-empty-text");
const searchResults = document.getElementById("search-results");
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
const presetAddPhotoInput = document.getElementById("preset-add-photo-input");
const presetAddPhotoBtn = document.getElementById("preset-add-photo-btn");
const presetAddPhotoRemoveBtn = document.getElementById("preset-add-photo-remove");
const presetAddPhotoPreview = document.getElementById("preset-add-photo-preview");
const photoAddGrid = document.getElementById("photo-add-grid");
const photoAddEmpty = document.getElementById("photo-add-empty");
const photoAddStatus = document.getElementById("photo-add-status");
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

  applyAccessibilityTextSize();
  dateInput.value = todayString();
  populateDropdowns();
  updateDescriptionDatalist();
  updateEatByPreview();

  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (
        (btn.dataset.page === "add" || btn.dataset.page === "add-batch" || btn.dataset.page === "add-photo") &&
        btn.dataset.return
      ) {
        returnPage = btn.dataset.return;
      }
      navigateTo(btn.dataset.page);
    });
  });

  addBackBtn.addEventListener("click", () => navigateTo(returnPage));
  batchAddBackBtn.addEventListener("click", () => navigateTo(returnPage));
  addPhotoBackBtn?.addEventListener("click", () => navigateTo(returnPage));

  leftoversAddItemBtn.addEventListener("click", openAddItemFromLeftovers);

  form.addEventListener("submit", handleSubmit);
  batchAddForm.addEventListener("submit", handleBatchSubmit);
  batchAddRowBtn.addEventListener("click", () => appendBatchRow());
  batchAddFromShoppingBtn.addEventListener("click", fillBatchRowsFromShoppingList);
  batchDateInput.addEventListener("change", updateBatchAddStatus);
  dateInput.addEventListener("change", updateEatByPreview);
  dateTodayBtn?.addEventListener("click", setAddDateToToday);
  categoryInput.addEventListener("change", handleCategoryChange);
  descriptionInput.addEventListener("input", () => applyPresetForDescription(descriptionInput.value));
  descriptionInput.addEventListener("change", () => applyPresetForDescription(descriptionInput.value));

  shoppingForm.addEventListener("submit", handleShoppingSubmit);
  shoppingExportBtn.addEventListener("click", exportShoppingList);
  shoppingPutAwayOpenBtn?.addEventListener("click", openShoppingPutAway);
  shoppingPutAwayCancelBtn?.addEventListener("click", closeShoppingPutAway);
  shoppingPutAwayConfirmBtn?.addEventListener("click", confirmShoppingPutAway);
  shoppingPutAwayList?.addEventListener("click", handleShoppingPutAwayClick);
  shoppingPutAwayList?.addEventListener("change", handleShoppingPutAwayChange);

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearch();
  });
  searchInput?.addEventListener("input", renderSearch);
  searchLocationsAllBtn?.addEventListener("click", selectAllSearchLocations);
  searchLocationsNoneBtn?.addEventListener("click", clearSearchLocations);
  searchLocationChips?.addEventListener("click", handleSearchLocationChipClick);

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
  presetAddPhotoBtn.addEventListener("click", () => presetAddPhotoInput.click());
  presetAddPhotoInput.addEventListener("change", handlePresetAddPhotoSelected);
  presetAddPhotoRemoveBtn.addEventListener("click", clearPendingPresetAddPhoto);

  exportBackupBtn.addEventListener("click", exportBackup);
  importBackupBtn.addEventListener("click", () => importBackupFile.click());
  importBackupFile.addEventListener("change", handleImportBackup);

  document.querySelectorAll('input[name="accessibility-text-size"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) setAccessibilityTextSize(input.value);
    });
  });

  window.LeftoversNotifications?.bindNotificationsUI();
  window.LeftoversKitchenLink?.bindKitchenLinkUI();
  window.LeftoversRecipe?.bindUI({
    getLeftovers: () => leftovers,
    getShopping: () => shoppingItems,
    getSettings: () => settings,
    addToShoppingList,
    onShoppingUpdated: () => {
      if (currentPage === "shopping") renderShopping();
    },
    escapeHtml,
  });
  navigateTo("home");
}

function normalizeAccessibilityTextSize(value) {
  return TEXT_SIZE_OPTIONS.some((option) => option.id === value) ? value : "default";
}

function getAccessibilityTextSize() {
  return normalizeAccessibilityTextSize(settings.accessibilityTextSize);
}

function applyAccessibilityTextSize() {
  document.documentElement.dataset.textSize = getAccessibilityTextSize();
}

function setAccessibilityTextSize(value) {
  settings.accessibilityTextSize = normalizeAccessibilityTextSize(value);
  saveSettings();
}

function populateAccessibilityForm() {
  const current = getAccessibilityTextSize();
  document.querySelectorAll('input[name="accessibility-text-size"]').forEach((input) => {
    input.checked = input.value === current;
  });
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
    accessibilityTextSize: normalizeAccessibilityTextSize(parsed.accessibilityTextSize),
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

  const { kitchen, legacy, needsReadableKitchenKey } = await window.LeftoversCloud.loadKitchen();

  if (kitchen) {
    applyKitchenFromCloud(kitchen);
    if (kitchen.kitchen_key && kitchen.kitchen_key.length === 8) {
      window.LeftoversCloud.setKitchenKey(kitchen.kitchen_key);
    }
  } else if (legacy) {
    applyLegacyLocalData(legacy);
  }

  runDataMigrations();

  if (needsReadableKitchenKey) {
    window.LeftoversCloud.setKitchenKey(window.LeftoversCloud.generateKitchenKey());
  }

  const needsInitialSave = !kitchen || !kitchen.settings?.categories?.length || needsReadableKitchenKey;
  if (needsInitialSave) {
    await window.LeftoversCloud.saveNow();
  }

  window.LeftoversCloud.clearLegacyLocalData();
}

async function reloadFromCloud(kitchen) {
  applyKitchenFromCloud(kitchen);
  runDataMigrations();
  fridgeExcludedCategories.clear();
  settingsEdit = { type: null, id: null };
  populateDropdowns();
  updateDescriptionDatalist();
  if (currentPage === "leftovers") renderLeftovers();
  if (isInventoryBrowsePage()) renderFridgeOverview();
  if (currentPage === "shopping") renderShopping();
  if (currentPage === "search") renderSearch();
  if (SETTINGS_DETAIL_PAGES.has(currentPage)) renderSettingsPage(currentPage);
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
  leftoverAddMode = true;
  editingItemId = null;
  addFormDefaults = { ...LEFTOVERS_ADD_DEFAULTS };
  navigateTo("add");
}

function openEditItem(id) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  leftoverAddMode = false;
  editingItemId = id;
  returnPage = currentPage;
  revealInventoryAfterEdit = isInventoryBrowsePage();
  navigateTo("add");
}

function updateAddFormChrome() {
  const editing = Boolean(editingItemId);
  const title = editing ? "Edit Item" : "Add To Fridge";
  if (addPageTitle) addPageTitle.textContent = title;
  if (addHeading) addHeading.textContent = title;
  if (addSubmitBtn) addSubmitBtn.textContent = editing ? "Save changes" : "Add to fridge";
  dateTodayBtn?.classList.toggle("hidden", !editing);
}

function setAddDateToToday() {
  dateInput.value = todayString();
  updateEatByPreview();
}

function ensureSelectValue(select, value, label = value) {
  if (!select || !value) return;
  if (![...select.options].some((opt) => opt.value === value)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
  select.value = value;
}

function fillAddFormFromItem(item) {
  dateInput.value = item.dateAdded || todayString();
  ensureSelectValue(categoryInput, item.category, getCategoryLabel(item.category));
  descriptionInput.value = item.description || "";
  ensureSelectValue(quantityInput, String(getItemQuantity(item)));
  ensureSelectValue(containerInput, item.container);
  ensureSelectValue(locationInput, item.location);
  updateEatByPreview();
}

function loadSettings() {
  return normalizeSettings(settings);
}

function saveSettings() {
  applyAccessibilityTextSize();
  populateDropdowns();
  updateDescriptionDatalist();
  if (isInventoryBrowsePage() && leftovers.length > 0) {
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

function containerOptionsHtml(selectedLabel) {
  return settings.containers
    .map(
      (item) =>
        `<option value="${escapeHtml(item.label)}"${item.label === selectedLabel ? " selected" : ""}>${escapeHtml(item.label)}</option>`
    )
    .join("");
}

function quantityOptionsHtml(selectedValue) {
  return Array.from({ length: MAX_ITEM_QUANTITY }, (_, index) => {
    const value = String(index + 1);
    return `<option value="${value}"${value === selectedValue ? " selected" : ""}>${value}</option>`;
  }).join("");
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

function shouldSkipGroceryPreset(preset, categoryId = categoryInput.value) {
  if (editingItemId) return true;
  const keepingCookedStuff = leftoverAddMode || categoryId === "cooked-stuff";
  return keepingCookedStuff && preset.categoryId !== "cooked-stuff";
}

function applyPresetForDescription(text) {
  const preset = findPresetByDescription(text);
  if (!preset) return;
  if (shouldSkipGroceryPreset(preset)) return;

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

function applyCategoryDefaultsToRow(row, categoryId) {
  const defaults = CATEGORY_ADD_DEFAULTS[categoryId];
  if (!defaults) return;

  const containerSelect = row.querySelector(".batch-row__container");
  const locationSelect = row.querySelector(".batch-row__location");

  if (
    defaults.container &&
    containerSelect &&
    settings.containers.some((item) => item.label === defaults.container)
  ) {
    containerSelect.value = defaults.container;
  }
  if (
    defaults.location &&
    locationSelect &&
    settings.locations.some((item) => item.label === defaults.location)
  ) {
    locationSelect.value = defaults.location;
  }
}

function applyPresetToBatchRow(row) {
  const descriptionInputEl = row.querySelector(".batch-row__description");
  const categorySelect = row.querySelector(".batch-row__category");
  const locationSelect = row.querySelector(".batch-row__location");
  const preset = findPresetByDescription(descriptionInputEl.value);
  if (!preset) return;
  if (shouldSkipGroceryPreset(preset, categorySelect.value)) return;

  if (settings.categories.some((cat) => cat.id === preset.categoryId)) {
    categorySelect.value = preset.categoryId;
  }
  applyCategoryDefaultsToRow(row, categorySelect.value);
  if (settings.locations.some((loc) => loc.label === preset.location)) {
    locationSelect.value = preset.location;
  }
}

function getDefaultBatchRowValues() {
  const defaultCategory = settings.categories[0]?.id || "";
  const categoryDefaults = CATEGORY_ADD_DEFAULTS[defaultCategory] || {};
  const defaultContainer =
    categoryDefaults.container && settings.containers.some((item) => item.label === categoryDefaults.container)
      ? categoryDefaults.container
      : settings.containers[0]?.label || "";
  const defaultLocation =
    categoryDefaults.location && settings.locations.some((item) => item.label === categoryDefaults.location)
      ? categoryDefaults.location
      : settings.locations[0]?.label || "";

  return {
    categoryId: defaultCategory,
    container: defaultContainer,
    location: defaultLocation,
  };
}

function createBatchRowElement(values = {}) {
  const defaults = getDefaultBatchRowValues();
  const rowId = ++batchRowCounter;
  const row = document.createElement("div");
  row.className = "batch-row";
  row.dataset.rowId = String(rowId);

  const categoryId = values.categoryId || defaults.categoryId;
  const container = values.container || defaults.container;
  const location = values.location || defaults.location;
  const quantity = values.quantity ? String(values.quantity) : "1";
  const description = values.description || "";

  row.innerHTML = `
    <div class="batch-row__header">
      <span class="batch-row__number">Item ${rowId}</span>
      <button type="button" class="btn btn--ghost btn--small batch-row__remove" aria-label="Remove item">
        Remove
      </button>
    </div>
    <label class="field">
      <span class="field__label">Description</span>
      <input
        type="text"
        class="batch-row__description"
        list="description-presets-datalist"
        placeholder="e.g. Milk, eggs, chicken"
        maxlength="120"
        value="${escapeHtml(description)}"
      />
    </label>
    <div class="form__row">
      <label class="field">
        <span class="field__label">Category</span>
        <select class="batch-row__category">${categoryOptionsHtml(categoryId)}</select>
      </label>
      <label class="field field--narrow">
        <span class="field__label">Qty</span>
        <select class="batch-row__quantity">${quantityOptionsHtml(quantity)}</select>
      </label>
    </div>
    <div class="form__row">
      <label class="field">
        <span class="field__label">Container</span>
        <select class="batch-row__container">${containerOptionsHtml(container)}</select>
      </label>
      <label class="field">
        <span class="field__label">Location</span>
        <select class="batch-row__location">${locationOptionsHtml(location)}</select>
      </label>
    </div>
  `;

  applyCategoryDefaultsToRow(row, categoryId);

  const descriptionInputEl = row.querySelector(".batch-row__description");
  const categorySelect = row.querySelector(".batch-row__category");
  const removeBtn = row.querySelector(".batch-row__remove");

  descriptionInputEl.addEventListener("input", () => {
    applyPresetToBatchRow(row);
    updateBatchAddStatus();
  });
  descriptionInputEl.addEventListener("change", () => {
    applyPresetToBatchRow(row);
    updateBatchAddStatus();
  });
  categorySelect.addEventListener("change", () => {
    applyCategoryDefaultsToRow(row, categorySelect.value);
  });
  removeBtn.addEventListener("click", () => removeBatchRow(row));
  row.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", updateBatchAddStatus);
    input.addEventListener("change", updateBatchAddStatus);
  });

  return row;
}

function appendBatchRow(values = {}, options = {}) {
  const { focus = true } = options;
  const row = createBatchRowElement(values);
  batchAddRows.appendChild(row);
  updateBatchRowNumbers();
  updateBatchAddStatus();
  if (focus && !values.description) {
    row.querySelector(".batch-row__description").focus();
  }
  return row;
}

function removeBatchRow(row) {
  if (batchAddRows.children.length <= 1) {
    clearBatchRow(row);
    updateBatchAddStatus();
    return;
  }

  row.remove();
  updateBatchRowNumbers();
  updateBatchAddStatus();
}

function clearBatchRow(row) {
  row.querySelector(".batch-row__description").value = "";
  row.querySelector(".batch-row__quantity").value = "1";

  const defaults = getDefaultBatchRowValues();
  row.querySelector(".batch-row__category").value = defaults.categoryId;
  row.querySelector(".batch-row__container").value = defaults.container;
  row.querySelector(".batch-row__location").value = defaults.location;
  applyCategoryDefaultsToRow(row, defaults.categoryId);
}

function updateBatchRowNumbers() {
  [...batchAddRows.querySelectorAll(".batch-row")].forEach((row, index) => {
    const label = row.querySelector(".batch-row__number");
    if (label) label.textContent = `Item ${index + 1}`;
  });
}

function resetBatchAddForm() {
  batchRowCounter = 0;
  batchAddRows.innerHTML = "";
  batchDateInput.value = todayString();
  batchAddStatus.textContent = "";

  for (let index = 0; index < BATCH_DEFAULT_ROW_COUNT; index += 1) {
    appendBatchRow({}, { focus: false });
  }

  const firstDescription = batchAddRows.querySelector(".batch-row__description");
  if (firstDescription) firstDescription.focus();
  updateBatchAddStatus();
}

function getFilledBatchRows() {
  return [...batchAddRows.querySelectorAll(".batch-row")].filter((row) =>
    row.querySelector(".batch-row__description").value.trim()
  );
}

function updateBatchAddStatus() {
  const filledRows = getFilledBatchRows();
  const count = filledRows.length;

  batchAddSubmitBtn.disabled = count === 0;
  batchAddSubmitBtn.textContent =
    count === 0 ? "Add to fridge" : count === 1 ? "Add 1 item to fridge" : `Add ${count} items to fridge`;

  if (count === 0) {
    batchAddStatus.textContent = "Fill in at least one description to add items.";
    return;
  }

  const date = batchDateInput.value;
  if (!date) {
    batchAddStatus.textContent = "";
    return;
  }

  batchAddStatus.textContent =
    count === 1
      ? "Ready to add 1 item."
      : `Ready to add ${count} items with date ${formatDisplayDate(date)}.`;
}

function fillBatchRowsFromShoppingList() {
  const unchecked = shoppingItems.filter((item) => !item.checked);
  if (!unchecked.length) {
    batchAddStatus.textContent = "Your shopping list has no unchecked items to fill.";
    return;
  }

  const existingDescriptions = new Set(
    [...batchAddRows.querySelectorAll(".batch-row__description")]
      .map((input) => input.value.trim().toLowerCase())
      .filter(Boolean)
  );

  let added = 0;
  unchecked.forEach((item) => {
    const normalized = item.text.trim().toLowerCase();
    if (!normalized || existingDescriptions.has(normalized)) return;

    appendBatchRow({ description: item.text.trim() }, { focus: false });
    existingDescriptions.add(normalized);
    added += 1;
  });

  batchAddStatus.textContent =
    added === 0
      ? "Those shopping list items are already in the batch form."
      : `Added ${added} item${added === 1 ? "" : "s"} from your shopping list.`;
  updateBatchAddStatus();
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

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    image.src = url;
  });
}

async function compressImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const image = typeof createImageBitmap === "function"
    ? await createImageBitmap(file).then((bitmap) => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, PRESET_PHOTO_MAX_PX / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        return canvas;
      })
    : await loadImageFromFile(file).then((img) => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, PRESET_PHOTO_MAX_PX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
      });

  let quality = PRESET_PHOTO_JPEG_QUALITY;
  let dataUrl = image.toDataURL("image/jpeg", quality);

  while (dataUrl.length > PRESET_PHOTO_MAX_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = image.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > PRESET_PHOTO_MAX_BYTES) {
    throw new Error("Photo is too large. Try cropping closer to the product.");
  }

  return dataUrl;
}

function setPresetPhotoPreview(previewEl, photoDataUrl) {
  if (!previewEl) return;

  if (photoDataUrl) {
    previewEl.classList.remove("preset-photo-preview--empty");
    previewEl.innerHTML = `<img src="${photoDataUrl}" alt="" />`;
    return;
  }

  previewEl.classList.add("preset-photo-preview--empty");
  previewEl.textContent = "No photo";
}

function clearPendingPresetAddPhoto() {
  pendingPresetAddPhoto = null;
  if (presetAddPhotoInput) presetAddPhotoInput.value = "";
  setPresetPhotoPreview(presetAddPhotoPreview, null);
  presetAddPhotoRemoveBtn?.classList.add("hidden");
}

async function handlePresetAddPhotoSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
    pendingPresetAddPhoto = await compressImageFile(file);
    setPresetPhotoPreview(presetAddPhotoPreview, pendingPresetAddPhoto);
    presetAddPhotoRemoveBtn?.classList.remove("hidden");
  } catch (error) {
    clearPendingPresetAddPhoto();
    alert(error.message || "Could not use that photo.");
  }
}

async function handlePresetEditPhotoSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const previewEl = event.target
    .closest(".settings-preset-form")
    ?.querySelector("[data-preset-photo-preview]");
  const removeBtn = event.target
    .closest(".settings-preset-form")
    ?.querySelector("[data-preset-photo-remove]");

  try {
    presetEditPhoto = await compressImageFile(file);
    setPresetPhotoPreview(previewEl, presetEditPhoto);
    removeBtn?.classList.remove("hidden");
  } catch (error) {
    alert(error.message || "Could not use that photo.");
  }
}

function getPresetsWithPhotos() {
  return settings.presets.filter((preset) => preset.photo);
}

function groupPresetsWithPhotosByCategory() {
  const presets = getPresetsWithPhotos();
  const sections = [];
  const knownCategoryIds = new Set(getOrderedCategories().map((category) => category.id));

  getOrderedCategories().forEach((category) => {
    const items = presets.filter((preset) => preset.categoryId === category.id);
    if (items.length) sections.push({ categoryId: category.id, items });
  });

  [...new Set(presets.map((preset) => preset.categoryId).filter((id) => !knownCategoryIds.has(id)))].forEach(
    (categoryId) => {
      sections.push({
        categoryId,
        items: presets.filter((preset) => preset.categoryId === categoryId),
      });
    }
  );

  return sections;
}

function renderPhotoAddTile(preset) {
  return `
    <button type="button" class="photo-add-tile" data-preset-id="${escapeHtml(preset.id)}">
      <span class="photo-add-tile__image-wrap">
        <img src="${preset.photo}" alt="" class="photo-add-tile__image" />
      </span>
      <span class="photo-add-tile__label">${escapeHtml(preset.description)}</span>
      <span class="photo-add-tile__meta">${escapeHtml(preset.location)}</span>
    </button>
  `;
}

function getContainerForCategory(categoryId) {
  const defaults = CATEGORY_ADD_DEFAULTS[categoryId];
  if (defaults?.container && settings.containers.some((item) => item.label === defaults.container)) {
    return defaults.container;
  }
  return settings.containers[0]?.label || "Other";
}

function addLeftoverFromPreset(preset) {
  return addOrIncrementLeftover({
    dateAdded: todayString(),
    description: preset.description,
    quantity: 1,
    category: preset.categoryId,
    container: getContainerForCategory(preset.categoryId),
    location: preset.location,
  });
}

function setPhotoAddStatus(message) {
  if (photoAddStatus) photoAddStatus.textContent = message;
}

function renderPhotoAddPage() {
  const sections = groupPresetsWithPhotosByCategory();

  if (!sections.length) {
    photoAddGrid.innerHTML = "";
    photoAddEmpty?.classList.remove("hidden");
    setPhotoAddStatus("");
    return;
  }

  photoAddEmpty?.classList.add("hidden");
  photoAddGrid.innerHTML = sections
    .map(({ categoryId, items }) => {
      const label = getCategoryLabel(categoryId);
      const icon = getCategoryIcon(categoryId);
      return `
        <section class="photo-add-group" aria-labelledby="photo-add-group-${escapeHtml(categoryId)}">
          <h3 id="photo-add-group-${escapeHtml(categoryId)}" class="photo-add-group__heading">
            <span class="photo-add-group__icon" aria-hidden="true">${icon}</span>
            ${escapeHtml(label)}
          </h3>
          <div class="photo-add-grid">
            ${items.map((preset) => renderPhotoAddTile(preset)).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  photoAddGrid.querySelectorAll(".photo-add-tile").forEach((button) => {
    button.addEventListener("click", () => handlePhotoAddTap(button));
  });
}

function handlePhotoAddTap(button) {
  const preset = settings.presets.find((item) => item.id === button.dataset.presetId);
  if (!preset) return;

  const item = addLeftoverFromPreset(preset);
  if (!item) return;

  saveLeftovers();
  button.classList.add("photo-add-tile--added");
  window.setTimeout(() => button.classList.remove("photo-add-tile--added"), 700);

  const qty = getItemQuantity(item);
  const qtyLabel = qty > 1 ? ` (now ×${qty})` : "";
  setPhotoAddStatus(`${preset.description} added${qtyLabel}.`);
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

function isCupboardLocation(label) {
  if (!label) return false;
  const setting = settings.locations.find((item) => item.label === label);
  if (setting?.id === "cupboard") return true;
  return label.toLowerCase() === "cupboard";
}

function isFridgeLocation(label) {
  return Boolean(label) && !isFreezerLocation(label) && !isCupboardLocation(label);
}

function sortLocationsWithFreezerLast(locations) {
  const cupboard = locations.filter(isCupboardLocation);
  const freezer = locations.filter((loc) => isFreezerLocation(loc) && !isCupboardLocation(loc));
  const rest = locations.filter((loc) => !isFreezerLocation(loc) && !isCupboardLocation(loc));
  return [...rest, ...freezer, ...cupboard];
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

function isInventoryBrowsePage(page = currentPage) {
  return page === "fridge" || page === "cupboard";
}

function getScopedLeftovers() {
  return leftovers.filter((item) => {
    const cupboard = isCupboardLocation(item.location);
    if (inventoryLocationScope === "cupboard") return cupboard;
    return !cupboard;
  });
}

function updateInventoryPageChrome() {
  const isCupboard = inventoryLocationScope === "cupboard";
  if (fridgePageTitle) {
    fridgePageTitle.textContent = isCupboard ? "What's In Our Cupboard?" : "What's In Our Fridge?";
  }
  if (fridgeEmptyIcon) fridgeEmptyIcon.textContent = isCupboard ? "🧺" : "🧊";
  if (fridgeEmptyTitle) {
    fridgeEmptyTitle.textContent = isCupboard ? "Nothing in the cupboard yet" : "Nothing in the fridge yet";
  }
  const returnTarget = isCupboard ? "cupboard" : "fridge";
  if (fridgeAddBatchBtn) fridgeAddBatchBtn.dataset.return = returnTarget;
  if (fridgeAddItemBtn) fridgeAddItemBtn.dataset.return = returnTarget;
}

function navigateTo(page) {
  const fromPage = currentPage;
  currentPage = page;
  if (page !== "add") {
    leftoverAddMode = false;
    editingItemId = null;
    updateAddFormChrome();
  }
  if (page !== "shopping") {
    shoppingPutAwayDraft = null;
  }

  Object.entries(PAGES).forEach(([name, el]) => {
    const show = name === page || (page === "cupboard" && name === "fridge");
    el.classList.toggle("hidden", !show);
  });

  if (page === "leftovers") renderLeftovers();
  if (page === "fridge") {
    inventoryLocationScope = "fridge";
    if (revealInventoryAfterEdit) {
      revealInventoryAfterEdit = false;
      showAllFridgeCategories();
    } else {
      hideAllFridgeCategories();
    }
    updateInventoryPageChrome();
    renderFridgeOverview();
  }
  if (page === "cupboard") {
    inventoryLocationScope = "cupboard";
    if (revealInventoryAfterEdit) {
      revealInventoryAfterEdit = false;
      showAllFridgeCategories();
    } else {
      hideAllFridgeCategories();
    }
    updateInventoryPageChrome();
    renderFridgeOverview();
  }
  if (page === "shopping") renderShopping();
  if (page === "search") {
    if (fromPage === "add") {
      renderSearchLocationChips();
      renderSearch();
    } else {
      openSearchPage();
    }
  }
  if (SETTINGS_DETAIL_PAGES.has(page)) renderSettingsPage(page);
  if (page === "add") {
    populateDropdowns();
    updateDescriptionDatalist();
    const item = editingItemId ? leftovers.find((entry) => entry.id === editingItemId) : null;
    if (item) {
      fillAddFormFromItem(item);
      updateAddFormChrome();
      descriptionInput.focus();
    } else {
      editingItemId = null;
      updateAddFormChrome();
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
  if (page === "add-batch") {
    populateDropdowns();
    updateDescriptionDatalist();
    resetBatchAddForm();
  }
  if (page === "add-photo") {
    renderPhotoAddPage();
  }
  if (page === "recipe") {
    window.LeftoversRecipe?.resetPage();
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
  if (isInventoryBrowsePage()) renderFridgeOverview();
  if (currentPage === "shopping") renderShopping();
  if (currentPage === "search") renderSearch();
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

function createLeftoverItem({ dateAdded, description, quantity, category, container, location }) {
  const trimmedDescription = description.trim();
  if (!trimmedDescription) return null;

  return {
    id: crypto.randomUUID(),
    dateAdded,
    description: trimmedDescription,
    quantity: Math.max(1, Math.min(MAX_ITEM_QUANTITY, Number(quantity) || 1)),
    category,
    container,
    location,
    eatBy: addDays(dateAdded, getCategoryDays(category)),
  };
}

function normalizeDescription(description) {
  return String(description || "").trim().toLowerCase();
}

function findMatchingLeftover({ description, category, location }) {
  const normalized = normalizeDescription(description);
  const categoryId = String(category || "").trim();
  const locationLabel = String(location || "").trim();
  if (!normalized || !categoryId || !locationLabel) return null;
  return leftovers.find((item) => {
    return (
      normalizeDescription(item.description) === normalized &&
      item.category === categoryId &&
      String(item.location || "").trim() === locationLabel
    );
  }) || null;
}

function addOrIncrementLeftover(itemData) {
  const trimmedDescription = itemData.description.trim();
  if (!trimmedDescription) return null;

  const existing = findMatchingLeftover({
    description: trimmedDescription,
    category: itemData.category,
    location: itemData.location,
  });
  const addQty = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Number(itemData.quantity) || 1));

  if (existing) {
    existing.quantity = Math.min(MAX_ITEM_QUANTITY, getItemQuantity(existing) + addQty);
    return existing;
  }

  const item = createLeftoverItem({ ...itemData, description: trimmedDescription });
  if (!item) return null;

  leftovers.unshift(item);
  return item;
}

function updateLeftoverItem(id, itemData) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return null;

  const trimmedDescription = String(itemData.description || "").trim();
  if (!trimmedDescription || !itemData.dateAdded || !itemData.category) return null;

  item.dateAdded = itemData.dateAdded;
  item.description = trimmedDescription;
  item.quantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Number(itemData.quantity) || 1));
  item.category = itemData.category;
  item.container = itemData.container;
  item.location = itemData.location;
  item.eatBy = addDays(itemData.dateAdded, getCategoryDays(itemData.category));
  return item;
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    dateAdded: dateInput.value,
    description: descriptionInput.value,
    quantity: quantityInput.value,
    category: leftoverAddMode ? "cooked-stuff" : categoryInput.value,
    container: containerInput.value,
    location: locationInput.value,
  };

  const item = editingItemId
    ? updateLeftoverItem(editingItemId, formData)
    : addOrIncrementLeftover(formData);

  if (!item) return;

  saveLeftovers();

  editingItemId = null;
  leftoverAddMode = false;
  descriptionInput.value = "";
  quantityInput.value = "1";
  containerInput.selectedIndex = 0;
  locationInput.selectedIndex = 0;
  dateInput.value = todayString();
  updateEatByPreview();
  updateAddFormChrome();
  navigateTo(returnPage);
}

function handleBatchSubmit(event) {
  event.preventDefault();

  const dateAdded = batchDateInput.value;
  if (!dateAdded) return;

  const added = getFilledBatchRows()
    .map((row) =>
      addOrIncrementLeftover({
        dateAdded,
        description: row.querySelector(".batch-row__description").value,
        quantity: row.querySelector(".batch-row__quantity").value,
        category: row.querySelector(".batch-row__category").value,
        container: row.querySelector(".batch-row__container").value,
        location: row.querySelector(".batch-row__location").value,
      })
    )
    .filter(Boolean);

  if (!added.length) {
    updateBatchAddStatus();
    return;
  }

  saveLeftovers();
  navigateTo(returnPage);
}

function refreshLeftoverViews() {
  if (currentPage === "leftovers") renderLeftovers();
  if (isInventoryBrowsePage()) renderFridgeOverview();
  if (currentPage === "search") renderSearch();
  if (currentPage === "settings-inventory") renderInventory();
}

function removeLeftover(id) {
  leftovers = leftovers.filter((item) => item.id !== id);
  saveLeftovers();
  refreshLeftoverViews();
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
  refreshLeftoverViews();
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
  refreshLeftoverViews();
}

function increaseLeftoverQuantity(id) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item) return;

  const nextQty = Math.min(getItemQuantity(item) + 1, MAX_ITEM_QUANTITY);
  if (nextQty === getItemQuantity(item)) return;

  item.quantity = nextQty;
  saveLeftovers();
  refreshLeftoverViews();
}

function relocateLeftover(id, newLocation) {
  const item = leftovers.find((entry) => entry.id === id);
  if (!item || item.location === newLocation) return;
  item.location = newLocation;
  saveLeftovers();
  refreshLeftoverViews();
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

function locationItemHtml(item, locationFallback, { showLocation = false } = {}) {
  const status = getStatus(item.eatBy);
  const location = item.location || locationFallback || "";
  const locationHint = showLocation && location
    ? ` <span class="location-item__place">${escapeHtml(location)}</span>`
    : "";
  return `
    <li class="location-item location-item--${status}" data-id="${escapeHtml(item.id)}">
      <details class="location-item__details">
        <summary class="location-item__summary">
          <span class="location-item__name">${formatFridgeItemLabel(item)}${locationHint}</span>
          <span class="location-item__chevron" aria-hidden="true">▼</span>
        </summary>
        <div class="location-item__body">
          <span class="location-item__detail">${escapeHtml(item.container)} · eat by ${formatDisplayDate(item.eatBy)} (${getItemQuantity(item)})</span>
          <label class="location-item__move">
            <span class="location-item__move-label">Move to</span>
            ${locationSelectHtml(item.id, location, "location-item__select")}
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
              class="btn btn--ghost btn--icon location-item__edit"
              data-id="${item.id}"
              aria-label="Edit ${escapeHtml(item.description)}"
            >
              <span aria-hidden="true">✏️</span>
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
}

function bindLocationItemActions(container) {
  if (!container) return;
  bindLocationSelects(container, ".location-item__select");
  container.querySelectorAll(".location-item__reduce").forEach((btn) => {
    btn.addEventListener("click", () => reduceLeftoverQuantity(btn.dataset.id));
  });
  container.querySelectorAll(".location-item__increase").forEach((btn) => {
    btn.addEventListener("click", () => increaseLeftoverQuantity(btn.dataset.id));
  });
  container.querySelectorAll(".location-item__edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditItem(btn.dataset.id));
  });
  container.querySelectorAll(".location-item__shopping").forEach((btn) => {
    btn.addEventListener("click", () => addLeftoverToShoppingList(btn.dataset.id));
  });
  container.querySelectorAll(".location-item__delete").forEach((btn) => {
    btn.addEventListener("click", () => removeLeftover(btn.dataset.id));
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
          <div class="card__actions">
            <button
              type="button"
              class="btn btn--ghost btn--icon card__reduce"
              data-id="${item.id}"
              aria-label="Reduce ${escapeHtml(item.description)} quantity by 1"
            >
              <span aria-hidden="true">➖</span>
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--icon card__edit"
              data-id="${item.id}"
              aria-label="Edit ${escapeHtml(item.description)}"
            >
              <span aria-hidden="true">✏️</span>
            </button>
          </div>
        </li>
      `;
    })
    .join("");

  leftoverList.querySelectorAll(".card__reduce").forEach((btn) => {
    btn.addEventListener("click", () => reduceLeftoverQuantity(btn.dataset.id));
  });

  leftoverList.querySelectorAll(".card__edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditItem(btn.dataset.id));
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
  return getScopedLeftovers().filter((item) => {
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
  updateInventoryPageChrome();

  const scoped = getScopedLeftovers();
  if (scoped.length === 0) {
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
  fridgeSummary.textContent = `${visible.length} of ${scoped.length} item${scoped.length === 1 ? "" : "s"} shown`;

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
            ${items.map((item) => locationItemHtml(item, location)).join("")}
          </ul>
        </section>
      `;
    })
    .join("");

  bindLocationItemActions(fridgeByLocation);
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
  if (page === "settings-accessibility") populateAccessibilityForm();
  if (page === "settings-kitchen") window.LeftoversKitchenLink?.populateKitchenLinkForm();
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
      const photoPreview = item.photo
        ? `<img src="${item.photo}" alt="" />`
        : `<span class="settings-item__photo-placeholder" aria-hidden="true">📷</span>`;

      if (isEditing) {
        const editPhoto = presetEditPhoto === undefined ? item.photo : presetEditPhoto;
        return `
          <li class="settings-item settings-item--editing settings-item--preset">
            <form class="settings-edit-form settings-preset-form" data-setting-type="presets" data-item-id="${item.id}">
              <div class="preset-photo-control preset-photo-control--edit">
                <div class="preset-photo-preview${editPhoto ? "" : " preset-photo-preview--empty"}" data-preset-photo-preview aria-hidden="true">
                  ${editPhoto ? `<img src="${editPhoto}" alt="" />` : "No photo"}
                </div>
                <div class="preset-photo-control__actions">
                  <input
                    type="file"
                    class="hidden preset-edit-photo-input"
                    accept="image/*"
                    aria-label="Choose product photo"
                  />
                  <button type="button" class="btn btn--ghost btn--small" data-preset-photo-choose>Choose photo</button>
                  <button type="button" class="btn btn--ghost btn--small${editPhoto ? "" : " hidden"}" data-preset-photo-remove>Remove</button>
                </div>
              </div>
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
        <li class="settings-item settings-item--preset">
          <div class="settings-item__photo">${photoPreview}</div>
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
      presetEditPhoto = undefined;
      settingsEdit = { type: null, id: null };
      renderCurrentSettingsPage();
    });

    const photoInput = editForm.querySelector(".preset-edit-photo-input");
    const chooseBtn = editForm.querySelector("[data-preset-photo-choose]");
    const removeBtn = editForm.querySelector("[data-preset-photo-remove]");
    const previewEl = editForm.querySelector("[data-preset-photo-preview]");

    chooseBtn?.addEventListener("click", () => photoInput?.click());
    photoInput?.addEventListener("change", handlePresetEditPhotoSelected);
    removeBtn?.addEventListener("click", () => {
      presetEditPhoto = null;
      setPresetPhotoPreview(previewEl, null);
      removeBtn.classList.add("hidden");
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
    ...(pendingPresetAddPhoto ? { photo: pendingPresetAddPhoto } : {}),
  });

  saveSettings();
  formEl.reset();
  clearPendingPresetAddPhoto();
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
    if (type === "presets") presetEditPhoto = undefined;
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

    if (presetEditPhoto === null) {
      delete item.photo;
    } else if (typeof presetEditPhoto === "string") {
      item.photo = presetEditPhoto;
    }
    presetEditPhoto = undefined;

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
  setShoppingStatus("");
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

function setShoppingStatus(message) {
  if (shoppingStatus) shoppingStatus.textContent = message || "";
}

function getCheckedShoppingItems() {
  return shoppingItems.filter((item) => item.checked);
}

function getLocationLabelById(id) {
  return settings.locations.find((loc) => loc.id === id)?.label || null;
}

function firstLocationMatching(predicate, preferredId) {
  const preferred = preferredId ? getLocationLabelById(preferredId) : null;
  if (preferred && predicate(preferred)) return preferred;
  return settings.locations.find((loc) => predicate(loc.label))?.label || settings.locations[0]?.label || "";
}

function destinationFromLocation(location) {
  if (isCupboardLocation(location)) return "cupboard";
  if (isFreezerLocation(location)) return "freezer";
  return "fridge";
}

function defaultLocationForCategory(categoryId) {
  const location = CATEGORY_ADD_DEFAULTS[categoryId]?.location;
  if (location && settings.locations.some((loc) => loc.label === location)) return location;
  return null;
}

function defaultCategoryId() {
  return settings.categories.find((cat) => cat.id === "other")?.id || settings.categories[0]?.id || "";
}

function findPutAwayRow(shoppingId) {
  return shoppingPutAwayDraft?.find((row) => row.shoppingId === shoppingId) || null;
}

function buildShoppingPutAwayDraft() {
  return getCheckedShoppingItems().map((item) => {
    const preset = findPresetByDescription(item.text);
    const hasPreset = Boolean(preset && settings.categories.some((cat) => cat.id === preset.categoryId));
    const categoryId = hasPreset ? preset.categoryId : defaultCategoryId();
    const presetLocation =
      hasPreset && preset.location && settings.locations.some((loc) => loc.label === preset.location)
        ? preset.location
        : null;
    const inferredLocation = presetLocation || defaultLocationForCategory(categoryId);

    return {
      shoppingId: item.id,
      text: item.text,
      quantity: 1,
      categoryId,
      hasPreset,
      presetLocation,
      destination: destinationFromLocation(inferredLocation),
    };
  });
}

function getPutAwayContainer(categoryId) {
  const defaults = CATEGORY_ADD_DEFAULTS[categoryId];
  if (defaults?.container && settings.containers.some((item) => item.label === defaults.container)) {
    return defaults.container;
  }
  if (settings.containers.some((item) => item.label === "Original packaging")) {
    return "Original packaging";
  }
  return settings.containers[0]?.label || "Other";
}

function resolvePutAwayLocation(row) {
  if (row.destination === "cupboard") {
    if (row.presetLocation && isCupboardLocation(row.presetLocation)) return row.presetLocation;
    return firstLocationMatching(isCupboardLocation, "cupboard");
  }

  if (row.destination === "freezer") {
    if (row.presetLocation && isFreezerLocation(row.presetLocation) && !isCupboardLocation(row.presetLocation)) {
      return row.presetLocation;
    }
    return firstLocationMatching(
      (label) => isFreezerLocation(label) && !isCupboardLocation(label),
      "freezer"
    );
  }

  if (row.presetLocation && isFridgeLocation(row.presetLocation)) return row.presetLocation;
  const categoryLocation = defaultLocationForCategory(row.categoryId);
  if (categoryLocation && isFridgeLocation(categoryLocation)) return categoryLocation;
  return firstLocationMatching(isFridgeLocation, "middle-shelf");
}

function isShoppingPutAwayOpen() {
  return Array.isArray(shoppingPutAwayDraft);
}

function updateShoppingPutAwayBar() {
  const checkedCount = getCheckedShoppingItems().length;
  const showBar = !isShoppingPutAwayOpen() && checkedCount > 0;
  shoppingPutAwayBar?.classList.toggle("hidden", !showBar);
  if (shoppingPutAwayCount) {
    shoppingPutAwayCount.textContent = checkedCount === 1 ? "1 purchased" : `${checkedCount} purchased`;
  }
}

function updateShoppingPutAwayView() {
  const open = isShoppingPutAwayOpen();
  shoppingMain?.classList.toggle("hidden", open);
  shoppingPutAwayPanel?.classList.toggle("hidden", !open);
  if (open) renderShoppingPutAwayList();
}

function openShoppingPutAway() {
  const draft = buildShoppingPutAwayDraft();
  if (!draft.length) return;
  shoppingPutAwayDraft = draft;
  setShoppingStatus("");
  updateShoppingPutAwayView();
  updateShoppingPutAwayBar();
}

function closeShoppingPutAway() {
  shoppingPutAwayDraft = null;
  updateShoppingPutAwayView();
  updateShoppingPutAwayBar();
}

function renderShoppingPutAwayList() {
  if (!shoppingPutAwayList || !shoppingPutAwayDraft) return;

  const destOptions = [
    { id: "fridge", label: "Fridge" },
    { id: "freezer", label: "Freezer" },
    { id: "cupboard", label: "Cupboard" },
  ];

  shoppingPutAwayList.innerHTML = shoppingPutAwayDraft
    .map((row) => {
      const name = escapeHtml(row.text);
      return `
        <li class="shopping-put-away-item">
          <h3 class="shopping-put-away-item__name">${name}</h3>
          <div class="shopping-put-away-item__qty">
            <span class="field__label">Quantity</span>
            <div class="shopping-put-away-item__qty-controls">
              <button
                type="button"
                class="btn btn--ghost btn--icon"
                data-put-away-qty="-1"
                data-id="${row.shoppingId}"
                aria-label="Decrease quantity of ${name}"
                ${row.quantity <= 1 ? "disabled" : ""}
              >
                <span aria-hidden="true">➖</span>
              </button>
              <span class="shopping-put-away-item__qty-value" aria-live="polite">${row.quantity}</span>
              <button
                type="button"
                class="btn btn--ghost btn--icon"
                data-put-away-qty="1"
                data-id="${row.shoppingId}"
                aria-label="Increase quantity of ${name}"
                ${row.quantity >= MAX_ITEM_QUANTITY ? "disabled" : ""}
              >
                <span aria-hidden="true">➕</span>
              </button>
            </div>
          </div>
          <div class="shopping-put-away-item__dest" role="group" aria-label="Where to put ${name}">
            ${destOptions
              .map(
                (dest) => `
                  <button
                    type="button"
                    class="shopping-put-away-dest${row.destination === dest.id ? " shopping-put-away-dest--active" : ""}"
                    data-put-away-dest="${dest.id}"
                    data-id="${row.shoppingId}"
                    aria-pressed="${row.destination === dest.id}"
                  >
                    ${dest.label}
                  </button>
                `
              )
              .join("")}
          </div>
          ${
            row.hasPreset
              ? ""
              : `
                <label class="field">
                  <span class="field__label">Category</span>
                  <select data-put-away-category data-id="${row.shoppingId}">
                    ${categoryOptionsHtml(row.categoryId)}
                  </select>
                </label>
              `
          }
        </li>
      `;
    })
    .join("");
}

function handleShoppingPutAwayClick(event) {
  const destBtn = event.target.closest("[data-put-away-dest]");
  if (destBtn) {
    const row = findPutAwayRow(destBtn.dataset.id);
    if (!row) return;
    row.destination = destBtn.dataset.putAwayDest;
    renderShoppingPutAwayList();
    return;
  }

  const qtyBtn = event.target.closest("[data-put-away-qty]");
  if (!qtyBtn || qtyBtn.disabled) return;
  const row = findPutAwayRow(qtyBtn.dataset.id);
  if (!row) return;
  const nextQty = row.quantity + Number(qtyBtn.dataset.putAwayQty);
  row.quantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, nextQty));
  renderShoppingPutAwayList();
}

function handleShoppingPutAwayChange(event) {
  const select = event.target.closest("[data-put-away-category]");
  if (!select) return;
  const row = findPutAwayRow(select.dataset.id);
  if (!row) return;
  row.categoryId = select.value;
  row.destination = destinationFromLocation(defaultLocationForCategory(row.categoryId));
  renderShoppingPutAwayList();
}

function confirmShoppingPutAway() {
  if (!shoppingPutAwayDraft?.length) return;

  const idsToRemove = new Set();
  let addedCount = 0;

  shoppingPutAwayDraft.forEach((row) => {
    if (!shoppingItems.some((item) => item.id === row.shoppingId)) return;
    if (!row.categoryId) return;

    const item = addOrIncrementLeftover({
      dateAdded: todayString(),
      description: row.text,
      quantity: row.quantity,
      category: row.categoryId,
      container: getPutAwayContainer(row.categoryId),
      location: resolvePutAwayLocation(row),
    });
    if (!item) return;

    idsToRemove.add(row.shoppingId);
    addedCount += 1;
  });

  if (!addedCount) return;

  shoppingItems = shoppingItems.filter((item) => !idsToRemove.has(item.id));
  shoppingPutAwayDraft = null;
  saveLeftovers();
  saveShopping();
  setShoppingStatus(addedCount === 1 ? "Added 1 item to the kitchen." : `Added ${addedCount} items to the kitchen.`);
  renderShopping();
}

function renderShopping() {
  if (shoppingPutAwayDraft) {
    shoppingPutAwayDraft = shoppingPutAwayDraft.filter((row) =>
      shoppingItems.some((item) => item.id === row.shoppingId)
    );
    if (!shoppingPutAwayDraft.length) shoppingPutAwayDraft = null;
  }

  const hasItems = shoppingItems.length > 0;
  shoppingEmpty.classList.toggle("hidden", hasItems);
  shoppingList.classList.toggle("hidden", !hasItems);
  shoppingExportBtn.disabled = !hasItems;

  if (!hasItems) {
    shoppingList.innerHTML = "";
  } else {
    shoppingList.innerHTML = shoppingItems
      .map(
        (item) => `
        <li class="shopping-item ${item.checked ? "shopping-item--checked" : ""}">
          <label class="shopping-item__label">
            <input type="checkbox" data-id="${item.id}" ${item.checked ? "checked" : ""} />
            <span>${escapeHtml(item.text)}</span>
          </label>
          <button type="button" class="btn btn--ghost btn--icon shopping-item__remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.text)}">
            <span aria-hidden="true">🗑️</span>
          </button>
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

  updateShoppingPutAwayView();
  updateShoppingPutAwayBar();
}

function getSearchLocationLabels() {
  return getOrderedLocationLabels();
}

function selectAllSearchLocations() {
  searchSelectedLocations = new Set(getSearchLocationLabels());
  renderSearchLocationChips();
  renderSearch();
}

function clearSearchLocations() {
  searchSelectedLocations = new Set();
  renderSearchLocationChips();
  renderSearch();
}

function handleSearchLocationChipClick(event) {
  const btn = event.target.closest("[data-search-location]");
  if (!btn) return;
  const location = btn.dataset.searchLocation;
  if (searchSelectedLocations.has(location)) {
    searchSelectedLocations.delete(location);
  } else {
    searchSelectedLocations.add(location);
  }
  renderSearchLocationChips();
  renderSearch();
}

function renderSearchLocationChips() {
  if (!searchLocationChips) return;
  const labels = getSearchLocationLabels();
  searchLocationChips.innerHTML = labels
    .map((label) => {
      const selected = searchSelectedLocations.has(label);
      return `
        <button
          type="button"
          class="search-location-chip${selected ? " search-location-chip--active" : ""}"
          data-search-location="${escapeHtml(label)}"
          aria-pressed="${selected}"
        >
          ${escapeHtml(label)}
        </button>
      `;
    })
    .join("");
}

function getSearchMatches() {
  const query = normalizeDescription(searchInput?.value);
  if (!query || searchSelectedLocations.size === 0) return [];
  return leftovers
    .filter((item) => {
      if (!searchSelectedLocations.has(item.location)) return false;
      return normalizeDescription(item.description).includes(query);
    })
    .sort((a, b) => {
      const loc = String(a.location || "").localeCompare(String(b.location || ""));
      if (loc) return loc;
      return normalizeDescription(a.description).localeCompare(normalizeDescription(b.description));
    });
}

function openSearchPage() {
  searchSelectedLocations = new Set(getSearchLocationLabels());
  if (searchInput) searchInput.value = "";
  renderSearchLocationChips();
  renderSearch();
  searchInput?.focus();
}

function renderSearch() {
  if (!searchResults || !searchEmpty) return;

  const query = normalizeDescription(searchInput?.value);
  const hasLocations = searchSelectedLocations.size > 0;
  const matches = getSearchMatches();
  const showResults = Boolean(query) && hasLocations && matches.length > 0;
  const openIds = new Set(
    [...searchResults.querySelectorAll(".location-item__details[open]")]
      .map((el) => el.closest("[data-id]")?.dataset.id)
      .filter(Boolean)
  );

  if (!hasLocations) {
    if (searchEmptyTitle) searchEmptyTitle.textContent = "Choose a location";
    if (searchEmptyText) searchEmptyText.textContent = "Select one or more locations to search in.";
  } else if (!query) {
    if (searchEmptyTitle) searchEmptyTitle.textContent = "Type a name to search";
    if (searchEmptyText) searchEmptyText.textContent = "Choose one or more locations, then enter an item.";
  } else {
    if (searchEmptyTitle) searchEmptyTitle.textContent = "No matching items";
    if (searchEmptyText) searchEmptyText.textContent = "Try a different name or include more locations.";
  }

  searchEmpty.classList.toggle("hidden", showResults);
  searchResults.classList.toggle("hidden", !showResults);

  if (searchStatus) {
    if (!query || !hasLocations) {
      searchStatus.textContent = "";
    } else if (matches.length === 1) {
      searchStatus.textContent = "1 match";
    } else {
      searchStatus.textContent = `${matches.length} matches`;
    }
  }

  if (!showResults) {
    searchResults.innerHTML = "";
    return;
  }

  searchResults.innerHTML = matches
    .map((item) => locationItemHtml(item, item.location, { showLocation: true }))
    .join("");
  bindLocationItemActions(searchResults);
  searchResults.querySelectorAll(".location-item").forEach((li) => {
    if (openIds.has(li.dataset.id)) {
      li.querySelector(".location-item__details")?.setAttribute("open", "");
    }
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
  reloadFromCloud,
};

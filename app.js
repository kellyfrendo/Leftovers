const STORAGE_KEY = "leftovers-fridge";
const SHOPPING_STORAGE_KEY = "leftovers-shopping";
const SETTINGS_STORAGE_KEY = "leftovers-settings";

const DEFAULT_SETTINGS = {
  categories: [
    { id: "fruit", label: "Fruit", days: 5 },
    { id: "vegetables", label: "Vegetables", days: 5 },
    { id: "meat-chicken", label: "Meat and chicken", days: 3 },
    { id: "fish-seafood", label: "Fish and seafood", days: 2 },
    { id: "dairy", label: "Dairy", days: 5 },
    { id: "condiments", label: "Condiments", days: 14 },
    { id: "cooked-stuff", label: "Cooked stuff", days: 4 },
    { id: "drinks", label: "Drinks", days: 5 },
    { id: "other", label: "Other", days: 4 },
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

const LEFTOVERS_ADD_DEFAULTS = {
  categoryId: "cooked-stuff",
  location: "Middle shelf",
};

const LEGACY_CATEGORY_MAP = {
  "cooked-meal": "cooked-stuff",
  "meat-poultry": "meat-chicken",
  "soup-stew": "cooked-stuff",
  "seafood": "fish-seafood",
};

const CATEGORY_SCHEMA_VERSION = "2";
const CATEGORY_SCHEMA_KEY = "leftovers-category-schema";

const LEGACY_CONTAINER_MAP = {
  "Square tub": "Square tub (small)",
  "Glass container": "Other",
};

const CONTAINER_SCHEMA_VERSION = "1";
const CONTAINER_SCHEMA_KEY = "leftovers-container-schema";

const LEGACY_LOCATION_MAP = {
  "Fiambre drawer": "Top drawer",
};

const LOCATION_SCHEMA_VERSION = "1";
const LOCATION_SCHEMA_KEY = "leftovers-location-schema";

const PAGES = {
  home: document.getElementById("page-home"),
  leftovers: document.getElementById("page-leftovers"),
  add: document.getElementById("page-add"),
  fridge: document.getElementById("page-fridge"),
  shopping: document.getElementById("page-shopping"),
  settings: document.getElementById("page-settings"),
};

let settings = loadSettings();
let leftovers = loadLeftovers();
let shoppingItems = loadShopping();
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

const SETTINGS_LISTS = {
  categories: document.getElementById("settings-categories-list"),
  containers: document.getElementById("settings-containers-list"),
  locations: document.getElementById("settings-locations-list"),
  presets: document.getElementById("settings-presets-list"),
};

const settingsPresetsAddForm = document.getElementById("settings-presets-add");
const descriptionPresetsDatalist = document.getElementById("description-presets-datalist");

init();

function init() {
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
  categoryInput.addEventListener("change", updateEatByPreview);
  descriptionInput.addEventListener("input", () => applyPresetForDescription(descriptionInput.value));
  descriptionInput.addEventListener("change", () => applyPresetForDescription(descriptionInput.value));

  shoppingForm.addEventListener("submit", handleShoppingSubmit);

  fridgeShowAllBtn.addEventListener("click", () => {
    fridgeExcludedCategories.clear();
    renderFridgeOverview();
  });

  fridgeHideAllBtn.addEventListener("click", () => {
    settings.categories.forEach((cat) => fridgeExcludedCategories.add(cat.id));
    renderFridgeOverview();
  });

  document.querySelectorAll(".settings-add-form").forEach((addForm) => {
    addForm.addEventListener("submit", handleSettingsAdd);
  });

  settingsPresetsAddForm.addEventListener("submit", handlePresetAdd);

  migrateCategorySchema();
  migrateContainerSchema();
  migrateLocationSchema();
  navigateTo("home");
}

function migrateLocationSchema() {
  if (localStorage.getItem(LOCATION_SCHEMA_KEY) === LOCATION_SCHEMA_VERSION) return;

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
  localStorage.setItem(LOCATION_SCHEMA_KEY, LOCATION_SCHEMA_VERSION);
}

function migrateContainerSchema() {
  if (localStorage.getItem(CONTAINER_SCHEMA_KEY) === CONTAINER_SCHEMA_VERSION) return;

  settings.containers = structuredClone(DEFAULT_SETTINGS.containers);

  leftovers.forEach((item) => {
    const mapped = LEGACY_CONTAINER_MAP[item.container];
    if (mapped) item.container = mapped;
  });

  saveSettings();
  saveLeftovers();
  localStorage.setItem(CONTAINER_SCHEMA_KEY, CONTAINER_SCHEMA_VERSION);
}

function migrateCategorySchema() {
  if (localStorage.getItem(CATEGORY_SCHEMA_KEY) === CATEGORY_SCHEMA_VERSION) return;

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
  localStorage.setItem(CATEGORY_SCHEMA_KEY, CATEGORY_SCHEMA_VERSION);
}

function openAddItemFromLeftovers() {
  returnPage = "leftovers";
  addFormDefaults = { ...LEFTOVERS_ADD_DEFAULTS };
  navigateTo("add");
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    const categories = parsed.categories?.length
      ? parsed.categories
      : structuredClone(DEFAULT_SETTINGS.categories);
    const result = {
      categories,
      containers: parsed.containers?.length ? parsed.containers : structuredClone(DEFAULT_SETTINGS.containers),
      locations: parsed.locations?.length ? parsed.locations : structuredClone(DEFAULT_SETTINGS.locations),
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
    };
    return result;
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  populateDropdowns();
  updateDescriptionDatalist();
}

function categoryOptionsHtml(selectedId) {
  return settings.categories
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
  if (settings.locations.some((loc) => loc.label === preset.location)) {
    locationInput.value = preset.location;
  }
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

function getCategoryDays(id) {
  return getCategoryById(id)?.days ?? 4;
}

function getLocationLabels() {
  return settings.locations.map((item) => item.label);
}

function getOrderedLocationLabels() {
  const labels = getLocationLabels();
  const extras = [...new Set(leftovers.map((item) => item.location).filter((loc) => loc && !labels.includes(loc)))];
  return [...labels, ...extras];
}

function populateDropdowns() {
  fillSelect(categoryInput, settings.categories, (item) => item.id, (item) => item.label);
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
  if (page === "fridge") renderFridgeOverview();
  if (page === "shopping") renderShopping();
  if (page === "settings") renderSettings();
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
    updateEatByPreview();
    descriptionInput.focus();
  }
}

function loadLeftovers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLeftovers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leftovers));
}

function loadShopping() {
  try {
    const raw = localStorage.getItem(SHOPPING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveShopping() {
  localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(shoppingItems));
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

  const nextQty = Math.min(getItemQuantity(item) + 1, 10);
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
            class="btn btn--ghost card__reduce"
            data-id="${item.id}"
            aria-label="Reduce ${escapeHtml(item.description)} quantity by 1"
          >
            −1
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

function getFridgeVisibleLeftovers() {
  return leftovers.filter((item) => {
    const known = settings.categories.some((cat) => cat.id === item.category);
    if (!known) return true;
    return !fridgeExcludedCategories.has(item.category);
  });
}

function renderFridgeCategoryFilters() {
  fridgeCategoryFilters.innerHTML = settings.categories
    .map((cat) => {
      const included = !fridgeExcludedCategories.has(cat.id);
      return `
        <button
          type="button"
          class="filter-btn ${included ? "filter-btn--active" : ""}"
          data-category="${cat.id}"
          aria-pressed="${included}"
        >
          ${escapeHtml(cat.label)}
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
  const allExcluded = fridgeExcludedCategories.size >= settings.categories.length;
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
                            class="btn btn--ghost location-item__reduce"
                            data-id="${item.id}"
                            aria-label="Reduce ${escapeHtml(item.description)} quantity by 1"
                          >
                            −1
                          </button>
                          <button
                            type="button"
                            class="btn btn--ghost location-item__increase"
                            data-id="${item.id}"
                            aria-label="Increase ${escapeHtml(item.description)} quantity by 1"
                            ${getItemQuantity(item) >= 10 ? "disabled" : ""}
                          >
                            +1
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
}

function renderSettings() {
  renderSettingsList("categories");
  renderSettingsList("containers");
  renderSettingsList("locations");
  renderPresetsList();
  populatePresetFormSelects(settingsPresetsAddForm);
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
      renderSettings();
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
  renderSettings();
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
              <form class="settings-edit-form" data-setting-type="${type}" data-item-id="${item.id}">
                <input type="text" name="label" value="${escapeHtml(item.label)}" required maxlength="60" />
                <input type="number" name="days" value="${item.days}" min="1" max="30" required aria-label="Days in fridge" />
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
      const canMoveUp = index > 0;
      const canMoveDown = index < items.length - 1;

      return `
        <li class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">${escapeHtml(item.label)}</span>
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
      renderSettings();
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
    renderSettings();
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
  if (type === "categories") formEl.days.value = 4;
  renderSettings();
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
    renderSettings();
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
  renderSettings();
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
  renderSettings();
}

function deleteSettingItem(type, id) {
  if (type === "presets") {
    settings.presets = settings.presets.filter((entry) => entry.id !== id);
    saveSettings();
    renderSettings();
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
  renderSettings();
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

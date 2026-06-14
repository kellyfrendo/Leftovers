import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const LEGACY_STORAGE_KEY = "leftovers-fridge";

const CATEGORIES = {
  "cooked-meal": { label: "Cooked meal", days: 4 },
  "meat-poultry": { label: "Meat & poultry", days: 3 },
  "soup-stew": { label: "Soup & stew", days: 4 },
  vegetables: { label: "Vegetables", days: 5 },
  dairy: { label: "Dairy", days: 5 },
  seafood: { label: "Seafood", days: 2 },
  other: { label: "Other", days: 4 },
};

const isConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("your-project") &&
  SUPABASE_ANON_KEY !== "your-anon-key";

let supabase = null;
let leftovers = [];
let activeFilter = "all";

const loadingScreen = document.getElementById("loading-screen");
const configScreen = document.getElementById("config-screen");
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authToggle = document.getElementById("auth-toggle");
const authError = document.getElementById("auth-error");
const authHeading = document.getElementById("auth-heading");
const signOutBtn = document.getElementById("sign-out");
const userEmail = document.getElementById("user-email");

const form = document.getElementById("add-form");
const dateInput = document.getElementById("date");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const containerInput = document.getElementById("container");
const locationInput = document.getElementById("location");
const eatByPreview = document.getElementById("eat-by-preview");
const leftoverList = document.getElementById("leftover-list");
const emptyState = document.getElementById("empty-state");
const statsEl = document.getElementById("stats");
const filterButtons = document.querySelectorAll(".filter-btn");
const addSubmitBtn = form.querySelector('button[type="submit"]');

let authMode = "sign-in";

init();

async function init() {
  hideAllScreens();

  if (!isConfigured) {
    showScreen(configScreen);
    return;
  }

  showScreen(loadingScreen);
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  form.addEventListener("submit", handleSubmit);
  dateInput.addEventListener("change", updateEatByPreview);
  categoryInput.addEventListener("change", updateEatByPreview);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle("filter-btn--active", b === btn));
      render();
    });
  });

  authForm.addEventListener("submit", handleAuthSubmit);
  authToggle.addEventListener("click", toggleAuthMode);
  signOutBtn.addEventListener("click", handleSignOut);

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showApp(session.user);
    } else {
      showAuth();
    }
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await showApp(session.user);
  } else {
    showAuth();
  }
}

function hideAllScreens() {
  [loadingScreen, configScreen, authScreen, appScreen].forEach((el) => {
    el.classList.add("hidden");
  });
}

function showScreen(screen) {
  hideAllScreens();
  screen.classList.remove("hidden");
}

function showAuth() {
  authError.textContent = "";
  showScreen(authScreen);
}

async function showApp(user) {
  userEmail.textContent = user.email;
  dateInput.value = todayString();
  updateEatByPreview();
  showScreen(appScreen);
  await loadLeftovers();
  render();
}

function setAuthMode(mode) {
  authMode = mode;
  authHeading.textContent = authMode === "sign-in" ? "Sign in" : "Create account";
  authSubmit.textContent = authMode === "sign-in" ? "Sign in" : "Create account";
  authToggle.textContent =
    authMode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in";
  authError.textContent = "";
}

function toggleAuthMode(event) {
  event.preventDefault();
  setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  authError.textContent = "";
  authSubmit.disabled = true;

  const email = authEmail.value.trim();
  const password = authPassword.value;

  const { error } =
    authMode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

  authSubmit.disabled = false;

  if (error) {
    authError.textContent = error.message;
    return;
  }

  if (authMode === "sign-up") {
    authError.textContent = "Check your email to confirm your account, then sign in.";
    setAuthMode("sign-in");
  }
}

async function handleSignOut() {
  await supabase.auth.signOut();
}

function fromRow(row) {
  return {
    id: row.id,
    dateAdded: row.date_added,
    description: row.description,
    category: row.category,
    container: row.container,
    location: row.location,
    eatBy: row.eat_by,
  };
}

function toRow(item, userId) {
  return {
    user_id: userId,
    date_added: item.dateAdded,
    description: item.description,
    category: item.category,
    container: item.container,
    location: item.location,
    eat_by: item.eatBy,
  };
}

async function loadLeftovers() {
  const { data, error } = await supabase
    .from("leftovers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  leftovers = (data || []).map(fromRow);
  await maybeImportLegacyData();
}

async function maybeImportLegacyData() {
  if (leftovers.length > 0) return;

  let legacy = [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    legacy = raw ? JSON.parse(raw) : [];
  } catch {
    return;
  }

  if (legacy.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const rows = legacy.map((item) =>
    toRow(
      {
        dateAdded: item.dateAdded,
        description: item.description,
        category: item.category,
        container: item.container,
        location: item.location || "",
        eatBy: item.eatBy,
      },
      user.id
    )
  );

  const { error } = await supabase.from("leftovers").insert(rows);
  if (error) {
    console.error("Legacy import failed:", error);
    return;
  }

  localStorage.removeItem(LEGACY_STORAGE_KEY);
  await loadLeftovers();
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
  const eatBy = addDays(date, CATEGORIES[category].days);
  eatByPreview.textContent = `Eat by ${formatDisplayDate(eatBy)} (${CATEGORIES[category].days} days for ${CATEGORIES[category].label.toLowerCase()})`;
}

async function handleSubmit(event) {
  event.preventDefault();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const item = {
    dateAdded: dateInput.value,
    description: descriptionInput.value.trim(),
    category: categoryInput.value,
    container: containerInput.value,
    location: locationInput.value,
    eatBy: addDays(dateInput.value, CATEGORIES[categoryInput.value].days),
  };

  addSubmitBtn.disabled = true;

  const { data, error } = await supabase
    .from("leftovers")
    .insert(toRow(item, user.id))
    .select()
    .single();

  addSubmitBtn.disabled = false;

  if (error) {
    console.error(error);
    return;
  }

  leftovers.unshift(fromRow(data));

  descriptionInput.value = "";
  containerInput.selectedIndex = 0;
  locationInput.selectedIndex = 0;
  dateInput.value = todayString();
  updateEatByPreview();
  render();
  descriptionInput.focus();
}

async function removeLeftover(id) {
  const { error } = await supabase.from("leftovers").delete().eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  leftovers = leftovers.filter((item) => item.id !== id);
  render();
}

function getFilteredLeftovers() {
  const sorted = [...leftovers].sort((a, b) => {
    const statusOrder = { overdue: 0, soon: 1, fresh: 2 };
    const statusA = getStatus(a.eatBy);
    const statusB = getStatus(b.eatBy);
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    return a.eatBy.localeCompare(b.eatBy);
  });

  if (activeFilter === "all") return sorted;
  return sorted.filter((item) => getStatus(item.eatBy) === activeFilter);
}

function renderStats() {
  const counts = { fresh: 0, soon: 0, overdue: 0 };
  leftovers.forEach((item) => {
    counts[getStatus(item.eatBy)] += 1;
  });

  if (leftovers.length === 0) {
    statsEl.innerHTML = "";
    return;
  }

  statsEl.innerHTML = `
    <span class="stat stat--fresh">${counts.fresh} fresh</span>
    <span class="stat stat--soon">${counts.soon} use soon</span>
    <span class="stat stat--overdue">${counts.overdue} overdue</span>
  `;
}

function render() {
  renderStats();
  const filtered = getFilteredLeftovers();

  emptyState.classList.toggle("hidden", filtered.length > 0 || leftovers.length === 0);
  leftoverList.classList.toggle("hidden", filtered.length === 0);

  if (leftovers.length === 0) {
    emptyState.classList.remove("hidden");
    leftoverList.innerHTML = "";
    return;
  }

  if (filtered.length === 0) {
    leftoverList.innerHTML = `<li class="no-results">No ${activeFilter === "all" ? "" : activeFilter + " "}items to show.</li>`;
    leftoverList.classList.remove("hidden");
    return;
  }

  leftoverList.innerHTML = filtered
    .map((item) => {
      const status = getStatus(item.eatBy);
      const category = CATEGORIES[item.category] || { label: item.category };

      return `
        <li class="card card--${status}">
          <div class="card__main">
            <div class="card__header">
              <h3 class="card__title">${escapeHtml(item.description)}</h3>
              <span class="badge badge--${status}">${statusLabel(status)}</span>
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
                <dt>Category</dt>
                <dd>${category.label}</dd>
              </div>
              <div>
                <dt>Container</dt>
                <dd>${escapeHtml(item.container)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>${escapeHtml(item.location || "—")}</dd>
              </div>
            </dl>
            <p class="card__countdown">${statusMessage(item.eatBy)}</p>
          </div>
          <button
            type="button"
            class="btn btn--ghost card__remove"
            data-id="${item.id}"
            aria-label="Remove ${escapeHtml(item.description)}"
          >
            Ate it
          </button>
        </li>
      `;
    })
    .join("");

  leftoverList.querySelectorAll(".card__remove").forEach((btn) => {
    btn.addEventListener("click", () => removeLeftover(btn.dataset.id));
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

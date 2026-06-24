function setKitchenLinkStatus(message, isError = false) {
  const statusEl = document.getElementById("kitchen-link-status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? "var(--overdue)" : "var(--text-muted)";
}

function populateKitchenLinkForm() {
  const codeEl = document.getElementById("kitchen-link-code");
  if (!codeEl || !window.LeftoversCloud) return;
  codeEl.textContent = window.LeftoversCloud.formatKitchenKey(window.LeftoversCloud.getKitchenKey());
  setKitchenLinkStatus(
    "Use the same code on your iPad, laptop, and other devices to share one fridge."
  );
}

async function handleKitchenJoin(event) {
  event.preventDefault();
  const input = document.getElementById("kitchen-link-join-input");
  const code = input?.value?.trim();
  if (!code) {
    setKitchenLinkStatus("Enter a kitchen code to join.", true);
    return;
  }

  const currentCode = window.LeftoversCloud.formatKitchenKey(window.LeftoversCloud.getKitchenKey());
  const nextCode = window.LeftoversCloud.formatKitchenKey(code);
  if (currentCode === nextCode) {
    setKitchenLinkStatus("This device is already linked to that kitchen.");
    return;
  }

  const confirmed = window.confirm(
    `Join kitchen ${nextCode}? This will replace the fridge data on this device with the shared kitchen.`
  );
  if (!confirmed) return;

  try {
    setKitchenLinkStatus("Joining shared kitchen…");
    const kitchen = await window.LeftoversCloud.joinKitchen(code);
    await window.LeftoversApp.reloadFromCloud(kitchen);
    if (input) input.value = "";
    populateKitchenLinkForm();
    setKitchenLinkStatus(`Linked to kitchen ${nextCode}.`);
  } catch (error) {
    setKitchenLinkStatus(error.message || "Could not join that kitchen.", true);
  }
}

async function handleKitchenCopy() {
  try {
    const code = await window.LeftoversCloud.copyKitchenCode();
    setKitchenLinkStatus(`Copied ${code} to the clipboard.`);
  } catch {
    setKitchenLinkStatus("Could not copy the code automatically. Copy it manually from above.", true);
  }
}

function bindKitchenLinkUI() {
  const form = document.getElementById("kitchen-link-join-form");
  const copyBtn = document.getElementById("kitchen-link-copy");
  if (form) form.addEventListener("submit", handleKitchenJoin);
  if (copyBtn) copyBtn.addEventListener("click", handleKitchenCopy);
}

window.LeftoversKitchenLink = {
  bindKitchenLinkUI,
  populateKitchenLinkForm,
};

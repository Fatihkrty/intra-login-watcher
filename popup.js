let isActive;
let dismissSecond;
let selectedCampuses;

async function getCampuses() {
  const data = await fetch("campuses.json");

  return data.json();
}

async function updateCampusList() {
  const campuses = await getCampuses();

  const isChecked = Boolean(Object.keys(selectedCampuses).length);

  for (let i = 0; i < campuses.length; i++) {
    const campus = campuses[i];

    const input = document.getElementById(campus.id);

    if (isChecked) {
      selectedCampuses = {};
      input.checked = false;
    } else {
      input.checked = true;
      const label = document.querySelector('label[for="' + campus.id + '"]');
      selectedCampuses[campus.id] = label.textContent.trim();
    }
  }
}

async function drawHtml() {
  document.getElementById("title-label").innerText =
    chrome.i18n.getMessage("extension_name");

  document.getElementById("campuses-label").innerText =
    chrome.i18n.getMessage("campuses");

  document.getElementById("select-unselect-btn").innerText =
    chrome.i18n.getMessage("select_unselect");

  document.getElementById("settings-label").innerText =
    chrome.i18n.getMessage("settings");

  document.getElementById("popup-second-label").innerText =
    chrome.i18n.getMessage("popup_second");

  document.getElementById("info-message-label").innerText =
    chrome.i18n.getMessage("info_message");

  document.getElementById("input-description").innerText =
    chrome.i18n.getMessage("inputDescription");

  const campuses = await getCampuses();

  const campusDiv = document.getElementById("campus-list");

  // Fill campus-list div
  for (let i = 0; i < campuses.length; i++) {
    const campus = campuses[i];

    // create div
    const div = document.createElement("div");
    div.className = "form-check";

    // create input
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.id = campus.id;
    input.value = campus.id;
    input.checked = Boolean(selectedCampuses[campus.id]);

    // create label
    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", campus.id);
    label.textContent = campus.name;

    // add input and label in div
    div.appendChild(input);
    div.appendChild(label);

    // add campus-list to div
    campusDiv.appendChild(div);
  }

  // Select Select/Unselect Button
  const selectUnselectBtn = document.getElementById("select-unselect-btn");

  selectUnselectBtn.onclick = async () => {
    await updateCampusList();
    await chrome.storage.local.set({ campusList: selectedCampuses });
  };

  // Start Stop Button
  const startStopBtn = document.getElementById("start-stop-button");

  if (isActive) {
    startStopBtn.textContent = chrome.i18n.getMessage("stop");
    startStopBtn.className = "btn btn-danger";
  } else {
    startStopBtn.textContent = chrome.i18n.getMessage("start");
    startStopBtn.className = "btn btn-success";
  }

  startStopBtn.onclick = () => {
    isActive = !isActive;

    if (isActive) {
      startStopBtn.textContent = chrome.i18n.getMessage("stop");
      startStopBtn.className = "btn btn-danger";
    } else {
      startStopBtn.textContent = chrome.i18n.getMessage("start");
      startStopBtn.className = "btn btn-success";
    }

    chrome.storage.local.set({ isActive });
  };

  // Dismiss Second Input
  const dismissSecondInput = document.getElementById("dismissSecond");
  const inputDescription = document.getElementById("input-description");

  dismissSecondInput.valueAsNumber = dismissSecond || 5000;

  dismissSecondInput.oninput = (e) => {
    const inputNumber = e.target.valueAsNumber;

    if (!Number.isNaN(inputNumber) && inputNumber > -2) {
      inputDescription.textContent = chrome.i18n.getMessage("inputDescription");
      inputDescription.classList.replace("text-danger", "text-muted");
      dismissSecond = inputNumber;
    } else {
      inputDescription.textContent = chrome.i18n.getMessage(
        "inputDescriptionError"
      );
      inputDescription.classList.replace("text-muted", "text-danger");
      dismissSecond = 5000;
    }

    chrome.storage.local.set({ dismissSecond });
  };

  return campusDiv;
}

async function loadConfig() {
  // Load isActive
  const defaultIsActive = await chrome.storage.local.get("isActive");
  isActive = Boolean(defaultIsActive.isActive);

  // Load selectedCampus
  const defaultCampusList = await chrome.storage.local.get("campusList");
  selectedCampuses = defaultCampusList.campusList || {};

  // Load dismissSecond
  const defaultDismissSecond = await chrome.storage.local.get("dismissSecond");
  dismissSecond = defaultDismissSecond.dismissSecond || 5000;
}

async function main() {
  await loadConfig();

  const campusDiv = await drawHtml();

  campusDiv.addEventListener("change", async function (e) {
    if (!e.target || !e.target.matches("input[type='checkbox']")) {
      return;
    }

    const id = e.target.id;
    const label = document.querySelector('label[for="' + id + '"]');

    if (e.target.checked) {
      selectedCampuses[id] = label.textContent.trim();
    } else {
      delete selectedCampuses[id];
    }

    await chrome.storage.local.set({ campusList: selectedCampuses });
  });
}

main();

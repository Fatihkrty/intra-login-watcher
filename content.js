let userId;
let selectedCampuses;
let dismissSecond;
let isActive;

async function getWebsocketData() {
  const socket = new WebSocket("wss://profile.intra.42.fr/cable");

  socket.addEventListener("message", async function (event) {
    if (event.data === '{"type":"welcome"}') {
      if (!userId) {
        console.warn("Not Found User Id !!");
        return;
      }

      socket.send(
        JSON.stringify({
          command: "subscribe",
          identifier: JSON.stringify({
            channel: "LocationChannel",
            user_id: userId,
          }),
        })
      );

      return;
    }

    if (
      !isActive ||
      !event.data.includes("begin_at") ||
      !event.data.includes("LocationChannel")
    ) {
      return;
    }

    try {
      const data = JSON.parse(event.data);

      // Parent Div
      const toastNode = document.createElement("div");
      toastNode.style.display = "flex";
      toastNode.style.alignItems = "center";
      toastNode.style.gap = "10px";

      // Parent Div For Label
      const textContainer = document.createElement("div");
      textContainer.style.display = "flex";
      textContainer.style.flexDirection = "column";

      // Login Text
      const topText = document.createElement("span");
      topText.textContent = data.message.location.login;
      topText.style.fontSize = "16px";
      topText.style.fontWeight = "600";

      // Campus Text
      const bottomText = document.createElement("span");
      bottomText.textContent =
        selectedCampuses[data.message.location.campus_id];
      bottomText.style.fontSize = "12px";
      bottomText.style.color = "#eee";

      textContainer.appendChild(topText);
      textContainer.appendChild(bottomText);

      if (data.message.location.image) {
        // Avatar
        const avatar = document.createElement("img");
        avatar.src = data.message.location.image;
        avatar.style.width = "40px";
        avatar.style.height = "40px";
        avatar.style.borderRadius = "50%";
        avatar.style.objectFit = "cover";

        toastNode.appendChild(avatar);
      }

      toastNode.appendChild(textContainer);

      if (selectedCampuses[data.message.location.campus_id]) {
        Toastify({
          node: toastNode,
          duration: dismissSecond,
          destination: `https://profile.intra.42.fr/users/${data.message.location.login}`,
          newWindow: true,
          close: true,
          gravity: "top",
          position: "right",
          stopOnFocus: true,
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
          onClick: function () {},
        }).showToast();
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.addEventListener("error", function (event) {
    console.error("WebSocket error:", event);
  });

  socket.addEventListener("close", function () {
    console.warn("Connection closed. Please refresh page");
  });
}

async function loadConfig() {
  // Load isActive
  const defaultIsActive = await chrome.storage.local.get("isActive");
  isActive = Boolean(defaultIsActive.isActive);

  // Load userId
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    if (value.includes("user_id")) {
      const userData = JSON.parse(value);

      userId = userData.profile.user_id;

      break;
    }
  }

  // Load selectedCampus
  const defaultCampusList = await chrome.storage.local.get("campusList");
  selectedCampuses = defaultCampusList.campusList || {};

  // Load dismissSecond
  const defaultDismissSecond = await chrome.storage.local.get("dismissSecond");
  dismissSecond = defaultDismissSecond.dismissSecond || 5000;
}

function loadListeners() {
  // Storage onChange
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return;
    }

    if (changes.isActive) {
      isActive = changes.isActive.newValue;
    } else if (changes.dismissSecond) {
      dismissSecond = changes.dismissSecond.newValue;
    } else if (changes.campusList) {
      selectedCampuses = changes.campusList.newValue;
    }
  });
}

(async function main() {
  await loadConfig();
  loadListeners();
  getWebsocketData();
})();

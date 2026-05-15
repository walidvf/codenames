import { firebaseConfig, onlineSyncEnabled } from "./firebase-config.js";

const statusElement = document.querySelector("#onlineStatus");
const copyLobbyLinkButton = document.querySelector("#copyLobbyLinkButton");
const game = window.codenamesGame;

let database = null;
let unsubscribe = null;
let activeOnlineLobby = null;
let applyingRemoteState = false;

function setOnlineStatus(text, mode = "local") {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = text;
  statusElement.dataset.mode = mode;
}

async function copyLobbyLink() {
  const lobby = game.getActiveLobby();
  const link = `${window.location.origin}${window.location.pathname}#lobby-${lobby}`;

  try {
    await window.navigator.clipboard.writeText(link);
    setOnlineStatus("تم نسخ الرابط", onlineSyncEnabled ? "online" : "local");
  } catch (error) {
    setOnlineStatus(link, onlineSyncEnabled ? "online" : "local");
  }
}

function lobbyPath(lobby) {
  return `arabic-codenames/lobbies/${lobby}`;
}

async function writeLobbyState(lobby, state) {
  if (!database || applyingRemoteState) {
    return;
  }

  const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
  await set(ref(database, lobbyPath(lobby)), {
    state,
    updatedAt: Date.now()
  });
}

async function watchLobby(lobby) {
  const { ref, onValue, get, set } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");

  if (unsubscribe) {
    unsubscribe();
  }

  activeOnlineLobby = lobby;
  const currentRef = ref(database, lobbyPath(lobby));
  const snapshot = await get(currentRef);

  if (!snapshot.exists()) {
    await set(currentRef, {
      state: game.getState(),
      updatedAt: Date.now()
    });
  }

  unsubscribe = onValue(currentRef, (nextSnapshot) => {
    const value = nextSnapshot.val();

    if (!value || !value.state) {
      return;
    }

    applyingRemoteState = true;
    game.applyRemoteState(lobby, value.state);
    applyingRemoteState = false;
    setOnlineStatus(`متصل: لوبي ${lobby}`, "online");
  }, () => {
    setOnlineStatus("تعذر الاتصال", "error");
  });
}

async function startOnlineSync() {
  if (!game) {
    setOnlineStatus("غير جاهز", "error");
    return;
  }

  if (!onlineSyncEnabled) {
    setOnlineStatus("محلي", "local");
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
    const { getDatabase } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);

    await watchLobby(game.getActiveLobby());
    setOnlineStatus(`متصل: لوبي ${game.getActiveLobby()}`, "online");
  } catch (error) {
    setOnlineStatus("تعذر الاتصال", "error");
  }
}

copyLobbyLinkButton?.addEventListener("click", copyLobbyLink);

window.addEventListener("codenames:statechange", (event) => {
  if (!onlineSyncEnabled || !database || applyingRemoteState) {
    return;
  }

  const { lobby, state } = event.detail;

  if (lobby !== activeOnlineLobby) {
    watchLobby(lobby).catch(() => setOnlineStatus("تعذر الاتصال", "error"));
    return;
  }

  writeLobbyState(lobby, state).catch(() => setOnlineStatus("تعذر الحفظ", "error"));
});

startOnlineSync();

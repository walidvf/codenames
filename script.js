const WORDS = [
  "قمر", "شمس", "بحر", "نهر", "جبل", "صحراء", "غابة", "مدينة",
  "قرية", "قلعة", "برج", "جسر", "ميناء", "قطار", "طائرة", "سفينة",
  "سيارة", "دراجة", "طريق", "بوابة", "نافذة", "مفتاح", "قفل", "صندوق",
  "خريطة", "بوصلة", "كنز", "ذهب", "فضة", "لؤلؤ", "تاج", "عرش",
  "ملك", "ملكة", "فارس", "جندي", "جاسوس", "رمز", "شفرة", "رسالة",
  "ورقة", "كتاب", "مكتبة", "قلم", "حبر", "لوحة", "صورة", "كاميرا",
  "فيلم", "مسرح", "موسيقى", "بيانو", "طبل", "راديو", "هاتف", "حاسوب",
  "روبوت", "ليزر", "قنبلة", "درع", "سيف", "سهم", "نار", "دخان",
  "ثلج", "مطر", "رياح", "عاصفة", "سحاب", "برق", "نجمة", "كوكب",
  "مدار", "مجرة", "صاروخ", "قمر صناعي", "مختبر", "تجربة", "دواء", "طبيب",
  "قناع", "ساعة", "جرس", "مصباح", "شمعة", "مرآة", "زجاج", "حجر",
  "حديقة", "زهرة", "وردة", "نخلة", "زيتون", "تفاح", "ليمون", "عسل",
  "خبز", "سكر", "ملح", "قهوة", "شاي", "مطبخ", "سوق", "فندق",
  "مدرسة", "جامعة", "محكمة", "بنك", "متحف", "ملعب", "مطار", "نادي",
  "نسر", "أسد", "حوت", "جمل", "حصان", "ثعلب", "صقر", "سمكة",
  "لعبة", "نرد", "بطاقة", "كرة", "شبكة", "مربع", "مثلث", "دائرة",
  "ظل", "صدى", "ضوء", "لون", "حرير", "قطن", "معطف", "قبعة",
  "حذاء", "إبرة", "خيط", "بطارية", "مغناطيس", "محرك", "آلة", "منجم"
];

const ROLE_LABELS = {
  red: "عميل أحمر",
  blue: "عميل أزرق",
  neutral: "مدني",
  assassin: "القاتل"
};

const TEAM_LABELS = {
  red: "الأحمر",
  blue: "الأزرق"
};

const TEAM_NAMES = {
  red: "الفريق الأحمر",
  blue: "الفريق الأزرق"
};

const LOBBY_COUNT = 20;
const ACTIVE_LOBBY_KEY = "arabic-codenames-active-lobby";
const LOBBY_STORAGE_PREFIX = "arabic-codenames-lobby-";

function createEmptyState() {
  return {
    cards: [],
    turn: "red",
    starter: "red",
    spymaster: false,
    clue: null,
    picksLeft: 0,
    gameOver: false,
    log: []
  };
}

const state = createEmptyState();

const board = document.querySelector("#board");
const lobbyGrid = document.querySelector("#lobbyGrid");
const activeLobbyLabel = document.querySelector("#activeLobbyLabel");
const newGameButton = document.querySelector("#newGameButton");
const spymasterButton = document.querySelector("#spymasterButton");
const clueForm = document.querySelector("#clueForm");
const clueInput = document.querySelector("#clueInput");
const countInput = document.querySelector("#countInput");
const passButton = document.querySelector("#passButton");
const clearLogButton = document.querySelector("#clearLogButton");
const redPanel = document.querySelector("#redPanel");
const bluePanel = document.querySelector("#bluePanel");
const redRemaining = document.querySelector("#redRemaining");
const blueRemaining = document.querySelector("#blueRemaining");
const turnLabel = document.querySelector("#turnLabel");
const turnCount = document.querySelector("#turnCount");
const currentClue = document.querySelector("#currentClue");
const logList = document.querySelector("#logList");
const dialog = document.querySelector("#gameDialog");
const dialogKicker = document.querySelector("#dialogKicker");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMessage = document.querySelector("#dialogMessage");
const dialogNewGameButton = document.querySelector("#dialogNewGameButton");

let activeLobby = getInitialLobby();

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function isValidLobby(value) {
  return Number.isInteger(value) && value >= 1 && value <= LOBBY_COUNT;
}

function getStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}

function lobbyStorageKey(lobby) {
  return `${LOBBY_STORAGE_PREFIX}${lobby}`;
}

function getInitialLobby() {
  const hashMatch = window.location.hash.match(/lobby-(\d+)/);
  const hashLobby = hashMatch ? Number.parseInt(hashMatch[1], 10) : NaN;

  if (isValidLobby(hashLobby)) {
    return hashLobby;
  }

  const savedLobby = Number.parseInt(getStoredValue(ACTIVE_LOBBY_KEY) || "1", 10);
  return isValidLobby(savedLobby) ? savedLobby : 1;
}

function saveLobbyState() {
  setStoredValue(lobbyStorageKey(activeLobby), JSON.stringify(state));
  setStoredValue(ACTIVE_LOBBY_KEY, String(activeLobby));
}

function readLobbyState(lobby) {
  const saved = getStoredValue(lobbyStorageKey(lobby));

  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length !== 25) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function lobbyHasGame(lobby) {
  return Boolean(readLobbyState(lobby));
}

function replaceState(nextState) {
  Object.assign(state, createEmptyState(), nextState);
}

function cloneState() {
  return JSON.parse(JSON.stringify(state));
}

function broadcastStateChange() {
  window.dispatchEvent(new CustomEvent("codenames:statechange", {
    detail: {
      lobby: activeLobby,
      state: cloneState()
    }
  }));
}

function updateLobbyUrl() {
  if (!window.history || typeof window.history.replaceState !== "function") {
    return;
  }

  window.history.replaceState(null, "", `#lobby-${activeLobby}`);
}

function teamName(team) {
  return TEAM_NAMES[team];
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildRoles(starter) {
  const second = starter === "red" ? "blue" : "red";
  return shuffle([
    ...Array(9).fill(starter),
    ...Array(8).fill(second),
    ...Array(7).fill("neutral"),
    "assassin"
  ]);
}

function seedNewGame() {
  state.starter = Math.random() > 0.5 ? "red" : "blue";
  state.turn = state.starter;
  state.spymaster = false;
  state.clue = null;
  state.picksLeft = 0;
  state.gameOver = false;
  state.log = [];

  const words = shuffle(WORDS).slice(0, 25);
  const roles = buildRoles(state.starter);

  state.cards = words.map((word, index) => ({
    id: createId(),
    word,
    role: roles[index],
    revealed: false
  }));

  addLog(`${teamName(state.starter)} يبدأ ولديه 9 عملاء.`);
}

function startNewGame() {
  seedNewGame();
  closeDialog();
  render();
}

function selectLobby(lobby) {
  if (!isValidLobby(lobby) || lobby === activeLobby) {
    return;
  }

  activeLobby = lobby;
  setStoredValue(ACTIVE_LOBBY_KEY, String(activeLobby));
  updateLobbyUrl();

  const savedState = readLobbyState(activeLobby);
  if (savedState) {
    replaceState(savedState);
  } else {
    replaceState(createEmptyState());
    seedNewGame();
  }

  closeDialog();
  render();
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 12);
}

function remainingFor(team) {
  return state.cards.filter((card) => card.role === team && !card.revealed).length;
}

function changeTurn() {
  state.turn = state.turn === "red" ? "blue" : "red";
  state.clue = null;
  state.picksLeft = 0;
  addLog(`دور ${teamName(state.turn)}.`);
}

function revealCard(cardId) {
  if (state.gameOver) {
    return;
  }

  if (!state.clue) {
    addLog(`${teamName(state.turn)} يحتاج إلى تلميح أولا.`);
    render();
    return;
  }

  const card = state.cards.find((item) => item.id === cardId);

  if (!card || card.revealed) {
    return;
  }

  card.revealed = true;
  addLog(`تم كشف ${card.word}: ${ROLE_LABELS[card.role]}.`);

  if (card.role === "assassin") {
    const winner = state.turn === "red" ? "blue" : "red";
    endGame(winner, "تم العثور على القاتل", `${teamName(state.turn)} كشف القاتل. فاز ${teamName(winner)}.`);
    return;
  }

  if (remainingFor("red") === 0) {
    endGame("red", "فاز الفريق الأحمر", "الفريق الأحمر عثر على كل عملائه.");
    return;
  }

  if (remainingFor("blue") === 0) {
    endGame("blue", "فاز الفريق الأزرق", "الفريق الأزرق عثر على كل عملائه.");
    return;
  }

  if (card.role !== state.turn) {
    changeTurn();
    render();
    return;
  }

  if (state.picksLeft > 0) {
    state.picksLeft -= 1;
  }

  if (state.clue && state.picksLeft === 0) {
    changeTurn();
  }

  render();
}

function endGame(winner, title, message) {
  state.gameOver = true;
  state.picksLeft = 0;
  addLog(message);
  render();

  dialogKicker.textContent = teamName(winner);
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  if (!dialog.open) {
    dialog.showModal();
  }
}

function closeDialog() {
  if (dialog.open) {
    dialog.close();
  }
}

function setClue(event) {
  event.preventDefault();

  if (state.gameOver) {
    return;
  }

  const clue = clueInput.value.trim();
  const count = Number.parseInt(countInput.value, 10);

  if (!clue || Number.isNaN(count) || count < 1 || count > 9) {
    clueInput.focus();
    return;
  }

  state.clue = { clue, count };
  state.picksLeft = count + 1;
  addLog(`${teamName(state.turn)} أعطى تلميحا: ${clue} ${count}.`);
  clueInput.value = "";
  render();
}

function passTurn() {
  if (state.gameOver) {
    return;
  }

  changeTurn();
  render();
}

function clearLog() {
  state.log = [];
  render();
}

function renderLobbies() {
  const fragment = document.createDocumentFragment();
  activeLobbyLabel.textContent = `لوبي ${activeLobby}`;

  for (let lobby = 1; lobby <= LOBBY_COUNT; lobby += 1) {
    const button = document.createElement("button");
    const hasGame = lobbyHasGame(lobby);
    button.className = `lobby-card${lobby === activeLobby ? " active" : ""}${hasGame ? " saved" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(lobby === activeLobby));
    button.setAttribute("aria-label", `لوبي ${lobby}`);

    const title = document.createElement("strong");
    title.textContent = `لوبي ${lobby}`;

    const status = document.createElement("span");
    if (lobby === activeLobby) {
      status.textContent = "مفتوح الآن";
    } else {
      status.textContent = hasGame ? "محفوظ" : "فارغ";
    }

    button.append(title, status);
    button.addEventListener("click", () => selectLobby(lobby));
    fragment.append(button);
  }

  lobbyGrid.replaceChildren(fragment);
}

function renderBoard() {
  const fragment = document.createDocumentFragment();

  state.cards.forEach((card) => {
    const button = document.createElement("button");
    button.className = `word-card${card.revealed ? " revealed" : ""}`;
    button.type = "button";
    button.dataset.role = card.role;
    button.disabled = state.gameOver || card.revealed || !state.clue;
    button.setAttribute("aria-label", `${card.word}، ${card.revealed ? ROLE_LABELS[card.role] : "مخفي"}`);
    const label = document.createElement("span");
    label.textContent = card.word;
    button.append(label);
    button.addEventListener("click", () => revealCard(card.id));
    fragment.append(button);
  });

  board.replaceChildren(fragment);
}

function renderScores() {
  const redLeft = remainingFor("red");
  const blueLeft = remainingFor("blue");

  redRemaining.textContent = redLeft;
  blueRemaining.textContent = blueLeft;
  redPanel.classList.toggle("active", state.turn === "red" && !state.gameOver);
  bluePanel.classList.toggle("active", state.turn === "blue" && !state.gameOver);

  turnLabel.textContent = state.gameOver ? "انتهت اللعبة" : `دور ${TEAM_LABELS[state.turn]}`;
  turnCount.textContent = state.clue ? `${state.picksLeft} محاولات متبقية` : "بانتظار التلميح";
  currentClue.textContent = state.clue ? `${state.clue.clue} ${state.clue.count}` : "لا يوجد";
}

function renderLog() {
  const fragment = document.createDocumentFragment();

  if (state.log.length === 0) {
    const emptyEntry = document.createElement("li");
    emptyEntry.textContent = "لا توجد أحداث.";
    fragment.append(emptyEntry);
    logList.replaceChildren(fragment);
    return;
  }

  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    fragment.append(item);
  });

  logList.replaceChildren(fragment);
}

function render(options = {}) {
  saveLobbyState();
  renderLobbies();
  document.body.classList.toggle("spymaster", state.spymaster);
  spymasterButton.setAttribute("aria-pressed", String(state.spymaster));
  renderBoard();
  renderScores();
  renderLog();

  if (!options.skipBroadcast) {
    broadcastStateChange();
  }
}

function setupCanvas() {
  const canvas = document.querySelector("#signalCanvas");
  const context = canvas.getContext("2d");
  const points = Array.from({ length: 48 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.0015 + Math.random() * 0.002
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;

    points.forEach((point, index) => {
      point.y += point.speed;
      if (point.y > 1.08) {
        point.y = -0.08;
        point.x = Math.random();
      }

      const x = point.x * width;
      const y = point.y * height;

      context.fillStyle = index % 2 === 0 ? "rgba(201, 78, 69, 0.34)" : "rgba(63, 127, 199, 0.34)";
      context.beginPath();
      context.arc(x, y, 2.2, 0, Math.PI * 2);
      context.fill();

      for (let link = index + 1; link < points.length; link += 1) {
        const other = points[link];
        const otherX = other.x * width;
        const otherY = other.y * height;
        const distance = Math.hypot(x - otherX, y - otherY);

        if (distance < 150) {
          context.strokeStyle = `rgba(246, 240, 232, ${0.12 * (1 - distance / 150)})`;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(otherX, otherY);
          context.stroke();
        }
      }
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function initializeGame() {
  updateLobbyUrl();

  const savedState = readLobbyState(activeLobby);
  if (savedState) {
    replaceState(savedState);
  } else {
    seedNewGame();
  }

  render();
}

window.codenamesGame = {
  applyRemoteState(lobby, nextState) {
    if (!isValidLobby(lobby) || !nextState) {
      return;
    }

    activeLobby = lobby;
    setStoredValue(ACTIVE_LOBBY_KEY, String(activeLobby));
    updateLobbyUrl();
    replaceState(nextState);
    closeDialog();
    render({ skipBroadcast: true });
  },
  getActiveLobby() {
    return activeLobby;
  },
  getState() {
    return cloneState();
  },
  selectLobby,
  startNewGame
};

newGameButton.addEventListener("click", startNewGame);
spymasterButton.addEventListener("click", () => {
  state.spymaster = !state.spymaster;
  render();
});
clueForm.addEventListener("submit", setClue);
passButton.addEventListener("click", passTurn);
clearLogButton.addEventListener("click", clearLog);
dialogNewGameButton.addEventListener("click", startNewGame);
window.addEventListener("hashchange", () => {
  selectLobby(getInitialLobby());
});

setupCanvas();
initializeGame();

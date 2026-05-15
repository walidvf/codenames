const WORDS = [
  "Anchor", "Apple", "Archive", "Atlas", "Aztec", "Badge", "Bank", "Battery",
  "Beacon", "Belt", "Bermuda", "Berry", "Blade", "Board", "Bolt", "Bridge",
  "Brush", "Cabin", "Camel", "Cap", "Caravan", "Castle", "Cell", "Charge",
  "Chest", "Circuit", "Cliff", "Cloud", "Code", "Comet", "Copper", "Court",
  "Crane", "Crown", "Crystal", "Cycle", "Deck", "Delta", "Diamond", "Dice",
  "Dock", "Dragon", "Drift", "Eagle", "Echo", "Engine", "Falcon", "Field",
  "Film", "Flame", "Forest", "Forge", "Frame", "Frost", "Galaxy", "Garden",
  "Giant", "Glove", "Gold", "Grace", "Harbor", "Helix", "Horizon", "Hotel",
  "Ice", "Ivory", "Jacket", "Jupiter", "Key", "Knight", "Lab", "Lantern",
  "Laser", "Lemon", "Library", "Light", "Lion", "Lock", "Magnet", "Maple",
  "Marble", "Market", "Mercury", "Mine", "Mirror", "Model", "Moon", "Needle",
  "Neon", "Ninja", "Novel", "Ocean", "Olive", "Orbit", "Palm", "Paper",
  "Paris", "Park", "Phoenix", "Piano", "Pilot", "Pin", "Pipe", "Pirate",
  "Planet", "Plate", "Pocket", "Portal", "Press", "Queen", "Radar", "Rail",
  "Ranch", "Ray", "River", "Robot", "Rocket", "Rose", "Saddle", "Satellite",
  "Scale", "Seal", "Shadow", "Ship", "Silk", "Skyscraper", "Snow", "Solar",
  "Spark", "Spring", "Square", "Stadium", "Star", "Stone", "Stream", "Strike",
  "Temple", "Thread", "Thunder", "Tower", "Trail", "Triangle", "Trunk",
  "Tunnel", "Vacuum", "Vault", "Vector", "Velvet", "Wave", "Whale", "Window"
];

const ROLE_LABELS = {
  red: "Red agent",
  blue: "Blue agent",
  neutral: "Bystander",
  assassin: "Assassin"
};

const state = {
  cards: [],
  turn: "red",
  starter: "red",
  spymaster: false,
  clue: null,
  picksLeft: 0,
  gameOver: false,
  log: []
};

const board = document.querySelector("#board");
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

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function startNewGame() {
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

  addLog(`${titleCase(state.starter)} starts with 9 agents.`);
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
  addLog(`${titleCase(state.turn)} turn.`);
}

function revealCard(cardId) {
  if (state.gameOver) {
    return;
  }

  if (!state.clue) {
    addLog(`${titleCase(state.turn)} needs a clue.`);
    renderLog();
    return;
  }

  const card = state.cards.find((item) => item.id === cardId);

  if (!card || card.revealed) {
    return;
  }

  card.revealed = true;
  addLog(`${card.word} revealed as ${ROLE_LABELS[card.role].toLowerCase()}.`);

  if (card.role === "assassin") {
    const winner = state.turn === "red" ? "blue" : "red";
    endGame(winner, "Assassin found", `${titleCase(state.turn)} hit the assassin. ${titleCase(winner)} wins.`);
    return;
  }

  if (remainingFor("red") === 0) {
    endGame("red", "Red wins", "Red found every agent.");
    return;
  }

  if (remainingFor("blue") === 0) {
    endGame("blue", "Blue wins", "Blue found every agent.");
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

  dialogKicker.textContent = `${titleCase(winner)} team`;
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
  addLog(`${titleCase(state.turn)} clue: ${clue} ${count}.`);
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
  renderLog();
}

function renderBoard() {
  const fragment = document.createDocumentFragment();

  state.cards.forEach((card) => {
    const button = document.createElement("button");
    button.className = `word-card${card.revealed ? " revealed" : ""}`;
    button.type = "button";
    button.dataset.role = card.role;
    button.disabled = state.gameOver || card.revealed || !state.clue;
    button.setAttribute("aria-label", `${card.word}, ${card.revealed ? ROLE_LABELS[card.role] : "hidden"}`);
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

  turnLabel.textContent = state.gameOver ? "Game over" : `${titleCase(state.turn)} turn`;
  turnCount.textContent = state.clue ? `${state.picksLeft} picks left` : "Awaiting clue";
  currentClue.textContent = state.clue ? `${state.clue.clue} ${state.clue.count}` : "None";
}

function renderLog() {
  const fragment = document.createDocumentFragment();

  if (state.log.length === 0) {
    const emptyEntry = document.createElement("li");
    emptyEntry.textContent = "No entries.";
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

function render() {
  document.body.classList.toggle("spymaster", state.spymaster);
  spymasterButton.setAttribute("aria-pressed", String(state.spymaster));
  renderBoard();
  renderScores();
  renderLog();
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

newGameButton.addEventListener("click", startNewGame);
spymasterButton.addEventListener("click", () => {
  state.spymaster = !state.spymaster;
  render();
});
clueForm.addEventListener("submit", setClue);
passButton.addEventListener("click", passTurn);
clearLogButton.addEventListener("click", clearLog);
dialogNewGameButton.addEventListener("click", startNewGame);

setupCanvas();
startNewGame();

import {
  CARE,
  DEFAULT_STATE,
  FOODS,
  STORAGE_KEY,
  advanceState,
  applyChanges,
  cleanName,
  dayNumber,
  levelInfo,
  makeState,
  moodFor,
  normalizeState,
  statusPhrase,
} from "./game-core.js";

const pixelRow = (...runs) => runs.map(([code, count]) => code.repeat(count)).join("");
const CAPY_PIXELS = [
  pixelRow([".", 24]),
  pixelRow([".", 11], ["d", 2], [".", 11]),
  pixelRow([".", 7], ["d", 3], [".", 1], ["t", 2], [".", 1], ["d", 2], [".", 8]),
  pixelRow([".", 6], ["d", 1], ["m", 9], ["d", 2], [".", 6]),
  pixelRow([".", 5], ["d", 1], ["m", 12], ["d", 1], [".", 5]),
  pixelRow([".", 4], ["d", 1], ["m", 14], ["d", 2], [".", 3]),
  pixelRow([".", 4], ["d", 1], ["m", 15], ["e", 1], ["d", 1], [".", 2]),
  pixelRow([".", 3], ["d", 1], ["m", 18], ["d", 1], [".", 1]),
  pixelRow([".", 3], ["d", 1], ["m", 18], ["e", 1], ["n", 1]),
  pixelRow([".", 3], ["d", 1], ["m", 19], ["d", 1]),
  pixelRow([".", 3], ["d", 1], ["m", 16], ["d", 4]),
  pixelRow([".", 4], ["d", 1], ["m", 16], ["d", 1], [".", 2]),
  pixelRow([".", 5], ["d", 6], ["m", 1], ["d", 7], [".", 5]),
  pixelRow([".", 5], ["d", 1], ["w", 2], ["d", 1], [".", 2], ["d", 1], ["w", 2], ["d", 1], [".", 9]),
  pixelRow([".", 5], ["d", 4], [".", 2], ["d", 4], [".", 9]),
  pixelRow([".", 24]),
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const elements = {
  app: $("#app"),
  day: $("#day-label"),
  clock: $("#clock"),
  habitat: $("#habitat"),
  speech: $("#speech-text"),
  capy: $("#pixel-capy"),
  petButton: $("#pet-button"),
  heartLayer: $("#heart-layer"),
  name: $("#pet-name"),
  level: $("#level"),
  xp: $("#xp-fill"),
  mood: $("#mood"),
  actions: $("#actions"),
  sleepAction: $("#sleep-action"),
  sleepLabel: $("#sleep-label"),
  toast: $("#toast"),
  game: $("#mini-game"),
  gameBall: $("#game-ball"),
  gameScore: $("#game-score"),
  gameTime: $("#game-time"),
  welcomeDialog: $("#welcome-dialog"),
  foodDialog: $("#food-dialog"),
  careDialog: $("#care-dialog"),
  settingsDialog: $("#settings-dialog"),
};

let hasStoredState = false;
let state = loadState();
let currentPhrase = statusPhrase(state);
let toastTimer = 0;
let lastPetAt = 0;
let audioContext;
let gameTimer = 0;
let gameEndsAt = 0;
let gameScore = 0;
let deferredInstallPrompt = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    hasStoredState = Boolean(raw);
    return raw ? advanceState(JSON.parse(raw)) : makeState();
  } catch {
    return makeState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("Der Spielstand konnte nicht gespeichert werden.");
  }
}

function buildPixelCapy() {
  const fragment = document.createDocumentFragment();
  CAPY_PIXELS.forEach((row, y) => {
    [...row].forEach((code, x) => {
      const pixel = document.createElement("span");
      pixel.className = `pixel pixel-${code}`;
      pixel.style.setProperty("--x", x);
      pixel.style.setProperty("--y", y);
      fragment.append(pixel);
    });
  });
  elements.capy.append(fragment);
}

function render(now = Date.now()) {
  state = advanceState(state, now);
  const mood = moodFor(state);
  const level = levelInfo(state.xp);
  const hour = new Date(now).getHours();
  const period = hour < 6 || hour >= 21 ? "night" : hour < 9 || hour >= 18 ? "dusk" : "day";

  elements.day.textContent = `TAG ${dayNumber(state, now)}`;
  elements.clock.textContent = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(now);
  elements.habitat.dataset.period = state.sleeping ? "night" : period;
  elements.habitat.classList.toggle("is-sleeping", state.sleeping);
  elements.capy.dataset.mood = mood.tone;
  elements.capy.classList.toggle("is-dirty", state.clean < 38);
  elements.capy.classList.toggle("is-tired", state.energy < 25 && !state.sleeping);
  elements.name.textContent = state.name.toUpperCase();
  elements.level.textContent = `LV. ${level.level}`;
  elements.xp.style.setProperty("--value", `${level.progress}%`);
  elements.mood.className = `mood mood-${mood.tone}`;
  elements.mood.innerHTML = `<span aria-hidden="true">${state.sleeping ? "☾" : "♥"}</span> ${mood.label}`;
  elements.speech.textContent = currentPhrase;

  const needs = {
    satiety: state.satiety,
    fun: state.fun,
    clean: state.clean,
    energy: state.energy,
  };
  for (const [key, value] of Object.entries(needs)) {
    const output = $(`[data-value="${key}"]`);
    const meter = $(`[data-meter="${key}"]`);
    const rounded = Math.round(value);
    output.textContent = `${rounded}%`;
    meter.style.setProperty("--value", `${rounded}%`);
    meter.dataset.level = rounded < 25 ? "low" : rounded < 55 ? "mid" : "good";
    meter.setAttribute("aria-valuenow", String(rounded));
  }

  elements.sleepLabel.textContent = state.sleeping ? "WECKEN" : "SCHLAFEN";
  elements.sleepAction.querySelector("small").textContent = state.sleeping ? "Guten Morgen" : "Licht aus";
  $$('button[data-action]:not([data-action="sleep"])', elements.actions).forEach((button) => {
    button.disabled = state.sleeping;
  });
  saveState();
}

function talk(phrase, { speak = true } = {}) {
  currentPhrase = phrase;
  elements.speech.textContent = phrase;
  if (speak && state.voice && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "de-DE";
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.toLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }
}

function playSound(kind = "happy") {
  if (!state.sound) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
    const notes = kind === "sleep" ? [330, 262] : kind === "tap" ? [440] : [523, 659];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.08 + 0.09);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * 0.08);
      oscillator.stop(audioContext.currentTime + index * 0.08 + 0.1);
    });
  } catch {
    // Audio is optional; Safari can reject it before the first gesture.
  }
}

function haptic(pattern = 18) {
  if (state.haptics && navigator.vibrate) navigator.vibrate(pattern);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, 2400);
}

function bumpCapy(className) {
  elements.capy.classList.remove("is-eating", "is-cared", "is-loved");
  void elements.capy.offsetWidth;
  elements.capy.classList.add(className);
  window.setTimeout(() => elements.capy.classList.remove(className), 1100);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function closeDialogs() {
  $$('dialog[open]').forEach((dialog) => dialog.close());
}

function feed(key) {
  const item = FOODS[key];
  if (!item) return;
  state = applyChanges(state, item);
  talk(state.satiety > 97 ? "Puh, mein Bauch ist jetzt kugelrund!" : item.phrase);
  bumpCapy("is-eating");
  playSound("happy");
  haptic([20, 35, 20]);
  closeDialogs();
  render();
}

function careFor(key) {
  const item = CARE[key];
  if (!item) return;
  state = applyChanges(state, item);
  talk(item.phrase);
  bumpCapy("is-cared");
  playSound("happy");
  haptic(28);
  closeDialogs();
  render();
}

function toggleSleep() {
  if (state.sleeping) {
    state = advanceState(state);
    state.sleeping = false;
    talk(state.energy > 88 ? "Guten Morgen! Ich fühle mich capystark." : "Huch – bin schon wach!");
    playSound("happy");
  } else {
    state.sleeping = true;
    state.updatedAt = Date.now();
    talk("Gute Nacht. Träum was Flauschiges!", { speak: true });
    playSound("sleep");
  }
  state.interactions += 1;
  haptic(24);
  render();
}

function petCapy(event) {
  if (gameTimer || Date.now() - lastPetAt < 550) return;
  lastPetAt = Date.now();
  if (state.sleeping) {
    talk("Mmmh … noch fünf Capy-Minuten.", { speak: false });
    return;
  }
  state = applyChanges(state, { fun: 0.8, xp: 0.4 });
  talk("Hihi, das kitzelt!", { speak: state.interactions % 5 === 0 });
  bumpCapy("is-loved");
  playSound("tap");
  haptic(12);
  spawnHeart(event);
  render();
}

function spawnHeart(event) {
  const rect = elements.petButton.getBoundingClientRect();
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = "♥";
  heart.style.left = `${event.clientX ? event.clientX - rect.left : rect.width / 2}px`;
  heart.style.top = `${event.clientY ? event.clientY - rect.top : rect.height / 2}px`;
  elements.heartLayer.append(heart);
  window.setTimeout(() => heart.remove(), 900);
}

function moveGameBall() {
  const bounds = elements.game.getBoundingClientRect();
  const ballSize = 54;
  const x = 12 + Math.random() * Math.max(20, bounds.width - ballSize - 24);
  const y = 58 + Math.random() * Math.max(30, bounds.height - ballSize - 76);
  elements.gameBall.style.transform = `translate(${x}px, ${y}px)`;
}

function startGame() {
  if (state.energy < 12) {
    talk("Meine Pfötchen sind zu müde. Erst ein Nickerchen? ");
    return;
  }
  closeDialogs();
  gameScore = 0;
  gameEndsAt = Date.now() + 12_000;
  elements.game.hidden = false;
  elements.gameScore.textContent = "0";
  elements.gameTime.textContent = "12";
  elements.capy.classList.add("is-playing");
  moveGameBall();
  talk("Fang den Ball!", { speak: false });
  gameTimer = window.setInterval(() => {
    const remaining = Math.max(0, Math.ceil((gameEndsAt - Date.now()) / 1000));
    elements.gameTime.textContent = String(remaining);
    if (remaining <= 0) finishGame();
  }, 200);
}

function hitGameBall() {
  if (!gameTimer) return;
  gameScore += 1;
  elements.gameScore.textContent = String(gameScore);
  playSound("tap");
  haptic(10);
  moveGameBall();
}

function finishGame(cancelled = false) {
  if (!gameTimer) return;
  window.clearInterval(gameTimer);
  gameTimer = 0;
  elements.game.hidden = true;
  elements.capy.classList.remove("is-playing");
  if (cancelled) {
    talk("Okay, wir spielen später weiter.", { speak: false });
    return;
  }
  const reward = Math.min(34, 8 + gameScore * 2.5);
  state = applyChanges(state, { fun: reward, energy: -5, satiety: -3, xp: 3 + gameScore * 1.5 });
  talk(gameScore >= 8 ? `Wow, ${gameScore} Treffer! Du bist capyschnell.` : `${gameScore} Treffer! Das hat Spaß gemacht.`);
  playSound("happy");
  render();
}

function syncSettingsForm() {
  $("#settings-name").value = state.name;
  $("#setting-voice").checked = state.voice;
  $("#setting-sound").checked = state.sound;
  $("#setting-haptics").checked = state.haptics;
}

function handleAction(action) {
  if (action === "feed") openDialog(elements.foodDialog);
  if (action === "play") startGame();
  if (action === "care") openDialog(elements.careDialog);
  if (action === "sleep") toggleSleep();
}

buildPixelCapy();
render();

if (!hasStoredState) {
  $("#welcome-name").value = DEFAULT_STATE.name;
  window.setTimeout(() => openDialog(elements.welcomeDialog), 180);
}

elements.actions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) handleAction(button.dataset.action);
});

elements.petButton.addEventListener("click", petCapy);
elements.gameBall.addEventListener("click", hitGameBall);
$("#game-stop").addEventListener("click", () => finishGame(true));

$("#speech-button").addEventListener("click", () => talk(currentPhrase));
$("#settings-button").addEventListener("click", () => {
  syncSettingsForm();
  openDialog(elements.settingsDialog);
});

$("#welcome-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state = makeState(Date.now(), form.get("name"));
  state.voice = form.get("voice") === "on";
  state.sound = form.get("sound") === "on";
  hasStoredState = true;
  saveState();
  elements.welcomeDialog.close();
  talk(`Hallo! Ich bin ${state.name}. Schön, dass du da bist!`);
  playSound("happy");
  render();
});

$("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.name = cleanName($("#settings-name").value);
  state.voice = $("#setting-voice").checked;
  state.sound = $("#setting-sound").checked;
  state.haptics = $("#setting-haptics").checked;
  saveState();
  elements.settingsDialog.close();
  talk(`Alles klar. Du kannst mich ${state.name} nennen.`, { speak: false });
  showToast("Einstellungen gespeichert");
  render();
});

$("#reset-button").addEventListener("click", () => {
  if (window.confirm("Möchtest du deinen gesamten Capygotchi-Spielstand wirklich löschen?")) {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
});

$("#install-help-button").addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const help = $("#install-help");
  help.hidden = !help.hidden;
});

$$('[data-choice="food"]').forEach((button) => button.addEventListener("click", () => feed(button.dataset.key)));
$$('[data-choice="care"]').forEach((button) => button.addEventListener("click", () => careFor(button.dataset.key)));
$$('[data-close]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("#install-help-button").textContent = "APP INSTALLIEREN";
});

window.addEventListener("online", () => showToast("Wieder online – dein Capy ist bereit."));
window.addEventListener("offline", () => showToast("Offline-Modus – dein Spielstand bleibt erhalten."));
window.addEventListener("pagehide", saveState);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    state = advanceState(state);
    currentPhrase = statusPhrase(state);
    render();
  } else {
    saveState();
  }
});

window.setInterval(() => render(), 30_000);
window.setInterval(() => {
  if (!state.sleeping && !gameTimer && !document.hidden) {
    currentPhrase = statusPhrase(state);
    elements.speech.textContent = currentPhrase;
  }
}, 90_000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
